# vitaa_app/meal_planner_service.py
import json
import ast
import random
from itertools import combinations
from typing import Dict, List

import numpy as np
import pandas as pd

from vitaa_app.models import Dish, AllergenDish

# ---------- KNOBS ----------
MEAL_SPLIT = {"Breakfast": 0.30, "Lunch": 0.40, "Dinner": 0.30}
MAX_ITEMS_PER_MEAL = 3
MIN_CAL_PER_DISH = 120
SIDE_MAX_KCAL = 350
MAIN_MIN_KCAL = 250
MAIN_MIN_PROTEIN_G = 15.0
MAIN_MIN_PROT_DENS = 7.0  # % protein per 100 kcal
FAT_BOMB_RATIO = 2.0
WEIGHT_LOSS_FAT_PENALTY = 0.6
MAINT_FAT_PENALTY = 0.25
PROTEIN_BONUS = 0.15
RANDOM_TOPK = 5

# ---------- BANNED KEYWORDS ----------
ALCOHOL_WORDS = {
    "beer","lager","ale","wine","cider","whisky","whiskey","vodka","rum","gin","soju","sake","liqueur","brandy"
}
BEVERAGE_WORDS = {
    "coffee","tea","cola","soda","soft drink","energy drink","water","sparkling","milk tea","bubble tea"
}
DESSERT_SWEET_WORDS = {
    "sugar","honey","syrup","candy","dessert","ice cream","gelato","chocolate",
    "cake","cupcake","cookie","biscuit","pastry","donut","doughnut","sweet","caramel",
    "jam","jelly","marshmallow","sweetened","toffee"
}
BANNED_NAME_KEYWORDS = ALCOHOL_WORDS | BEVERAGE_WORDS | DESSERT_SWEET_WORDS


# ---------- HELPERS ----------
def parse_list_cell(cell):
    """Parse an ingredients cell that may be JSON list or comma-separated text."""
    if isinstance(cell, list):
        return cell
    try:
        v = ast.literal_eval(cell)
        if isinstance(v, list):
            return v
        if isinstance(v, str) and v:
            return [s.strip() for s in v.split(",") if s.strip()]
    except Exception:
        pass
    return [s.strip() for s in str(cell or "").split(",") if s.strip()]


def to_num(df, cols):
    for c in cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def name_has(any_name, wordset):
    n = (any_name or "").lower()
    return any(w in n for w in wordset)


def is_banned_row(row):
    n = str(row.get("dish_name") or "").lower()
    if name_has(n, BANNED_NAME_KEYWORDS):
        return True
    p = row.get("protein_g", 0) or 0
    f = row.get("fat_g", 0) or 0
    c = row.get("carbohydrate_g", 0) or 0
    # Filter out pure-carb items with almost no protein/fat (likely drinks/sweets)
    if p < 1 and f <= 1 and c >= 30:
        return True
    return False


def score_combo(rows, kcal_target, weight_loss=False):
    cal = sum(float(r["calories_kcal"]) for r in rows)
    prot = sum(float(r["protein_g"]) for r in rows)
    fat = sum(float(r["fat_g"]) for r in rows)
    carbs = sum(float(r["carbohydrate_g"]) for r in rows)
    cal_diff = abs(cal - kcal_target)
    fat_pen = (WEIGHT_LOSS_FAT_PENALTY if weight_loss else MAINT_FAT_PENALTY) * fat
    prot_boost = PROTEIN_BONUS * prot
    score = cal_diff + fat_pen - prot_boost
    return score, cal, prot, fat, carbs


def is_main(row):
    if is_banned_row(row):
        return False
    kcal = float(row["calories_kcal"])
    prot = float(row["protein_g"])
    fat = float(row["fat_g"])
    carbs = float(row["carbohydrate_g"])
    if kcal < MAIN_MIN_KCAL:
        return False
    pdens = (prot / kcal) * 100 if kcal > 0 else 0
    if prot < MAIN_MIN_PROTEIN_G and pdens < MAIN_MIN_PROT_DENS:
        return False
    if fat > FAT_BOMB_RATIO * prot and carbs < 20:
        return False
    if kcal < MIN_CAL_PER_DISH:
        return False
    return True


