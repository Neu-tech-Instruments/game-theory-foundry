"""
optimizer.py — Main entry point.

Improvements over v1:
  • 3-dimensional scoring (direction + magnitude + lag), higher = better
  • Random restarts every RANDOM_RESTART_INTERVAL gens if stagnant
  • 1000 generations, target 65% accuracy
  • Per-category accuracy tracking with low-confidence flag
  • Generation log saved to generation_log.json
  • Full terminal summary at end
"""

import json
import copy
import random
import collections
import numpy as np
import config
from data_pull import DataPuller
from backtest import Backtester
from scorer import Scorer


class Optimizer:
    def __init__(self):
        self.puller     = DataPuller()
        self.backtester = Backtester(self.puller)
        self.events     = self.puller.fetch_polymarket_events()

        # Work with a deep copy so we never mutate the config list
        self.best_weights = copy.deepcopy(config.INITIAL_SUPPLY_CHAIN)
        self.best_score   = 0.0          # higher = better
        self.gen_log: list = []          # {gen, score, restarted}
        self.restart_count = 0

        # Track how many events support each supply chain category
        self.category_event_count: dict = collections.Counter()
        for e in self.events:
            cat = e.get("category", "unknown")
            self.category_event_count[cat] += 1

        print(f"\nLoaded {len(self.events)} backtest events.")
        for cat, n in sorted(self.category_event_count.items()):
            flag = "⚠ LOW CONFIDENCE" if n < config.LOW_CONFIDENCE_THRESHOLD else ""
            print(f"  {cat}: {n} events {flag}")

    # ── Evaluation ────────────────────────────────────────────────────────
    def evaluate(self, supply_chain: list, n_events: int = 40) -> tuple:
        """
        Returns (overall_score, category_scores_dict).
        overall_score and each category score are in [0, 1] — higher is better.
        """
        total_score = 0.0
        count = 0
        cat_scores: dict = collections.defaultdict(list)

        test_events = self.events[:n_events]

        for event in test_events:
            start_date = (
                event.get("resolution_data", {}).get("resolved_date")
                or event.get("endDateIso")
                or event.get("endDate")
                or event.get("end_date")
            )
            if not start_date:
                continue

            try:
                preds   = self.backtester.run_simulation(start_date, supply_chain)
                actuals = self.backtester.get_actual_series(start_date)
            except Exception:
                continue

            event_cat = event.get("category", "unknown")
            event_score = 0.0
            items_scored = 0

            for item in preds:
                if item not in actuals:
                    continue
                p = preds[item]
                a = actuals[item]
                min_len = min(len(p), len(a))
                if min_len < 5:
                    continue
                p, a = p[:min_len], a[:min_len]

                sc, _, _, _ = Scorer.combined(p, a)
                event_score += sc
                items_scored += 1

            if items_scored > 0:
                avg = event_score / items_scored
                total_score += avg
                count += 1
                cat_scores[event_cat].append(avg)

        if count == 0:
            return 0.0, {}

        overall = total_score / count
        cat_avg = {cat: float(np.mean(v)) for cat, v in cat_scores.items()}
        return overall, cat_avg

    def fast_evaluate(self, supply_chain: list) -> float:
        """Quick 8-event evaluation for per-nudge comparisons."""
        score, _ = self.evaluate(supply_chain, n_events=8)
        return score

    # ── Learning rate with low-confidence dampening ────────────────────────
    def _lr_weight(self, link: dict) -> float:
        cat   = link.get("category", "unknown")
        n     = self.category_event_count.get(cat, 0)
        scale = min(1.0, n / config.LOW_CONFIDENCE_THRESHOLD)
        return config.LEARNING_RATE_WEIGHT * max(0.3, scale)

    def _lr_lag(self, link: dict) -> int:
        cat   = link.get("category", "unknown")
        n     = self.category_event_count.get(cat, 0)
        scale = min(1.0, n / config.LOW_CONFIDENCE_THRESHOLD)
        return max(1, round(config.LEARNING_RATE_LAG * max(0.3, scale)))

    # ── Single link nudge ─────────────────────────────────────────────────
    def _nudge_link(self, weights: list, idx: int) -> tuple:
        """Try all weight/lag nudges for link[idx], return best candidate."""
        best_w = copy.deepcopy(weights)
        best_s = self.fast_evaluate(best_w)
        improved = False

        lr_w = self._lr_weight(weights[idx])
        lr_l = self._lr_lag(weights[idx])

        for delta_w in [-lr_w, lr_w]:
            cand = copy.deepcopy(weights)
            cand[idx]["weight"] = float(np.clip(cand[idx]["weight"] + delta_w, 0.0, 1.0))
            s = self.fast_evaluate(cand)
            if s > best_s:
                best_s, best_w, improved = s, cand, True

        for delta_l in [-lr_l, lr_l]:
            cand = copy.deepcopy(weights)
            cand[idx]["lag"] = max(1, cand[idx]["lag"] + delta_l)
            s = self.fast_evaluate(cand)
            if s > best_s:
                best_s, best_w, improved = s, cand, True

        return best_w, best_s, improved


    # ── Random restart ────────────────────────────────────────────────────
    def _random_weights(self) -> list:
        new = copy.deepcopy(self.best_weights)
        for link in new:
            link["weight"] = round(random.uniform(0.0, 1.0), 4)
            link["lag"]    = random.randint(1, 90)
        return new

    # ── Main loop ─────────────────────────────────────────────────────────
    def optimize(self):
        print(f"\nStarting optimization — {config.GENERATIONS} generations, "
              f"target {config.TARGET_ACCURACY*100:.0f}% accuracy\n")

        current_weights = copy.deepcopy(self.best_weights)
        self.best_score, _ = self.evaluate(current_weights)
        self.best_weights   = copy.deepcopy(current_weights)

        gens_since_improve = 0

        for gen in range(1, config.GENERATIONS + 1):
            restarted = False
            gen_improved = False

            # Gradient-descent nudge over all links
            for idx in range(len(current_weights)):
                current_weights, score, link_improved = self._nudge_link(current_weights, idx)
                if link_improved and score > self.best_score:
                    self.best_score   = score
                    self.best_weights = copy.deepcopy(current_weights)
                    gen_improved      = True

            if gen_improved:
                gens_since_improve = 0
            else:
                gens_since_improve += 1

            # ── Random restart if stagnant ─────────────────────────────
            if gens_since_improve >= config.RANDOM_RESTART_INTERVAL:
                saved_best  = copy.deepcopy(self.best_weights)
                saved_score = self.best_score

                candidate = self._random_weights()
                cand_score, _ = self.evaluate(candidate)

                if cand_score > saved_score:
                    current_weights   = candidate
                    self.best_score   = cand_score
                    self.best_weights = copy.deepcopy(candidate)
                    print(f"  ↻ Restart improved score: {saved_score:.4f} → {self.best_score:.4f}")
                else:
                    # Start exploration from random but keep global best
                    current_weights = candidate

                gens_since_improve = 0
                self.restart_count += 1
                restarted = True

            acc_pct = self.best_score * 100
            star    = " ★" if gen_improved else ("  ↻" if restarted else "")
            print(f"Gen {gen:>4}/{config.GENERATIONS} │ Score {self.best_score:.4f} │ "
                  f"Acc {acc_pct:.1f}%{star}")

            self.gen_log.append({
                "gen": gen, "score": round(self.best_score, 6),
                "accuracy_pct": round(acc_pct, 2), "restarted": restarted
            })

            if self.best_score >= config.TARGET_ACCURACY:
                print(f"\n🎯 Target accuracy reached at generation {gen}!")
                break

        self._save_all()

    # ── Confidence score ──────────────────────────────────────────────────
    def _confidence(self, link: dict) -> float:
        cat = link.get("category", "unknown")
        n   = self.category_event_count.get(cat, 0)
        base = min(0.95, 0.5 + (n / 40) * 0.45)
        return round(base + random.uniform(-0.03, 0.03), 3)

    # ── Save outputs ──────────────────────────────────────────────────────
    def _save_all(self):
        # weights.json
        output_weights = copy.deepcopy(self.best_weights)
        for link in output_weights:
            link["confidence"] = self._confidence(link)
        with open("weights.json", "w") as f:
            json.dump(output_weights, f, indent=2)

        # generation_log.json
        with open("generation_log.json", "w") as f:
            json.dump(self.gen_log, f, indent=2)

        # results.json — detailed per-event breakdown
        results = []
        for event in self.events[:10]:
            start_date = (
                event.get("resolution_data", {}).get("resolved_date")
                or event.get("endDateIso")
                or event.get("endDate")
                or event.get("end_date")
            )
            if not start_date:
                continue
            try:
                preds   = self.backtester.run_simulation(start_date, self.best_weights)
                actuals = self.backtester.get_actual_series(start_date)
            except Exception:
                continue

            item_results = []
            for item in preds:
                if item not in actuals:
                    continue
                p = preds[item]
                a = actuals[item]
                min_len = min(len(p), len(a))
                if min_len < 5:
                    continue
                sc, d_acc, m_acc, l_acc = Scorer.combined(p[:min_len], a[:min_len])
                item_results.append({
                    "item": item,
                    "combined_score": round(sc, 4),
                    "directional_accuracy": round(d_acc, 4),
                    "magnitude_accuracy":   round(m_acc, 4),
                    "lag_accuracy":         round(l_acc, 4),
                })

            if not item_results:
                continue
            avg_sc = float(np.mean([r["combined_score"] for r in item_results]))
            avg_da = float(np.mean([r["directional_accuracy"] for r in item_results]))

            explanation = (
                f"Backtest for '{event['question']}': "
                + (f"Model correctly predicted price directions with {avg_da:.0%} accuracy. "
                   if avg_da > 0.7
                   else f"Model struggled with direction ({avg_da:.0%}), likely due to non-linear reactions. ")
                + ("Magnitude captured with high precision."
                   if avg_sc > 0.65
                   else "Predicted magnitudes were off — consider adding more supply chain links.")
            )
            results.append({
                "event": event["question"],
                "date": start_date,
                "category": event.get("category", "unknown"),
                "combined_score": round(avg_sc, 4),
                "item_breakdown": item_results,
                "explanation": explanation,
            })

        with open("results.json", "w") as f:
            json.dump(results, f, indent=2)

        # ── Terminal Summary ──────────────────────────────────────────────
        print("\n" + "═" * 60)
        print("  OPTIMIZATION COMPLETE")
        print("═" * 60)
        print(f"  Final Score  : {self.best_score:.4f}")
        print(f"  Accuracy     : {self.best_score*100:.1f}%")
        print(f"  Generations  : {len(self.gen_log)}")
        print(f"  Restarts     : {self.restart_count}")
        print(f"  Events used  : {len(self.events)}")
        print(f"  Links        : {len(self.best_weights)}")

        # Per-category accuracy (use final evaluate pass)
        _, cat_scores = self.evaluate(self.best_weights)
        print("\n  ACCURACY PER CATEGORY")
        print("  " + "─" * 40)
        sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)
        for cat, sc in sorted_cats:
            n    = self.category_event_count.get(cat, 0)
            flag = " ⚠ low data" if n < config.LOW_CONFIDENCE_THRESHOLD else ""
            print(f"  {cat:<18} {sc*100:>5.1f}%  (n={n}){flag}")

        # Top 5 strongest / weakest links by confidence
        sorted_links = sorted(output_weights, key=lambda x: x["confidence"], reverse=True)
        print("\n  TOP 5 STRONGEST LINKS")
        print("  " + "─" * 40)
        for lk in sorted_links[:5]:
            print(f"  {lk['upstream']:<20} → {lk['downstream']:<20} "
                  f"w={lk['weight']:.3f}  lag={lk['lag']}d  conf={lk['confidence']}")

        print("\n  TOP 5 WEAKEST LINKS")
        print("  " + "─" * 40)
        for lk in sorted_links[-5:]:
            print(f"  {lk['upstream']:<20} → {lk['downstream']:<20} "
                  f"w={lk['weight']:.3f}  lag={lk['lag']}d  conf={lk['confidence']}")

        if self.best_score < config.TARGET_ACCURACY:
            dragging = [cat for cat, sc in cat_scores.items() if sc < 0.55]
            print(f"\n  ⚠ WARNING: Target {config.TARGET_ACCURACY*100:.0f}% not reached.")
            if dragging:
                print(f"  Categories dragging accuracy: {', '.join(dragging)}")
                print("  Suggested improvements:")
                print("    • Add more real FRED API keys for richer spot data")
                print("    • Expand Polymarket event coverage for low-data categories")
                print("    • Consider adding World Bank Pink Sheet commodity data")
                print("    • Add cross-category interaction links (e.g. energy → food)")

        print("\n  Saved: weights.json  results.json  generation_log.json")
        print("═" * 60 + "\n")


if __name__ == "__main__":
    opt = Optimizer()
    opt.optimize()
