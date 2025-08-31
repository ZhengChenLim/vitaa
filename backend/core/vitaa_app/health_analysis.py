# backend/core/vitaa_app/health_analysis.py
from typing import Dict, Any
import requests
import json

# Your n8n webhook URL
WEBHOOK_URL = "https://n8n.tm06.me/webhook-test/health_analysis_openai"

# Optional: map UI activity levels to a canonical internal set
_ACTIVITY_MAP = {
    "sedentary": "sedentary",
    "low": "lightly_active",
    "medium": "moderately_active",
    "high": "very_active",
    "very_high": "extra_active",
}

def _norm(s: Any) -> str:
    return str(s or "").strip()

def _normalize_payload(p: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize the incoming user JSON into a consistent structure and
    compute a few derived metrics for downstream analysis.
    Expected incoming shape (example):
    {
      "Age": 25,
      "Sex": "Male",
      "FamilyHistory": {"Diabetes": "No", "Hypertension": "No"},
      "WeightKg": 120,
      "HeightCm": 180,
      "WaistCircumferenceCm": 100,
      "ActivityLevel": "Low",
      "Smoking": "No",
      "AlcoholConsumption": "Occasional"
    }
    """
    age = int(p.get("Age"))
    sex = _norm(p.get("Sex")).lower()  # 'male'/'female'
    weight = float(p.get("WeightKg"))
    height_cm = float(p.get("HeightCm"))
    waist_cm = float(p.get("WaistCircumferenceCm"))

    activity_in = _norm(p.get("ActivityLevel")).lower()
    activity_level = _ACTIVITY_MAP.get(activity_in, activity_in)  # fallback to raw if missing

    # Derived metrics
    height_m = height_cm / 100.0 if height_cm else 0.0
    bmi = round(weight / (height_m * height_m), 1) if height_m > 0 else None
    whtr = round(waist_cm / height_cm, 2) if height_cm else None  # waist-to-height ratio

    return {
        "age": age,
        "sex": sex,
        "family_history": {
            "diabetes": _norm((p.get("FamilyHistory") or {}).get("Diabetes")).lower(),
            "hypertension": _norm((p.get("FamilyHistory") or {}).get("Hypertension")).lower(),
        },
        "anthropometrics": {
            "weight_kg": weight,
            "height_cm": height_cm,
            "waist_cm": waist_cm,
            "bmi": bmi,
            "waist_to_height_ratio": whtr,
        },
        "lifestyle": {
            "activity_level": activity_level,
            "smoking": _norm(p.get("Smoking")).lower(),
            "alcohol_consumption": _norm(p.get("AlcoholConsumption")).lower(),
        },
        # Keep the original input for traceability downstream (optional)
        "raw_input": p,
    }

def n8n_health_analysis(user_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize and forward to n8n; return n8n's response.
    Raises HTTPError on non-2xx responses.
    """
    normalized = _normalize_payload(user_payload)
    resp = requests.post(WEBHOOK_URL, json=normalized, timeout=10)
    resp.raise_for_status()
    try:
        return resp.json()
    except ValueError:
        # If n8n returns non-JSON text
        return {"status": "ok", "text": resp.text}
