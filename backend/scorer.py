import numpy as np


def _clean(arr):
    """Return array with NaN removed; returns None if < 5 valid values."""
    a = np.array(arr, dtype=float)
    a = a[~np.isnan(a)]
    return a if len(a) >= 5 else None


class Scorer:
    """
    Three-dimensional scorer — each dimension equally weighted (1/3).
    All scores in [0, 1] where HIGHER = BETTER.
    """

    @staticmethod
    def directional_accuracy(predicted, actual):
        p, a = _clean(predicted), _clean(actual)
        if p is None or a is None or len(p) < 2 or len(a) < 2:
            return 0.5
        min_len = min(len(p), len(a)) - 1
        pd_ = np.sign(np.diff(p[:min_len + 1]))
        ad_ = np.sign(np.diff(a[:min_len + 1]))
        return float(np.mean(pd_ == ad_))

    @staticmethod
    def magnitude_accuracy(predicted, actual):
        p, a = _clean(predicted), _clean(actual)
        if p is None or a is None:
            return 0.0
        min_len = min(len(p), len(a))
        p, a = p[:min_len], a[:min_len]
        p0 = p[0] if p[0] != 0 else 1e-9
        a0 = a[0] if a[0] != 0 else 1e-9
        p_pct = (p[1:] - p0) / abs(p0)
        a_pct = (a[1:] - a0) / abs(a0)
        mae = float(np.mean(np.abs(p_pct - a_pct)))
        return max(0.0, 1.0 - mae / 2.0)

    @staticmethod
    def lag_accuracy(predicted, actual, max_lag_days=60):
        p, a = _clean(predicted), _clean(actual)
        if p is None or a is None:
            return 0.0
        p_peak = int(np.argmax(np.abs(np.diff(p))))
        a_peak = int(np.argmax(np.abs(np.diff(a))))
        return max(0.0, 1.0 - abs(p_peak - a_peak) / max_lag_days)

    @staticmethod
    def combined(predicted, actual):
        dir_acc = Scorer.directional_accuracy(predicted, actual)
        mag_acc = Scorer.magnitude_accuracy(predicted, actual)
        lag_acc = Scorer.lag_accuracy(predicted, actual)
        score   = (dir_acc + mag_acc + lag_acc) / 3.0
        return score, dir_acc, mag_acc, lag_acc
