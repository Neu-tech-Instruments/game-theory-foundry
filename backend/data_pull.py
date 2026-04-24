import os
import json
import time
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import config

# ── Polymarket geopolitical keyword filter ────────────────────────────────────
GEO_KEYWORDS = [
    "oil", "gas", "sanctions", "war", "conflict", "fed", "inflation",
    "shipping", "tariff", "price", "wheat", "corn", "steel", "copper",
    "semiconductor", "chip", "lithium", "coal", "port", "strike",
    "rare earth", "energy", "commodity", "supply", "diesel", "aluminum",
    "construction", "automotive", "food", "grain", "export", "import",
]

# ── Synthetic events spanning multiple categories ─────────────────────────────
SYNTHETIC_EVENTS = [
    # Fuel / Oil
    {"question": "Will crude oil exceed $100 in 2024?",           "endDateIso": "2024-03-15T00:00:00Z", "category": "fuel"},
    {"question": "Will US gasoline average above $4 in Q3 2023?", "endDateIso": "2023-09-01T00:00:00Z", "category": "fuel"},
    {"question": "Will OPEC cut production in Oct 2023?",         "endDateIso": "2023-10-15T00:00:00Z", "category": "fuel"},
    {"question": "Will Brent crude drop below $75 in 2024?",      "endDateIso": "2024-06-01T00:00:00Z", "category": "fuel"},
    # Shipping
    {"question": "Will Red Sea shipping disruption last >60 days?","endDateIso": "2024-01-10T00:00:00Z", "category": "shipping"},
    {"question": "Will Panama Canal restrictions ease by Apr 2024?","endDateIso": "2024-04-01T00:00:00Z","category": "shipping"},
    {"question": "Will Baltic Dry Index exceed 2000 in 2023?",     "endDateIso": "2023-11-01T00:00:00Z", "category": "shipping"},
    {"question": "Will US East Coast port strike occur in 2024?",  "endDateIso": "2024-09-30T00:00:00Z", "category": "shipping"},
    {"question": "Will shipping costs double vs 2023 by mid-2024?","endDateIso": "2024-06-30T00:00:00Z", "category": "shipping"},
    # Agriculture / Food
    {"question": "Will wheat prices spike >30% post-Ukraine?",     "endDateIso": "2022-06-01T00:00:00Z", "category": "agriculture"},
    {"question": "Will corn futures exceed $8 in 2022?",           "endDateIso": "2022-05-01T00:00:00Z", "category": "agriculture"},
    {"question": "Will El Niño impact grain prices in 2023?",      "endDateIso": "2023-12-01T00:00:00Z", "category": "agriculture"},
    {"question": "Will India's rice export ban lift by 2024?",     "endDateIso": "2024-03-01T00:00:00Z", "category": "agriculture"},
    {"question": "Will global food inflation exceed 10% in 2022?", "endDateIso": "2022-10-01T00:00:00Z", "category": "food"},
    {"question": "Will bread prices rise >15% in EU in 2023?",     "endDateIso": "2023-06-01T00:00:00Z", "category": "food"},
    # Semiconductors
    {"question": "Will chip shortage ease by Q4 2022?",            "endDateIso": "2022-12-01T00:00:00Z", "category": "semiconductors"},
    {"question": "Will TSMC build US fab by 2025?",                "endDateIso": "2024-12-31T00:00:00Z", "category": "semiconductors"},
    {"question": "Will China restrict rare earth exports in 2023?", "endDateIso": "2023-07-01T00:00:00Z", "category": "rare_earths"},
    {"question": "Will US ban chip exports to China in 2023?",     "endDateIso": "2023-10-01T00:00:00Z", "category": "semiconductors"},
    {"question": "Will semiconductor inventories normalize in 2023?","endDateIso": "2023-09-01T00:00:00Z","category": "semiconductors"},
    # Metals / Steel
    {"question": "Will US steel tariffs remain in 2023?",          "endDateIso": "2023-03-01T00:00:00Z", "category": "steel"},
    {"question": "Will iron ore drop below $100 in 2023?",         "endDateIso": "2023-08-01T00:00:00Z", "category": "steel"},
    {"question": "Will copper hit $10k per tonne in 2024?",        "endDateIso": "2024-05-01T00:00:00Z", "category": "metals"},
    {"question": "Will aluminum sanctions on Russia persist in 2023?","endDateIso": "2023-06-01T00:00:00Z","category": "metals"},
    {"question": "Will nickel prices normalise after LME halt?",   "endDateIso": "2022-12-01T00:00:00Z", "category": "metals"},
    # Rare Earths
    {"question": "Will lithium prices fall 50% from 2022 peak?",   "endDateIso": "2023-12-01T00:00:00Z", "category": "rare_earths"},
    {"question": "Will cobalt supply tighten in 2024?",            "endDateIso": "2024-06-01T00:00:00Z", "category": "rare_earths"},
    {"question": "Will DRC cobalt exports face sanctions?",         "endDateIso": "2023-09-01T00:00:00Z", "category": "rare_earths"},
    # Energy
    {"question": "Will EU gas prices stay >€50/MWh in 2023?",     "endDateIso": "2023-03-01T00:00:00Z", "category": "energy"},
    {"question": "Will Germany avoid energy rationing in 2022?",   "endDateIso": "2022-12-01T00:00:00Z", "category": "energy"},
    {"question": "Will US natural gas hit $10/MMBtu in 2022?",     "endDateIso": "2022-08-01T00:00:00Z", "category": "energy"},
    {"question": "Will LNG exports from US increase >20% in 2023?","endDateIso": "2023-12-01T00:00:00Z", "category": "energy"},
    {"question": "Will coal prices stay elevated through 2023?",   "endDateIso": "2023-06-01T00:00:00Z", "category": "energy"},
    # Automotive / Construction
    {"question": "Will EV battery costs drop 20% by 2024?",        "endDateIso": "2024-06-01T00:00:00Z", "category": "automotive"},
    {"question": "Will US housing starts fall in 2023?",           "endDateIso": "2023-12-01T00:00:00Z", "category": "construction"},
    # Fed / Macro
    {"question": "Will Fed raise rates in June 2023?",             "endDateIso": "2023-06-15T00:00:00Z", "category": "macro"},
    {"question": "Will US CPI fall below 4% in 2023?",             "endDateIso": "2023-12-01T00:00:00Z", "category": "macro"},
    {"question": "Will Fed pivot to rate cuts in 2024?",           "endDateIso": "2024-03-01T00:00:00Z", "category": "macro"},
    {"question": "Will US recession occur in 2023?",               "endDateIso": "2023-12-31T00:00:00Z", "category": "macro"},
    # Sanctions / Geopolitical
    {"question": "Will Russia oil sanctions tighten in 2023?",     "endDateIso": "2023-02-01T00:00:00Z", "category": "fuel"},
    {"question": "Will Iran oil sanctions be lifted in 2024?",     "endDateIso": "2024-06-01T00:00:00Z", "category": "fuel"},
]


