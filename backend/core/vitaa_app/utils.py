from typing import Dict

ACTIVITY_FACTORS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extra_active": 1.9,
}

def mifflin_st_jeor_bmr(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    sex = sex.lower().strip()
    if sex not in ("male", "female"):
        raise ValueError("sex must be 'male' or 'female'")
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    return base + 5 if sex == "male" else base - 161

def calc_targets(payload: Dict) -> Dict:
    """
    Required payload keys:
      - age (int)
      - sex ('male'|'female')
      - weight_kg (float)
      - height_cm (float)
      - activity_level ('sedentary'|'lightly_active'|'moderately_active'|'very_active'|'extra_active')
    Optional goal settings (pick one):
      - weekly_loss_kg (float)      # e.g., 0.5  → ~500 kcal/day deficit
      - deficit_kcal (int)          # e.g., 500  → direct daily deficit
    Optional macro tuning:
      - protein_g_per_kg (float)    # default 1.8 g/kg (within 1.6–2.2)
      - fat_percent (float)         # default 0.25 (25% of calories)
    """
    try:
        age = int(payload["age"])
        sex = str(payload["sex"])
        weight = float(payload["weight_kg"])
        height = float(payload["height_cm"])
        activity_key = str(payload["activity_level"]).lower().strip()
    except KeyError as e:
        raise ValueError(f"missing field: {e.args[0]}")

    if activity_key not in ACTIVITY_FACTORS:
        raise ValueError("invalid activity_level; use one of: " + ", ".join(ACTIVITY_FACTORS.keys()))

    # 1) BMR → TDEE
    bmr = mifflin_st_jeor_bmr(sex, weight, height, age)
    tdee = bmr * ACTIVITY_FACTORS[activity_key]

    # 2) Deficit (default moderate ~500 kcal/day)
    deficit_kcal = payload.get("deficit_kcal")
    weekly_loss_kg = payload.get("weekly_loss_kg")
    if deficit_kcal is None and weekly_loss_kg is not None:
        # 1 kg fat ~ 7700 kcal → spread across 7 days
        deficit_kcal = float(weekly_loss_kg) * 7700.0 / 7.0
    if deficit_kcal is None:
        deficit_kcal = 500.0

    deficit_kcal = float(deficit_kcal)
    # safety clamp: don’t go below 1200/1400 typical floors
    calorie_target = max(tdee - deficit_kcal, 1200 if sex.lower() == "female" else 1400)

    # 3) Macros
    protein_g_per_kg = float(payload.get("protein_g_per_kg", 1.8))
    protein_g_per_kg = max(1.2, min(2.4, protein_g_per_kg))  # keep reasonable bounds
    protein_g = protein_g_per_kg * weight
    protein_kcal = protein_g * 4.0

    fat_percent = float(payload.get("fat_percent", 0.25))
    fat_percent = max(0.20, min(0.35, fat_percent))
    fat_kcal = calorie_target * fat_percent
    fat_g = fat_kcal / 9.0

    # carbs = remainder
    carbs_kcal = max(calorie_target - (protein_kcal + fat_kcal), 0.0)
    carbs_g = carbs_kcal / 4.0

    # 4) Fiber guideline
    fiber_g = 14.0 * (calorie_target / 1000.0)

    # Round for presentation (keep raw too if you like)
    def r(x): return round(x, 1)

    return {
        "inputs": {
            "age": age, "sex": sex, "weight_kg": weight, "height_cm": height,
            "activity_level": activity_key, "tdee": round(tdee, 1),
            "deficit_kcal": round(deficit_kcal, 1),
        },
        "targets": {
            "calories_kcal": r(calorie_target),
            "protein_g": r(protein_g),
            "fat_g": r(fat_g),
            "carbs_g": r(carbs_g),
            "fiber_g": r(fiber_g),
            "macro_split_pct": {
                "protein": r((protein_kcal / calorie_target) * 100.0) if calorie_target else 0.0,
                "fat": r((fat_kcal / calorie_target) * 100.0) if calorie_target else 0.0,
                "carbs": r((carbs_kcal / calorie_target) * 100.0) if calorie_target else 0.0,
            }
        }
    }