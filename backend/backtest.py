import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import config
from data_pull import DataPuller


class Backtester:
    def __init__(self, data_puller: DataPuller):
        self.data_puller = data_puller
        self.market_data: dict = {}
        self.futures_spread: dict = {}
        self._load_data()

    # ── Data loading ──────────────────────────────────────────────────────
    def _load_data(self):
        print("Loading commodity series...")

        # 1. Load all items from FRED_SERIES mapping
        for item, series_id in config.FRED_SERIES.items():
            if series_id is None:
                continue
            obs = self.data_puller.fetch_fred_series(series_id, item_name=item)
            if not obs:
                continue
            df = pd.DataFrame(obs)
            df["date"]  = pd.to_datetime(df["date"]).dt.normalize()
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna().set_index("date")
            self.market_data[item] = df

        # 2. Generate mock series for ALL supply chain items not already loaded
        all_sc_items = set()
        for link in config.INITIAL_SUPPLY_CHAIN:
            all_sc_items.add(link["upstream"])
            all_sc_items.add(link["downstream"])

        for item in all_sc_items:
            if item in self.market_data:
                continue  # already loaded
            obs = self.data_puller.fetch_fred_series(None, item_name=item)
            if not obs:
                continue
            df = pd.DataFrame(obs)
            df["date"]  = pd.to_datetime(df["date"]).dt.normalize()
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna().set_index("date")
            self.market_data[item] = df

        # 3. Baltic Dry Index → shipping_costs
        bdi = self.data_puller.fetch_baltic_dry_index()
        bdi["date"]  = pd.to_datetime(bdi["date"]).dt.normalize()
        bdi["value"] = pd.to_numeric(bdi["value"], errors="coerce")
        self.market_data["shipping_costs"] = bdi.dropna().set_index("date")

        # Futures spread signals
        self.futures_spread = self.data_puller.fetch_futures_spread()
        print(f"  Loaded {len(self.market_data)} commodity series.")
        print(f"  Futures spreads: {self.futures_spread}")

    # ── Futures multiplier ────────────────────────────────────────────────
    def futures_multiplier(self, upstream: str) -> float:
        """
        Returns a multiplier in [0.5, 1.5] based on the futures spread signal.
        Positive spread (market expects rise) → > 1.0 → amplify downstream weight.
        Negative spread (market expects fall)  → < 1.0 → dampen downstream weight.
        """
        # Map commodity names to futures keys
        mapping = {
            "oil_price": "oil_price",
            "diesel":    "gasoline",
            "natural_gas": "natural_gas",
            "wheat":     "wheat",
            "corn":      "corn",
        }
        key = mapping.get(upstream)
        if key is None or key not in self.futures_spread:
            return 1.0
        spread = self.futures_spread[key]
        # Cap effect: ±30% signal moves multiplier by ±0.5 at most
        return float(np.clip(1.0 + spread * 1.67, 0.5, 1.5))

    # ── Get value safely ──────────────────────────────────────────────────
    def _to_naive(self, dt_str: str) -> pd.Timestamp:
        """Parse date string and strip timezone info."""
        ts = pd.to_datetime(dt_str)
        if ts.tzinfo is not None:
            ts = ts.tz_convert("UTC").tz_localize(None)
        return ts.normalize()

    def _get_val(self, df: pd.DataFrame, dt: pd.Timestamp, fallback=100.0) -> float:
        # Ensure tz-naive comparison
        dt = dt.tz_localize(None) if dt.tzinfo is not None else dt
        try:
            if dt in df.index:
                v = df.loc[dt, "value"]
                return float(v.iloc[0] if isinstance(v, pd.Series) else v)
        except Exception:
            pass
        prev = df[df.index <= dt]
        return float(prev["value"].iloc[-1]) if not prev.empty else fallback

    # ── Timeline simulation ────────────────────────────────────────────────
    def run_simulation(self, event_start_date: str, supply_chain: list,
                       window_days: int = 90) -> dict:
        start_dt = self._to_naive(event_start_date)

        all_items = set()
        for link in supply_chain:
            all_items.add(link["upstream"])
            all_items.add(link["downstream"])

        # Initialise values from historical data or 100 fallback
        current_values = {}
        for item in all_items:
            if item in self.market_data:
                current_values[item] = self._get_val(self.market_data[item], start_dt)
            else:
                current_values[item] = 100.0

        simulation_results = {item: [current_values[item]] for item in all_items}

        for d in range(1, window_days + 1):
            current_dt = start_dt + timedelta(days=d)
            # Start with previous values; apply all link impacts additively
            new_values = {item: current_values.get(item, 100.0) for item in all_items}

            for link in supply_chain:
                upstream   = link["upstream"]
                downstream = link["downstream"]
                lag        = int(link["lag"])
                weight     = float(link["weight"])

                lookback_dt = current_dt - timedelta(days=lag)

                if upstream in self.market_data:
                    u_df = self.market_data[upstream]
                    if start_dt in u_df.index:
                        u_start = self._get_val(u_df, start_dt)
                        u_look  = self._get_val(u_df, lookback_dt, fallback=u_start)
                        pct_chg = (u_look - u_start) / u_start if u_start != 0 else 0.0
                        pct_chg *= self.futures_multiplier(upstream)
                        d_base  = current_values.get(downstream, 100.0)
                        new_values[downstream] = new_values[downstream] + d_base * pct_chg * weight

            current_values = new_values
            for item in all_items:
                simulation_results[item].append(current_values.get(item, 100.0))

        return simulation_results

    # ── Actual series ─────────────────────────────────────────────────────
    def get_actual_series(self, event_start_date: str, window_days: int = 90) -> dict:
        start_dt = self._to_naive(event_start_date)
        end_dt   = start_dt + timedelta(days=window_days)

        full_idx = pd.date_range(start=start_dt, end=end_dt, freq="D")
        actuals  = {}
        for item, df in self.market_data.items():
            actuals[item] = df.reindex(full_idx, method="ffill")["value"].tolist()
        return actuals
