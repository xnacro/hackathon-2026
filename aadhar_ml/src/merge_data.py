import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RAW_DIR = os.path.join(BASE_DIR, "data_ml", "raw_csv")
OUT_DIR = os.path.join(BASE_DIR, "data_ml", "processed")

os.makedirs(OUT_DIR, exist_ok=True)

enrol_path = os.path.join(
    RAW_DIR,
    "api_data_aadhar_enrolment",
    "api_data_aadhar_enrolment_0_500000.csv"
)

bio_path = os.path.join(
    RAW_DIR,
    "api_data_aadhar_biometric",
    "api_data_aadhar_biometric_0_500000.csv"
)

demo_path = os.path.join(
    RAW_DIR,
    "api_data_aadhar_demographic",
    "api_data_aadhar_demographic_0_500000.csv"
)

enrol = pd.read_csv(enrol_path)
bio = pd.read_csv(bio_path)
demo = pd.read_csv(demo_path)

for df in (enrol, bio, demo):
    df["date"] = pd.to_datetime(
        df["date"],
        format="mixed",
        dayfirst=True,
        errors="coerce"
    )
    df.dropna(subset=["date"], inplace=True)

enrol_cols = enrol.columns.str.lower()

age_cols = [c for c in enrol_cols if "age_" in c]
enrol.columns = enrol_cols

enrol["total_enrolments"] = enrol[age_cols].sum(axis=1)

enrol_agg = enrol.groupby(
    ["date", "state", "district"],
    as_index=False
)["total_enrolments"].sum()

bio.columns = bio.columns.str.lower()
bio_age_cols = [c for c in bio.columns if "bio" in c and "age" in c]

bio["biometric_updates"] = bio[bio_age_cols].sum(axis=1)

bio_agg = bio.groupby(
    ["date", "state", "district"],
    as_index=False
)["biometric_updates"].sum()

demo.columns = demo.columns.str.lower()
demo_age_cols = [c for c in demo.columns if "demo" in c and "age" in c]

demo["demographic_updates"] = demo[demo_age_cols].sum(axis=1)

demo_agg = demo.groupby(
    ["date", "state", "district"],
    as_index=False
)["demographic_updates"].sum()

df = enrol_agg.merge(
    bio_agg, on=["date", "state", "district"], how="left"
).merge(
    demo_agg, on=["date", "state", "district"], how="left"
)

df.fillna(0, inplace=True)

output_path = os.path.join(OUT_DIR, "master_ml_dataset.csv")
df.to_csv(output_path, index=False)

print(output_path)
print("Rows:", len(df))
print("Columns:", df.columns.tolist())