def is_side(row):
    if is_banned_row(row):
        return False
    kcal = float(row["calories_kcal"])
    name = str(row.get("dish_name") or "").lower()
    if kcal <= SIDE_MAX_KCAL:
        return True
    if ("nut" in name or "seed" in name):
        return True
    return False


def detect_allergens(allergen_str, blocklist_lower):
    s = str(allergen_str or "").lower()
    return any(a in s for a in blocklist_lower)


def choose_meal(main_df, side_df, kcal_target, weight_loss, used_names, randomness_topk=RANDOM_TOPK):
    mains = main_df[~main_df["dish_name"].fillna("").isin(used_names)].copy()
    sides = side_df[~side_df["dish_name"].fillna("").isin(used_names)].copy()

    if mains.empty and not main_df.empty:
        mains = main_df.copy()
    if sides.empty and not side_df.empty:
        sides = side_df.copy()
    if mains.empty:
        return ["No suitable dishes"], {"calories": 0, "Protein_g": 0, "Fat_g": 0, "Carbs_g": 0}

    mains = mains.sample(frac=1, random_state=np.random.randint(0, 1_000_000)).reset_index(drop=True)
    sides = sides.sample(frac=1, random_state=np.random.randint(0, 1_000_000)).reset_index(drop=True)

    combos = []
    # 1 item (main only)
    for i in range(min(len(mains), 20)):
        rows = [mains.iloc[i]]
        combos.append((score_combo(rows, kcal_target, weight_loss), rows))
    # 2 items (main + side)
    for i in range(min(len(mains), 20)):
        for j in range(min(len(sides), 30)):
            rows = [mains.iloc[i], sides.iloc[j]]
            if len({str(r["dish_name"]) for r in rows}) < len(rows):
                continue
            combos.append((score_combo(rows, kcal_target, weight_loss), rows))
    # 3 items (main + 2 sides)
    for i in range(min(len(mains), 15)):
        for j, k in combinations(range(min(len(sides), 30)), 2):
            rows = [mains.iloc[i], sides.iloc[j], sides.iloc[k]]
            if len({str(r["dish_name"]) for r in rows}) < len(rows):
                continue
            combos.append((score_combo(rows, kcal_target, weight_loss), rows))

    if not combos:
        return ["No suitable dishes"], {"calories": 0, "Protein_g": 0, "Fat_g": 0, "Carbs_g": 0}

    combos.sort(key=lambda x: x[0][0])
    topk = min(randomness_topk, len(combos))
    chosen_score, best_rows = random.choice(combos[:topk])
    score, cal, prot, fat, carbs = chosen_score
    names = [str(r["dish_name"]) for r in best_rows]

    return names, {
        "calories": round(cal, 1),
        "Protein_g": round(prot, 1),
        "Fat_g": round(fat, 1),
        "Carbs_g": round(carbs, 1),
    }


# ---------- DATA LOAD ----------
def _load_dishes_from_db() -> pd.DataFrame:
    """
    Pulls dishes + allergens from the DB and returns a DataFrame
    aligned to the old CSV shape.
    """
    # 1) Pull dishes; primary key is dish_id (NOT id)
    base = list(Dish.objects.values(
        "dish_id", "dish_name", "veg_class", "ingredients",
        "calories_kcal", "protein_g", "fat_g", "carbohydrate_g",
        "image_url",
    ))

    # 2) Build allergen list per dish_id
    ad = (AllergenDish.objects
          .select_related("allergen", "dish")
          .values("dish_id", "allergen__allergen_name"))

    allergen_map = {}
    for row in ad:
        d = row["dish_id"]
        allergen_map.setdefault(d, []).append((row["allergen__allergen_name"] or "").strip().lower())

    # 3) Shape records like the CSV the planner expects
    def _parse_ingredients(raw):
        if not raw:
            return []
        # try JSON list first
        try:
            temp = json.loads(raw)
            if isinstance(temp, list):
                return temp
            if isinstance(temp, str) and temp:
                return [s.strip() for s in temp.split(",") if s.strip()]
        except Exception:
            pass
        # fallback: comma-separated string
        return [s.strip() for s in str(raw).split(",") if s.strip()]

    records = []
    for r in base:
        allergens = ", ".join(allergen_map.get(r["dish_id"], []))
        ingredients_list = _parse_ingredients(r.get("ingredients"))

        records.append({
            "dish_name": r["dish_name"],
            "diet_class": r["veg_class"],             # CSV used diet_class; DB has veg_class
            "ingredients": json.dumps(ingredients_list),  # keep same cell type as CSV
            "allergens": allergens,
            "calories_kcal": r["calories_kcal"],
            "protein_g": r["protein_g"],
            "fat_g": r["fat_g"],
            "carbohydrate_g": r["carbohydrate_g"],
            "image_url": r.get("image_url"),
        })

    df = pd.DataFrame.from_records(records)
    if df.empty:
        return df

    df = to_num(df, ["calories_kcal", "protein_g", "fat_g", "carbohydrate_g"])
    df = df.dropna(subset=["calories_kcal", "protein_g", "fat_g", "carbohydrate_g"])
    df = df[df["calories_kcal"] > 0]
    df["ingredients_list"] = df["ingredients"].apply(parse_list_cell)
    return df


