import pandas as pd
from datetime import datetime, timedelta
import config
from data_pull import DataPuller
from backtest import Backtester
from scorer import Scorer

puller = DataPuller()
backtester = Backtester(puller)
events = puller.fetch_polymarket_events()
supply_chain = config.INITIAL_SUPPLY_CHAIN

event = events[0]
start_date = event.get('resolution_data', {}).get('resolved_date') or event.get('end_date')
print(f"Event: {event['question']}, Start Date: {start_date}")

preds = backtester.run_simulation(start_date, supply_chain)
actuals = backtester.get_actual_series(start_date)

print(f"Preds items: {list(preds.keys())}")
print(f"Actuals items: {list(actuals.keys())}")

for item in preds:
    p_len = len(preds[item])
    a_len = len(actuals[item]) if item in actuals else "N/A"
    print(f"Item: {item}, Pred Len: {p_len}, Actual Len: {a_len}")
    if item in actuals:
        print(f"  Actual[0]: {actuals[item][0]}, Pred[0]: {preds[item][0]}")
