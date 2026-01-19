import pandas as pd
import joblib
import os
from sklearn.ensemble import IsolationForest

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data_ml", "processed", "master_ml_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODEL_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

X = df[[
    "total_enrolments",
    "biometric_updates",
    "demographic_updates"
]]

model = IsolationForest(
    n_estimators=300,
    contamination=0.05,
    random_state=42
)

model.fit(X)

df["anomaly_score"] = -model.decision_function(X)

joblib.dump(model, os.path.join(MODEL_DIR, "isolation_forest.pkl"))
df.to_csv(DATA_PATH, index=False)


CACHE_DIR = os.path.join(BASE_DIR, "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

anomalies = df[df["anomaly_score"] > df["anomaly_score"].quantile(0.95)]

anomalies[[
    "state",
    "district",
    "date",
    "anomaly_score"
]].to_json(
    os.path.join(CACHE_DIR, "anomalies.json"),
    orient="records",
    date_format="iso"
)


