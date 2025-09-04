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
    "jam","jelly","marshmallow","sweetened","toffee", "gummy bears"
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


def _sum_macros(rows_df: pd.DataFrame) -> Dict[str, float]:
    """Sum macros for a set of dish rows, rounded to 1 dp."""
    if rows_df.empty:
        return {"calories": 0.0, "Protein_g": 0.0, "Fat_g": 0.0, "Carbs_g": 0.0}
    return {
        "calories": round(float(rows_df["calories_kcal"].sum()), 1),
        "Protein_g": round(float(rows_df["protein_g"].sum()), 1),
        "Fat_g": round(float(rows_df["fat_g"].sum()), 1),
        "Carbs_g": round(float(rows_df["carbohydrate_g"].sum()), 1),
    }


# ---------- DATA LOAD ----------
def _load_dishes_from_db() -> pd.DataFrame:
    """
    Pulls dishes + allergens from the DB and returns a DataFrame
    aligned to the old CSV shape, now including localized names.
    """
    base = list(Dish.objects.values(
        "dish_id",
        "dish_name",
        "dish_ms_name",
        "dish_vi_name",
        "dish_zh_name",
        "veg_class",
        "ingredients",
        "calories_kcal",
        "protein_g",
        "fat_g",
        "carbohydrate_g",
        "image_url",
    ))

    ad = (AllergenDish.objects
          .select_related("allergen", "dish")
          .values("dish_id", "allergen__allergen_name"))

    allergen_map = {}
    for row in ad:
        d = row["dish_id"]
        allergen_map.setdefault(d, []).append((row["allergen__allergen_name"] or "").strip().lower())

    def _parse_ingredients(raw):
        if not raw:
            return []
        try:
            temp = json.loads(raw)
            if isinstance(temp, list):
                return temp
            if isinstance(temp, str) and temp:
                return [s.strip() for s in temp.split(",") if s.strip()]
        except Exception:
            pass
        return [s.strip() for s in str(raw).split(",") if s.strip()]

    records = []
    for r in base:
        allergens = ", ".join(allergen_map.get(r["dish_id"], []))
        ingredients_list = _parse_ingredients(r.get("ingredients"))

        records.append({
            "dish_name": r["dish_name"],
            "dish_ms_name": r.get("dish_ms_name"),
            "dish_vi_name": r.get("dish_vi_name"),
            "dish_zh_name": r.get("dish_zh_name"),
            "diet_class": r["veg_class"],
            "ingredients": json.dumps(ingredients_list),
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

    # Deduplicate so each EN name maps to exactly one row
    df = df.drop_duplicates(subset=["dish_name"], keep="first").reset_index(drop=True)
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

    # Dietary filters
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
        names, _unused_totals = choose_meal(mains, sides, kcal_t, weight_loss, used_names)

        selected_names = names[:MAX_ITEMS_PER_MEAL]
        used_names.update(selected_names)

        ordered_rows_list = []
        ing_map = {}
        img_map = {}
        per_dish = []
        dishes_localized = []  # <- new

        for dish_name in selected_names:
            row = df.loc[df["dish_name"] == dish_name].head(1)
            if row.empty:
                continue
            r = row.iloc[0]
            ordered_rows_list.append(r)

            # localized names payload
            dishes_localized.append({
                "dish_name": r["dish_name"],
                "dish_ms_name": r.get("dish_ms_name"),
                "dish_vi_name": r.get("dish_vi_name"),
                "dish_zh_name": r.get("dish_zh_name"),
            })

            # maps (keep keyed by EN name)
            ing_map[dish_name] = r["ingredients_list"]
            img_map[dish_name] = r.get("image_url")

            per_dish.append({
                "Dish": dish_name,
                "Calories": round(float(r["calories_kcal"]), 1),
                "Protein_g": round(float(r["protein_g"]), 1),
                "Fat_g": round(float(r["fat_g"]), 1),
                "Carbs_g": round(float(r["carbohydrate_g"]), 1),
            })

        if ordered_rows_list:
            ordered_rows = pd.DataFrame(ordered_rows_list)
            meal_totals = _sum_macros(ordered_rows)
        else:
            meal_totals = {"calories": 0.0, "Protein_g": 0.0, "Fat_g": 0.0, "Carbs_g": 0.0}

        plan.append({
            "Meal": meal,
            "Dishes": dishes_localized,   # <- now returns all 4 names
            "Ingredients": ing_map,
            "Images": img_map,
            "PerDish": per_dish,
            "Calories": meal_totals["calories"],
            "Protein_g": meal_totals["Protein_g"],
            "Fat_g": meal_totals["Fat_g"],
            "Carbs_g": meal_totals["Carbs_g"],
        })

    return plan
