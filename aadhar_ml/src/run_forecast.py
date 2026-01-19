import pandas as pd
import os
import joblib
from prophet import Prophet

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data_ml", "processed")
OUT_DIR = os.path.join(BASE_DIR, "cache")

os.makedirs(OUT_DIR, exist_ok=True)

model = joblib.load(
    os.path.join(MODEL_DIR, "prophet_enrolment_model.pkl")
)

future = model.make_future_dataframe(periods=180)

forecast = model.predict(future)

output = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(180)

output.to_json(
    os.path.join(OUT_DIR, "national_forecast.json"),
    orient="records",
    date_format="iso"
)
