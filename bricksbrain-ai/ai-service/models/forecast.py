"""
Future price forecasting using:
  - ARIMA (statsmodels) as the primary, always-available method
  - A lightweight neural forecaster (LSTM via TensorFlow if installed, otherwise an
    MLPRegressor-based sliding-window neural net as an automatic, dependency-light fallback)

Both models are trained on the per-city monthly price-per-sqft index in data/price_history.csv.
"""
import pandas as pd
import numpy as np
import os
import warnings
warnings.filterwarnings("ignore")

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "price_history.csv")

_LSTM_AVAILABLE = False
try:
    import tensorflow as tf  # noqa
    from tensorflow import keras
    _LSTM_AVAILABLE = True
except Exception:
    _LSTM_AVAILABLE = False


def _get_city_series(city: str) -> pd.Series:
    df = pd.read_csv(DATA_PATH, parse_dates=["date"])
    city_df = df[df["city"].str.lower() == city.lower()].sort_values("date")
    if city_df.empty:
        city_df = df.groupby("date")["price_per_sqft"].mean().reset_index()
        city_df.columns = ["date", "price_per_sqft"]
    return city_df.set_index("date")["price_per_sqft"]


def forecast_arima(city: str, months_ahead: int = 36):
    from statsmodels.tsa.arima.model import ARIMA

    series = _get_city_series(city)
    series.index = pd.DatetimeIndex(series.index).to_period("M").to_timestamp()

    model = ARIMA(series, order=(2, 1, 2))
    fitted = model.fit()
    forecast_res = fitted.get_forecast(steps=months_ahead)
    mean = forecast_res.predicted_mean
    conf = forecast_res.conf_int(alpha=0.2)

    future_dates = pd.date_range(series.index[-1] + pd.offsets.MonthBegin(1), periods=months_ahead, freq="MS")
    return {
        "method": "ARIMA(2,1,2)",
        "dates": [d.strftime("%Y-%m") for d in future_dates],
        "predicted_price_per_sqft": [round(float(v), 2) for v in mean.values],
        "lower_bound": [round(float(v), 2) for v in conf.iloc[:, 0].values],
        "upper_bound": [round(float(v), 2) for v in conf.iloc[:, 1].values],
    }


def _sliding_windows(series: np.ndarray, window: int = 6):
    X, y = [], []
    for i in range(len(series) - window):
        X.append(series[i:i + window])
        y.append(series[i + window])
    return np.array(X), np.array(y)


def forecast_lstm(city: str, months_ahead: int = 36):
    series = _get_city_series(city).values.astype(float)
    window = 6
    scale = series.mean()
    norm = series / scale

    if _LSTM_AVAILABLE and len(norm) > window + 10:
        X, y = _sliding_windows(norm, window)
        X = X.reshape((X.shape[0], X.shape[1], 1))
        model = keras.Sequential([
            keras.layers.LSTM(24, activation="tanh", input_shape=(window, 1)),
            keras.layers.Dense(1),
        ])
        model.compile(optimizer="adam", loss="mse")
        model.fit(X, y, epochs=40, verbose=0)
        method = "LSTM (TensorFlow)"
    else:
        # Lightweight dependency-free neural fallback: MLPRegressor on sliding windows
        from sklearn.neural_network import MLPRegressor
        X, y = _sliding_windows(norm, window)
        model = MLPRegressor(hidden_layer_sizes=(32, 16), max_iter=2000, random_state=42)
        model.fit(X, y)
        method = "Neural forecaster (MLP fallback - install tensorflow for full LSTM)"

    window_vals = list(norm[-window:])
    preds = []
    for _ in range(months_ahead):
        x_input = np.array(window_vals[-window:])
        if _LSTM_AVAILABLE and len(norm) > window + 10:
            x_input = x_input.reshape((1, window, 1))
            pred = float(model.predict(x_input, verbose=0)[0][0])
        else:
            pred = float(model.predict(x_input.reshape(1, -1))[0])
        preds.append(pred)
        window_vals.append(pred)

    preds = np.array(preds) * scale
    last_date = _get_city_series(city).index[-1]
    future_dates = pd.date_range(pd.Timestamp(last_date) + pd.offsets.MonthBegin(1), periods=months_ahead, freq="MS")

    return {
        "method": method,
        "dates": [d.strftime("%Y-%m") for d in future_dates],
        "predicted_price_per_sqft": [round(float(v), 2) for v in preds],
    }


def combined_forecast(city: str, area_sqft: float, months_ahead: int = 36):
    arima_result = forecast_arima(city, months_ahead)
    lstm_result = forecast_lstm(city, months_ahead)

    def to_total_price(psf_list):
        return [round(v * area_sqft) for v in psf_list]

    idx_1yr = min(11, months_ahead - 1)
    idx_3yr = min(35, months_ahead - 1)

    return {
        "city": city,
        "months_ahead": months_ahead,
        "arima": {**arima_result, "predicted_total_price": to_total_price(arima_result["predicted_price_per_sqft"])},
        "lstm": {**lstm_result, "predicted_total_price": to_total_price(lstm_result["predicted_price_per_sqft"])},
        "summary": {
            "current_price_per_sqft": round(float(_get_city_series(city).iloc[-1]), 2),
            "forecast_1yr_arima": to_total_price(arima_result["predicted_price_per_sqft"])[idx_1yr],
            "forecast_3yr_arima": to_total_price(arima_result["predicted_price_per_sqft"])[idx_3yr],
            "forecast_1yr_lstm": to_total_price(lstm_result["predicted_price_per_sqft"])[idx_1yr],
            "forecast_3yr_lstm": to_total_price(lstm_result["predicted_price_per_sqft"])[idx_3yr],
        },
    }
