"""
Generates a synthetic-but-realistic Indian real estate dataset and trains:
  1. A RandomForestRegressor for price prediction
  2. Per-city ARIMA-ready historical price index series (saved as CSV) used for forecasting

Run:  python train.py
Outputs:
  models/price_model.pkl
  models/city_encoder.pkl
  models/locality_encoder.pkl
  data/price_history.csv
  data/sample_properties.csv
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

np.random.seed(42)
os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)

CITIES = {
    # city: (base price per sqft, growth trend factor)
    "Bangalore": (7200, 1.09),
    "Mumbai": (18500, 1.07),
    "Delhi": (12500, 1.06),
    "Pune": (6800, 1.10),
    "Hyderabad": (6200, 1.11),
    "Chennai": (6900, 1.08),
    "Gurugram": (9800, 1.10),
    "Noida": (6600, 1.09),
}

PROPERTY_TYPES = ["Apartment", "Villa", "Independent House", "Plot", "Studio"]
FURNISHING = ["Unfurnished", "Semi-Furnished", "Furnished"]

N = 6000
rows = []
for i in range(N):
    city = np.random.choice(list(CITIES.keys()))
    base_psf, _ = CITIES[city]
    bhk = np.random.choice([1, 2, 3, 4, 5], p=[0.12, 0.33, 0.32, 0.17, 0.06])
    area = max(300, int(np.random.normal(bhk * 480, 120)))
    ptype = np.random.choice(PROPERTY_TYPES, p=[0.55, 0.12, 0.18, 0.1, 0.05])
    furnishing = np.random.choice(FURNISHING, p=[0.45, 0.35, 0.2])
    age = np.random.randint(0, 25)
    floor = np.random.randint(0, 30)
    total_floors = max(floor + 1, np.random.randint(3, 35))
    bathrooms = max(1, bhk - np.random.randint(0, 2))

    psf = base_psf * np.random.normal(1.0, 0.18)
    type_mult = {"Apartment": 1.0, "Villa": 1.35, "Independent House": 1.15, "Plot": 0.65, "Studio": 0.9}[ptype]
    furnish_mult = {"Unfurnished": 0.94, "Semi-Furnished": 1.0, "Furnished": 1.09}[furnishing]
    age_mult = max(0.6, 1 - age * 0.012)
    floor_mult = 1 + min(floor, 20) * 0.003

    price = area * psf * type_mult * furnish_mult * age_mult * floor_mult
    price = max(800000, price)

    rows.append({
        "city": city, "propertyType": ptype, "furnishing": furnishing,
        "bhk": bhk, "bathrooms": bathrooms, "areaSqft": area, "age": age,
        "floor": floor, "totalFloors": total_floors, "price": round(price),
    })

df = pd.DataFrame(rows)
df.to_csv("data/sample_properties.csv", index=False)

city_enc = LabelEncoder().fit(df["city"])
type_enc = LabelEncoder().fit(df["propertyType"])
furnish_enc = LabelEncoder().fit(df["furnishing"])

X = pd.DataFrame({
    "city": city_enc.transform(df["city"]),
    "propertyType": type_enc.transform(df["propertyType"]),
    "furnishing": furnish_enc.transform(df["furnishing"]),
    "bhk": df["bhk"], "bathrooms": df["bathrooms"], "areaSqft": df["areaSqft"],
    "age": df["age"], "floor": df["floor"], "totalFloors": df["totalFloors"],
})
y = df["price"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)
model = RandomForestRegressor(n_estimators=120, max_depth=14, min_samples_leaf=4, n_jobs=-1, random_state=42)
model.fit(X_train, y_train)

preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
r2 = r2_score(y_test, preds)
print(f"Model trained. MAE: {mae:,.0f} INR | R2: {r2:.3f}")

joblib.dump(model, "models/price_model.pkl")
joblib.dump({"city": city_enc, "propertyType": type_enc, "furnishing": furnish_enc}, "models/encoders.pkl")

# --- Historical price index per city (for ARIMA/LSTM forecasting demo) ---
months = pd.date_range(end=pd.Timestamp.today(), periods=60, freq="ME")
history_rows = []
for city, (base_psf, growth) in CITIES.items():
    monthly_growth = growth ** (1 / 12)
    val = base_psf * 0.6
    for m in months:
        val = val * monthly_growth * np.random.normal(1.0, 0.01)
        history_rows.append({"city": city, "date": m.strftime("%Y-%m-%d"), "price_per_sqft": round(val, 2)})

hist_df = pd.DataFrame(history_rows)
hist_df.to_csv("data/price_history.csv", index=False)
print("Saved price_history.csv with", len(hist_df), "rows")
print("Training complete.")