# ---------- PUBLIC API ----------
def generate_meal_plan(goals: Dict) -> List[Dict]:
    """
    Input 'goals' minimal structure:
    {
      "energy": {"target_kcal": float},
      "inputs": {
        "fitness_goal": "weight loss" | "maintenance" | "gain",
        "diet": {
          "diet_preference": "vegan|vegetarian|non-veg|any",
          "include_eggs": true,
          "allergies": ["nuts", ...]
        }
      }
    }
    """
    df = _load_dishes_from_db()
    if df.empty:
        raise ValueError("No dishes available in database.")

    target_kcal = float(goals.get("energy", {}).get("target_kcal", 0))
    if target_kcal <= 0:
        raise ValueError("energy.target_kcal must be > 0")

    fitness_goal = str(goals.get("inputs", {}).get("fitness_goal", "maintenance")).lower().strip()
    diet = goals.get("inputs", {}).get("diet", {}) or {}
    diet_pref = str(diet.get("diet_preference", "any")).lower().strip()
    include_eggs = bool(diet.get("include_eggs", True))
    allergies = {a.lower().strip() for a in diet.get("allergies", [])}
    weight_loss = (fitness_goal == "weight loss")

    # Dietary filters (use veg_class mapped as diet_class)
    if diet_pref == "vegan":
        df = df[df["diet_class"].eq("vegan")]
    elif diet_pref == "vegetarian":
        df = df[~df["diet_class"].eq("non-veg")]
        if not include_eggs:
            egg_mask = df["allergens"].fillna("").str.contains("egg", case=False) | \
                       df["dish_name"].fillna("").str.contains("egg", case=False)
            df = df[~egg_mask]

    # Allergy filter
    if allergies:
        df = df[~df["allergens"].apply(lambda s: detect_allergens(s, allergies))]

    # Ban & basic nutrition thresholds
    df = df[~df.apply(is_banned_row, axis=1)]
    df = df[df["calories_kcal"] >= MIN_CAL_PER_DISH]

    # Classify mains/sides
    mains = df[df.apply(is_main, axis=1)].copy()
    sides = df[df.apply(is_side, axis=1)].copy()
    if mains.empty:
        raise ValueError("No suitable 'main' dishes after filters.")
    if sides.empty:
        sides = mains.copy()

    # Build plan
    meal_targets = {meal: round(frac * target_kcal, 1) for meal, frac in MEAL_SPLIT.items()}
    used_names = set()
    plan = []

    for meal, kcal_t in meal_targets.items():
        names, totals = choose_meal(mains, sides, kcal_t, weight_loss, used_names)
        used_names.update(names)

        dish_rows = df[df["dish_name"].isin(names)]
        ing_map = {row["dish_name"]: row["ingredients_list"] for _, row in dish_rows.iterrows()}
        img_map = {row["dish_name"]: row.get("image_url") for _, row in dish_rows.iterrows()}

        plan.append({
            "Meal": meal,
            "Dishes": names[:MAX_ITEMS_PER_MEAL],
            "Ingredients": ing_map,
            "Images": img_map,
            "Calories": totals["calories"],
            "Protein_g": totals["Protein_g"],
            "Fat_g": totals["Fat_g"],
            "Carbs_g": totals["Carbs_g"],
        })

    return plan
