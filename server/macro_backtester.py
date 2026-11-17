#!/usr/bin/env python3
"""
Production macro backtesting is deliberately disabled.

The retired implementation contained hand-authored regime return arrays without
a reproducible source series, point-in-time instrument universe, corporate-action
treatment, transaction-cost model, or out-of-sample validation. Those figures
must not be presented as historical market observations or research results.

Re-enable this module only after implementing a source-backed, point-in-time
historical dataset and a fully tested execution/benchmark methodology.
"""


class MacroBacktestUnavailable(RuntimeError):
    """Raised when a caller attempts to run the retired synthetic backtester."""


def run_macro_backtest(*_args, **_kwargs):
    raise MacroBacktestUnavailable(
        "Macro backtesting is disabled: verified historical market observations "
        "and realistic execution assumptions are not configured."
    )


if __name__ == "__main__":
    import json
    import sys

    print(json.dumps({
        "success": False,
        "code": "MACRO_BACKTEST_UNAVAILABLE",
        "error": "Verified historical observations and execution-cost assumptions are required."
    }))
    sys.exit(2)
