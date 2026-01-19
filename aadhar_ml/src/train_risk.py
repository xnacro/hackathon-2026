import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data_ml", "processed", "master_ml_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
CACHE_DIR = os.path.join(BASE_DIR, "cache")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

df["update_pressure"] = (
    df["biometric_updates"] + df["demographic_updates"]
) / (df["total_enrolments"] + 1)

def label_risk(row):
    if row["update_pressure"] > 0.8:
        return "CRITICAL"
    elif row["update_pressure"] > 0.5:
        return "HIGH"
    elif row["update_pressure"] > 0.2:
        return "MEDIUM"
    else:
        return "LOW"

df["risk_label"] = df.apply(label_risk, axis=1)

X = df[[
    "total_enrolments",
    "biometric_updates",
    "demographic_updates",
    "update_pressure",
    "anomaly_score"
]]

y = df["risk_label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(
    n_estimators=400,
    max_depth=14,
    random_state=42
)

model.fit(X_train, y_train)

joblib.dump(model, os.path.join(MODEL_DIR, "random_forest_risk.pkl"))

df["predicted_risk"] = model.predict(X)

risk_output = df[[
    "state",
    "district",
    "date",
    "predicted_risk",
    "update_pressure",
    "anomaly_score"
]]

risk_output.to_json(
    os.path.join(CACHE_DIR, "risk_alerts.json"),
    orient="records",
    date_format="iso"
)
