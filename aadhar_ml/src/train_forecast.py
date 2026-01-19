import pandas as pd
import os
import joblib
from prophet import Prophet

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data_ml", "processed", "master_ml_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")

df = pd.read_csv(DATA_PATH)
df["date"] = pd.to_datetime(df["date"])

ts = df.groupby("date")["total_enrolments"].sum().reset_index()
ts.columns = ["ds", "y"]

model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=False,
    daily_seasonality=False
)

model.fit(ts)

os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(model, os.path.join(MODEL_DIR, "prophet_enrolment_model.pkl"))
