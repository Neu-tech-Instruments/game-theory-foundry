import os

# API Configurations
FRED_API_KEY = os.getenv("FRED_API_KEY", "YOUR_FRED_API_KEY")
FRED_BASE_URL = "https://api.stlouisfed.org/fred"
POLYMARKET_BASE_URL = "https://gamma-api.polymarket.com"

# Cache Configuration
CACHE_DIR = "cache"

# Optimization Parameters
GENERATIONS = 1000
RANDOM_RESTART_INTERVAL = 50   # Check every N gens for stagnation
LEARNING_RATE_WEIGHT = 0.02
LEARNING_RATE_LAG = 1
TARGET_ACCURACY = 0.65         # Stop early if reached
LOW_CONFIDENCE_THRESHOLD = 10  # Events needed before full LR applies

# FRED Series — spot prices
FRED_SERIES = {
    "oil_price":      "DCOILWTICO",
    "diesel":         "GASREGW",
    "natural_gas":    "DHHNGSP",
    "bread":          "CUSR0000SAF11",
    "fertilizer":     "WPU0631",
    "lithium":        "WPU119502",
    "electronics":    "CUSR0000SERA",
    "wheat":          "PWHEAMTUSDM",
    "corn":           "PMAIZMTUSDM",
    "steel":          "PCU331221331221",
    "copper":         "PCOPPUSDM",
    "aluminum":       "PALUMUSDM",
    "coal":           "PCOALAUUSDM",
    "shipping_costs": None,     # BDI (loaded separately)
    "electricity":    "APU000072610",
    "plastics":       "WPU0915",
    "semiconductors": "DPCREDIT",  # proxy
    "construction":   "WPUIP2311001",
    "automotive":     "CUSR0000SETA01",
    "packaging":      "WPU091303",
    "meat":           "CUSR0000SAF112",
    "flour":          "WPU012101",
    "vegetable_oil":  "WPU02240501",
}

# FRED Futures series (spot/near-term forward proxies)
FRED_FUTURES = {
    "oil_price":   "DCOILWTICO",   # WTI spot (nearest contract proxy)
    "gasoline":    "GASREGCOVW",
    "oil_spot":    "WTISPLC",
    "natural_gas": "DHHNGSP",
    "wheat":       "PWHEAMTUSDM",
    "corn":        "PMAIZMTUSDM",
}

# Full expanded supply chain
INITIAL_SUPPLY_CHAIN = [
    # ── Fuel ─────────────────────────────────────────────────────────────
    {"upstream": "oil_price",      "downstream": "diesel",          "lag": 8,  "weight": 0.73, "category": "fuel"},
    {"upstream": "diesel",         "downstream": "shipping_costs",  "lag": 14, "weight": 0.55, "category": "shipping"},
    {"upstream": "oil_price",      "downstream": "shipping_costs",  "lag": 10, "weight": 0.30, "category": "shipping"},
    {"upstream": "oil_price",      "downstream": "plastics",        "lag": 21, "weight": 0.50, "category": "energy"},

    # ── Food ─────────────────────────────────────────────────────────────
    {"upstream": "shipping_costs", "downstream": "bread",           "lag": 30, "weight": 0.41, "category": "food"},
    {"upstream": "natural_gas",    "downstream": "fertilizer",      "lag": 20, "weight": 0.65, "category": "agriculture"},
    {"upstream": "fertilizer",     "downstream": "bread",           "lag": 45, "weight": 0.35, "category": "food"},
    {"upstream": "wheat",          "downstream": "flour",           "lag": 14, "weight": 0.55, "category": "agriculture"},
    {"upstream": "flour",          "downstream": "bread",           "lag": 7,  "weight": 0.65, "category": "food"},
    {"upstream": "corn",           "downstream": "animal_feed",     "lag": 10, "weight": 0.50, "category": "agriculture"},
    {"upstream": "animal_feed",    "downstream": "meat",            "lag": 30, "weight": 0.45, "category": "food"},
    {"upstream": "soy",            "downstream": "vegetable_oil",   "lag": 21, "weight": 0.48, "category": "agriculture"},

    # ── Steel ─────────────────────────────────────────────────────────────
    {"upstream": "iron_ore",       "downstream": "steel",           "lag": 21, "weight": 0.50, "category": "steel"},
    {"upstream": "coal",           "downstream": "steel",           "lag": 14, "weight": 0.45, "category": "steel"},
    {"upstream": "steel",          "downstream": "construction",    "lag": 30, "weight": 0.40, "category": "steel"},
    {"upstream": "steel",          "downstream": "automotive",      "lag": 45, "weight": 0.35, "category": "steel"},

    # ── Metals ────────────────────────────────────────────────────────────
    {"upstream": "copper",         "downstream": "electronics",     "lag": 28, "weight": 0.45, "category": "metals"},
    {"upstream": "copper",         "downstream": "construction",    "lag": 35, "weight": 0.38, "category": "metals"},
    {"upstream": "aluminum",       "downstream": "automotive",      "lag": 25, "weight": 0.42, "category": "metals"},
    {"upstream": "aluminum",       "downstream": "packaging",       "lag": 20, "weight": 0.38, "category": "metals"},
    {"upstream": "lithium",        "downstream": "electronics",     "lag": 60, "weight": 0.50, "category": "electronics"},

    # ── Rare Earths ───────────────────────────────────────────────────────
    {"upstream": "lithium",        "downstream": "batteries",       "lag": 60, "weight": 0.40, "category": "rare_earths"},
    {"upstream": "cobalt",         "downstream": "batteries",       "lag": 55, "weight": 0.38, "category": "rare_earths"},
    {"upstream": "rare_earth",     "downstream": "semiconductors",  "lag": 75, "weight": 0.35, "category": "rare_earths"},
    {"upstream": "nickel",         "downstream": "stainless_steel", "lag": 30, "weight": 0.42, "category": "rare_earths"},

    # ── Energy ────────────────────────────────────────────────────────────
    {"upstream": "natural_gas",    "downstream": "electricity",     "lag": 7,  "weight": 0.60, "category": "energy"},
    {"upstream": "coal",           "downstream": "electricity",     "lag": 10, "weight": 0.52, "category": "energy"},
    {"upstream": "electricity",    "downstream": "aluminum",        "lag": 14, "weight": 0.45, "category": "energy"},
    {"upstream": "plastics",       "downstream": "packaging",       "lag": 30, "weight": 0.38, "category": "energy"},

    # ── Semiconductors ────────────────────────────────────────────────────
    {"upstream": "silicon",        "downstream": "semiconductors",  "lag": 45, "weight": 0.42, "category": "semiconductors"},
    {"upstream": "semiconductors", "downstream": "electronics",     "lag": 30, "weight": 0.48, "category": "semiconductors"},
    {"upstream": "semiconductors", "downstream": "automotive",      "lag": 60, "weight": 0.40, "category": "semiconductors"},

    # ── Shipping ──────────────────────────────────────────────────────────
    {"upstream": "port_congestion","downstream": "shipping_costs",  "lag": 7,  "weight": 0.55, "category": "shipping"},
    {"upstream": "shipping_costs", "downstream": "electronics",     "lag": 45, "weight": 0.38, "category": "shipping"},
    {"upstream": "shipping_costs", "downstream": "automotive",      "lag": 50, "weight": 0.35, "category": "shipping"},
]

# All categories for final reporting
CATEGORIES = [
    "food", "fuel", "shipping", "electronics", "agriculture",
    "steel", "metals", "rare_earths", "energy", "semiconductors"
]