class DataPuller:
    def __init__(self):
        if not os.path.exists(config.CACHE_DIR):
            os.makedirs(config.CACHE_DIR)

    # ── Polymarket ────────────────────────────────────────────────────────
    def fetch_polymarket_events(self):
        cache_path = os.path.join(config.CACHE_DIR, "polymarket_events.json")
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                return json.load(f)

        print("Fetching Polymarket resolved events...")
        all_events = []
        try:
            for offset in range(0, 300, 50):
                resp = requests.get(
                    f"{config.POLYMARKET_BASE_URL}/markets",
                    params={"closed": "true", "active": "false", "limit": 50, "offset": offset},
                    timeout=10
                )
                if resp.status_code != 200:
                    break
                batch = resp.json()
                if not batch:
                    break
                filtered = [
                    m for m in batch
                    if any(k in m.get("question", "").lower() for k in GEO_KEYWORDS)
                ]
                all_events.extend(filtered)
                time.sleep(0.3)

            print(f"  Fetched {len(all_events)} Polymarket events. Merging with synthetics.")
        except Exception as e:
            print(f"  Polymarket fetch failed ({e}). Using synthetics only.")

        # Always include synthetics to guarantee coverage across categories
        events = SYNTHETIC_EVENTS + all_events
        with open(cache_path, "w") as f:
            json.dump(events, f)
        return events

    # ── FRED spot ─────────────────────────────────────────────────────────
    def fetch_fred_series(self, series_id, item_name=None):
        """
        Fetch (or generate mock) a price series.
        series_id: FRED ticker or None.
        item_name: used as seed when generating mocks for unmapped items.
        """
        seed_key = series_id or item_name or "unknown"
        cache_path = os.path.join(config.CACHE_DIR, f"fred_{seed_key}.json")
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                return json.load(f)

        # No real key → always mock
        if config.FRED_API_KEY == "YOUR_FRED_API_KEY" or series_id is None:
            data = self._mock_fred(seed_key)
            with open(cache_path, "w") as f:
                json.dump(data, f)
            return data

        print(f"  Fetching FRED {series_id}...")
        try:
            resp = requests.get(
                f"{config.FRED_BASE_URL}/series/observations",
                params={"series_id": series_id, "api_key": config.FRED_API_KEY,
                        "file_type": "json", "sort_order": "asc"},
                timeout=15
            )
            resp.raise_for_status()
            data = resp.json().get("observations", [])
            with open(cache_path, "w") as f:
                json.dump(data, f)
            return data
        except Exception as e:
            print(f"  FRED {series_id} failed ({e}). Using mock.")
            data = self._mock_fred(seed_key)
            with open(cache_path, "w") as f:
                json.dump(data, f)
            return data

    def _mock_fred(self, series_id):
        """Realistic synthetic price series via geometric Brownian motion."""
        np.random.seed(abs(hash(series_id)) % (2**31))
        dates = pd.date_range("2020-01-01", datetime.now(), freq="D")
        base = 100.0
        drift, vol = 0.0002, 0.012
        prices = [base]
        for _ in range(len(dates) - 1):
            prices.append(prices[-1] * np.exp(drift + vol * np.random.randn()))
        return [{"date": d.strftime("%Y-%m-%d"), "value": str(round(v, 4))}
                for d, v in zip(dates, prices)]

    # ── FRED futures spread ────────────────────────────────────────────────
    def fetch_futures_spread(self):
        """
        Returns {commodity: spread_signal} where spread_signal > 0 means
        futures above spot (market expects price rise) and < 0 means fall.
        """
        cache_path = os.path.join(config.CACHE_DIR, "futures_spread.json")
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                return json.load(f)

        spreads = {}
        for name, ticker in config.FRED_FUTURES.items():
            obs = self.fetch_fred_series(ticker)
            if len(obs) < 90:
                spreads[name] = 0.0
                continue
            df = pd.DataFrame(obs)
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna()
            if len(df) < 90:
                spreads[name] = 0.0
                continue
            spot_now = float(df["value"].iloc[-1])
            spot_3m_ago = float(df["value"].iloc[-90])   # 90-day trailing = "3-month"
            if spot_3m_ago == 0:
                spreads[name] = 0.0
            else:
                # Positive = market has been rising (backwardation signal)
                spreads[name] = round((spot_now - spot_3m_ago) / spot_3m_ago, 6)

        with open(cache_path, "w") as f:
            json.dump(spreads, f)
        return spreads

    # ── Baltic Dry Index ───────────────────────────────────────────────────
    def fetch_baltic_dry_index(self):
        cache_path = os.path.join(config.CACHE_DIR, "baltic_dry_index.csv")
        if os.path.exists(cache_path):
            return pd.read_csv(cache_path)

        print("  Generating synthetic Baltic Dry Index data...")
        np.random.seed(42)
        dates = pd.date_range("2020-01-01", datetime.now(), freq="D")
        prices = [1200.0]
        for _ in range(len(dates) - 1):
            shock = 1.0
            if np.random.random() < 0.005:   # ~5 spikes per year
                shock = np.random.uniform(1.3, 1.8)
            prices.append(max(400, prices[-1] * np.exp(0.0003 + 0.02 * np.random.randn()) * shock))

        df = pd.DataFrame({"date": dates.strftime("%Y-%m-%d"), "value": prices})
        df.to_csv(cache_path, index=False)
        return df
