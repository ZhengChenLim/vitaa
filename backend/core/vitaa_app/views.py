import ast
import numpy as np
import pandas as pd
from typing import Dict, List
from itertools import combinations
from collections import defaultdict, OrderedDict
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
import json, random, requests, requests
from requests import RequestException, HTTPError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from rest_framework import status

from .models import PhysicalActivity, WeeklyPhysicalChallenge, NCDDeathStat, NCDQuizQuestion, Dish, AllergenDish
from serializers import (
    PlanRequestSerializer,
    NCDQuizQuestionSerializer,
    WeeklyPhysicalChallengeSerializer,
    AQIQuerySerializer,
    HealthAnalysisRequestSerializer,
    HealthPlanMealSerializer,   
    ActivityPlanRequestSerializer,
    ActivityPlanResponseSerializer,
)

from vitaa_app.activity_planner_service import make_week_plan_from_queryset
from vitaa_app.utils import calc_targets
#from vitaa_app.meal_planner_service import generate_meal_plan
#from vitaa_app.health_analysis import n8n_health_analysis

WEBHOOK_URL = "https://n8n.tm06.me/webhook/health_analysis_openai"
TIMEOUT_SECONDS = 30


_ACTIVITY_MAP_N8N = {
    "sedentary": "sedentary",
    "low": "lightly_active",
    "medium": "moderately_active",
    "high": "very_active",
    "very_high": "extra_active",
}

def _norm_str(s):
    return str(s or "").strip()

def _to_float_or_none(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None

def _normalize_payload_for_n8n(p):
    """
    Normalizes incoming user JSON to the shape expected by your n8n workflow,
    and computes derived metrics (BMI, WHtR).
    Expected incoming keys (case-sensitive to match your front-end):
      Age, Sex, WeightKg, HeightCm, WaistCircumferenceCm (optional),
      ActivityLevel, Smoking (opt), AlcoholConsumption (opt),
      FamilyHistory (opt: {Diabetes, Hypertension})
    """
    age = int(p.get("Age"))
    sex = _norm_str(p.get("Sex")).lower()  # 'male' | 'female'
    weight = _to_float_or_none(p.get("WeightKg"))
    height_cm = _to_float_or_none(p.get("HeightCm"))
    waist_cm = _to_float_or_none(p.get("WaistCircumferenceCm"))

    activity_in = _norm_str(p.get("ActivityLevel")).lower()
    activity_level = _ACTIVITY_MAP_N8N.get(activity_in, activity_in)  # fallback to raw if missing

    # Derived metrics
    height_m = (height_cm or 0) / 100.0 if height_cm else 0.0
    bmi = round(weight / (height_m * height_m), 1) if (height_m and weight) else None
    whtr = round(waist_cm / height_cm, 2) if (height_cm and waist_cm) else None

    return {
        "age": age,
        "sex": sex,
        "family_history": {
            "diabetes": _norm_str((p.get("FamilyHistory") or {}).get("Diabetes")).lower(),
            "hypertension": _norm_str((p.get("FamilyHistory") or {}).get("Hypertension")).lower(),
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
            "smoking": _norm_str(p.get("Smoking")).lower(),
            "alcohol_consumption": _norm_str(p.get("AlcoholConsumption")).lower(),
        },
        # Keep the original input for traceability downstream (optional)
        "raw_input": p,
    }


class HealthAnalysisProxyView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        s = HealthAnalysisRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        try:
            normalized = _normalize_payload_for_n8n(data)
            r = requests.post(WEBHOOK_URL, json=normalized, timeout=TIMEOUT_SECONDS)
            r.raise_for_status()
            try:
                return Response({"forwarded": True, "webhook_response": r.json()}, status=status.HTTP_200_OK)
            except ValueError:
                return Response({"forwarded": True, "webhook_response": {"status": "ok", "text": r.text}},
                                status=status.HTTP_200_OK)
        except HTTPError as e:
            return Response({"error": "Webhook returned error", "details": str(e), "body": getattr(e.response, "text", "")},
                            status=status.HTTP_502_BAD_GATEWAY)
        except RequestException as e:
            return Response({"error": "Webhook unreachable", "details": str(e)}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
'''
@csrf_exempt
def n8n_health_analysis_view(request):
    """
    Proxy endpoint: accepts user profile JSON and forwards it to n8n after normalization.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    try:
        result = n8n_health_analysis(data)
        return JsonResponse({"forwarded": True, "webhook_response": result}, status=200)
    except HTTPError as e:
        return JsonResponse(
            {"error": "Webhook returned error", "details": str(e), "body": getattr(e.response, "text", "")},
            status=502,
        )
    except RequestException as e:
        return JsonResponse({"error": "Webhook unreachable", "details": str(e)}, status=504)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
'''

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
    "jam","jelly","marshmallow","sweetened","toffee","gummy bears"
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
        dishes_localized = []

        for dish_name in selected_names:
            row = df.loc[df["dish_name"] == dish_name].head(1)
            if row.empty:
                continue
            r = row.iloc[0]
            ordered_rows_list.append(r)

            dishes_localized.append({
                "dish_name": r["dish_name"],
                "dish_ms_name": r.get("dish_ms_name"),
                "dish_vi_name": r.get("dish_vi_name"),
                "dish_zh_name": r.get("dish_zh_name"),
            })

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
            "Dishes": dishes_localized,
            "Ingredients": ing_map,
            "Images": img_map,
            "PerDish": per_dish,
            "Calories": meal_totals["calories"],
            "Protein_g": meal_totals["Protein_g"],
            "Fat_g": meal_totals["Fat_g"],
            "Carbs_g": meal_totals["Carbs_g"],
        })

    return plan

'''
@csrf_exempt
def meal_plan_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        goals = json.loads(request.body.decode("utf-8"))
        plan = generate_meal_plan(goals)
        return JsonResponse({"plan": plan}, status=200, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
'''

@csrf_exempt
def nutrition_targets(request):
    if request.method == "POST":
        try:
            payload = json.loads(request.body.decode("utf-8"))
            result = calc_targets(payload)
            return JsonResponse(result, safe=False, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "POST required"}, status=405)

# map activity_frequency -> utils.calc_targets activity_level
_ACTIVITY_MAP = {
    "sedentary": "sedentary",
    "low": "lightly_active",
    "medium": "moderately_active",
    "high": "very_active",
    "very_high": "extra_active",
}

def _norm(s):
    return str(s or "").strip()

@csrf_exempt
def health_plan_meal(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        s = HealthPlanMealSerializer(data=json.loads(request.body.decode("utf-8")))
        s.is_valid(raise_exception=True)
        body = s.validated_data

        # --- Nutrition targets ---
        _ACTIVITY_MAP = {
            "sedentary": "sedentary",
            "low": "lightly_active",
            "medium": "moderately_active",
            "high": "very_active",
            "very_high": "extra_active",
        }
        activity_level = _ACTIVITY_MAP[body["activity_frequency"]]

        profile = {
            "age": body["age"],
            "sex": body["sex"],
            "height_cm": body["height_cm"],
            "weight_kg": body["weight_kg"],
            "activity_level": activity_level,
        }

        targets_result = calc_targets(profile)
        calories_kcal = float(targets_result["targets"]["calories_kcal"])

        # --- Meal planner goals ---
        allergies = [str(a).strip().lower() for a in body.get("allergies", [])]

        goals = {
            "energy": {"target_kcal": calories_kcal},
            "inputs": {
                "fitness_goal": body["fitness_goal"],
                "diet": {
                    "diet_preference": body["diet_preference"],
                    "include_eggs": bool(body.get("include_eggs", True)),
                    "allergies": allergies,
                },
            },
        }

        plan = generate_meal_plan(goals)
        targets_only = targets_result.get("targets", {})
        return JsonResponse({"targets": targets_only, "plan": plan}, status=200, safe=False)

    except Exception as e:
        # DRF serializer errors are dicts; jsonify nicely
        if hasattr(e, "detail"):
            return JsonResponse(e.detail, status=400, safe=False)
        return JsonResponse({"error": str(e)}, status=400)


class GenerateActivityPlanView(APIView):
    """
    POST /api/activity-plan/
    Body:
    {
      "Age": 25, "Sex": "Male", "WeightKg": 120, "HeightCm": 180,
      "WaistCircumferenceCm": 100, "ActivityLevel": "Low",
      "FavoriteActivities": ["cycling","walking"],  // optional
      "goal": "weight loss",                        // "muscle gain" | "maintain health"
      "seed": 33                                    // optional
    }
    """
    def post(self, request):
        s = ActivityPlanRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        # ORM pull
        qs = PhysicalActivity.objects.values(
            "activity_description", "major_heading", "met_value"
        )
        activities = list(qs)

        plan = make_week_plan_from_queryset(
            activities=activities,
            goal=data["goal"],
            favorites=data.get("FavoriteActivities", []),
            seed=data.get("seed"),
        )

        # Optional: validate/serialize response structure
        out = ActivityPlanResponseSerializer(plan, many=False).data
        return Response(out, status=status.HTTP_200_OK)

class NCDDeathSeriesView(APIView):
    """
    GET /api/ncd/stats-series?locations=Malaysia,Global&causes=diabetes&years=2000,2001
    - locations: comma-separated (exact match)
    - causes: comma-separated (substring case-insensitive)
    - years: comma-separated integers
    """

    def get(self, request):
        # --- Parse query params ---
        locations = request.GET.get("locations")
        causes = request.GET.get("causes")
        years = request.GET.get("years")

        if locations:
            location_list = [loc.strip() for loc in locations.split(",") if loc.strip()]
        else:
            location_list = ["Global", "Malaysia"]  # default

        # allow substring search
        cause_substrings = [c.strip() for c in causes.split(",")] if causes else None

        if years:
            year_list = []
            for y in years.split(","):
                y = y.strip()
                if y.isdigit():
                    year_list.append(int(y))
            year_list = sorted(set(year_list))
        else:
            year_list = None

        # --- Build queryset ---
        qs = NCDDeathStat.objects.filter(location__in=location_list)

        if cause_substrings:
            q_obj = Q()
            for c in cause_substrings:
                q_obj |= Q(cause__icontains=c)
            qs = qs.filter(q_obj)

        if year_list:
            qs = qs.filter(year__in=year_list)

        qs = qs.values("year", "location", "cause", "number_of_deaths", "percent_of_deaths").order_by(
            "location", "cause", "year"
        )

        # --- Collect years (for front-end axis) ---
        year_set = set(row["year"] for row in qs)
        years_all = sorted(year_set)

        # --- Build series ---
        series = {loc: OrderedDict() for loc in location_list}
        for row in qs:
            loc = row["location"]
            cause = row["cause"]
            year = row["year"]
            num = float(row["number_of_deaths"]) if row["number_of_deaths"] is not None else None
            pct = float(row["percent_of_deaths"]) if row["percent_of_deaths"] is not None else None

            if cause not in series[loc]:
                series[loc][cause] = {"number": [], "percent": []}

            series[loc][cause]["number"].append({"x": year, "y": num})
            series[loc][cause]["percent"].append({"x": year, "y": pct})

        payload = {
            "locations": location_list,
            "years": years_all,
            "series": series,
        }
        return Response(payload)
    
class NCDQuizGetQuestionsView(APIView):
    """
    GET /api/ncd-quiz/questions
    Returns 25 random questions (5 from each topic).
    Assumes exactly 5 topics in the table.
    """

    def get(self, request):
        # Identify the five topics that exist in the table.
        topics = list(
            NCDQuizQuestion.objects.order_by().values_list("topic", flat=True).distinct()
        )
        if len(topics) < 5:
            return Response(
                {"detail": f"Need at least 5 distinct topics, found {len(topics)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        per_topic = 5
        selected = []
        # For each topic, pick 5 random rows (DB-level random)
        for t in topics[:5]:
            qs = (NCDQuizQuestion.objects
                  .filter(topic=t)
                  .order_by("?")[:per_topic])
            selected.extend(qs)

        # Serialize
        data = NCDQuizQuestionSerializer(selected, many=True).data

        # For front-end convenience, group counts by topic (not required but nice)
        counts = defaultdict(int)
        for row in data:
            counts[row["topic"]] += 1

        return Response({
            "topics": topics[:5],
            "count_by_topic": counts,
            "total": len(data),
            "questions": data,
        })


class NCDQuizGradeView(APIView):
    """
    POST /api/ncd-quiz/grade
    {
      "answers": [{"id": 123, "selected": "A"}, ...]
    }
    """

    def post(self, request):
        answers = request.data.get("answers", [])
        if not isinstance(answers, list) or not answers:
            return Response({"detail": "Provide 'answers' as a non-empty list."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Normalize & de-duplicate by first occurrence
        id_to_selected, ids_in_order = {}, []
        for item in answers:
            try:
                qid = int(item.get("id"))
                sel = (item.get("selected") or "").strip().upper()
                if sel not in {"A", "B", "C", "D"}:
                    continue
                if qid not in id_to_selected:
                    id_to_selected[qid] = sel
                    ids_in_order.append(qid)
            except Exception:
                continue

        if not ids_in_order:
            return Response({"detail": "No valid answers provided."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Fetch referenced questions (topic + correct answer)
        rows = (NCDQuizQuestion.objects
                .filter(pk__in=ids_in_order)
                .values("pk", "topic", "correct_option"))

        lookup = {
            r["pk"]: {
                "topic": r["topic"],
                "correct": str(r["correct_option"] or "").strip().upper()
            }
            for r in rows
        }

        results = []
        total = score = 0

        # Per-topic counters
        per_topic_counts = defaultdict(lambda: {"correct": 0, "wrong": 0, "total": 0})

        for qid in ids_in_order:
            meta = lookup.get(qid)
            if not meta:
                # unknown id -> ignore from scoring
                continue

            topic = meta["topic"]
            selected = id_to_selected[qid]
            correct_option = meta["correct"]
            is_correct = (selected == correct_option)

            total += 1
            if is_correct:
                score += 1

            per_topic_counts[topic]["total"] += 1
            if is_correct:
                per_topic_counts[topic]["correct"] += 1
            else:
                per_topic_counts[topic]["wrong"] += 1

            results.append({
                "id": qid,
                "topic": topic,
                "selected": selected,
                "correct_option": correct_option,
                "correct": is_correct,
            })

        # Compute per-topic accuracy %
        per_topic = {}
        for topic, cnt in per_topic_counts.items():
            t = cnt["total"] or 1  # guard divide-by-zero
            acc = (cnt["correct"] / t) * 100.0
            per_topic[topic] = {
                "correct": cnt["correct"],
                "wrong": cnt["wrong"],
                "total": cnt["total"],
                "accuracy_pct": round(acc, 1),
            }

        overall_accuracy_pct = round((score / (total or 1)) * 100.0, 1)

        return Response({
            "score": score,
            "total": total,
            "overall_accuracy_pct": overall_accuracy_pct,
            "per_topic": per_topic,
            "results": results,
        })

class WeeklyChallengePlanView(APIView):
    """
    GET /api/weekly-challenges/

    Returns 12 random challenges split into 4 weeks (3 per week):
    {
        "Week 1": [
            {"id": 1, "challenge": "...", "challenge_ms": "...", ...},
            {"id": 2, "challenge": "...", ...},
            {"id": 3, "challenge": "...", ...}
        ],
        "Week 2": [...],
        "Week 3": [...],
        "Week 4": [...]
    }
    """

    def get(self, request):
        all_challenges = list(WeeklyPhysicalChallenge.objects.all())
        if len(all_challenges) < 12:
            return Response(
                {"detail": f"Not enough challenges in database. Found {len(all_challenges)}, need at least 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pick 12 random
        selected = random.sample(all_challenges, 12)

        # Split into 4 weeks of 3 challenges
        plan = {}
        for i in range(4):
            week_challenges = selected[i * 3:(i + 1) * 3]
            serializer = WeeklyPhysicalChallengeSerializer(week_challenges, many=True)
            plan[f"Week {i + 1}"] = serializer.data

        return Response(plan)

@method_decorator(cache_page(60), name="get")  # cache identical queries for 60s
class AQIView(APIView):
    """
    GET /api/aqi?lat=...&lon=...
    GET /api/aqi?city=beijing
    GET /api/aqi?here=true
    """

    def get(self, request):
        s = AQIQuerySerializer(data=request.query_params)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        token = data.get("token") or getattr(settings, "WAQI_TOKEN", "")
        if not token:
            return Response(
                {"detail": "WAQI token not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        base = getattr(settings, "WAQI_BASE_URL", "https://api.waqi.info/feed")

        # Build WAQI path
        if data.get("here"):
            path = "here"
        elif data.get("city"):
            path = data["city"]
        else:
            lat = data["lat"]
            lon = data["lon"]
            path = f"geo:{lat};{lon}"

        url = f"{base}/{path}/?token={token}"

        try:
            r = requests.get(url, timeout=TIMEOUT_SECONDS)
        except requests.RequestException as e:
            return Response(
                {"detail": f"Upstream request failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Pass through WAQI status codes where sensible
        http_status = r.status_code if 200 <= r.status_code < 500 else 502

        # If WAQI returns non-JSON, guard it:
        try:
            payload = r.json()
        except ValueError:
            return Response(
                {"detail": "Invalid response from WAQI."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Normalize common error shapes
        if payload.get("status") not in ("ok", "nope"):
            # WAQI sometimes uses 'error' or other flags; just return as-is
            pass

        return Response(payload, status=http_status)
    
MALAYSIA_STATES = [
    {"state": "Johor", "lat": 1.4927, "lon": 103.7414},
    {"state": "Kedah", "lat": 6.1210, "lon": 100.3600},
    {"state": "Kelantan", "lat": 6.1254, "lon": 102.2381},
    {"state": "Melaka", "lat": 2.1896, "lon": 102.2501},
    {"state": "Negeri Sembilan", "lat": 2.7297, "lon": 101.9381},
    {"state": "Pahang", "lat": 3.8077, "lon": 103.3260},
    {"state": "Penang", "lat": 5.4141, "lon": 100.3288},
    {"state": "Perak", "lat": 4.5975, "lon": 101.0901},
    {"state": "Perlis", "lat": 6.4410, "lon": 100.1986},
    {"state": "Sabah", "lat": 5.9804, "lon": 116.0735},
    {"state": "Sarawak", "lat": 1.5533, "lon": 110.3592},
    {"state": "Selangor", "lat": 3.0738, "lon": 101.5183},
    {"state": "Terengganu", "lat": 5.3290, "lon": 103.1370},
    {"state": "Kuala Lumpur", "lat": 3.1390, "lon": 101.6869},
]

class MalaysiaAQIView(APIView):
    """
    GET /api/aqi/all-states
    Returns AQI data for all 14 Malaysian states
    """

    def get(self, request):
        token = getattr(settings, "WAQI_TOKEN", "")
        if not token:
            return Response(
                {"detail": "WAQI token not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        base = getattr(settings, "WAQI_BASE_URL", "https://api.waqi.info/feed")
        results = []

        for s in MALAYSIA_STATES:
            url = f"{base}/geo:{s['lat']};{s['lon']}/?token={token}"
            try:
                r = requests.get(url, timeout=8)
                data = r.json()
                if data.get("status") == "ok":
                    results.append({
                        "state": s["state"],
                        "aqi": data["data"].get("aqi"),
                        "city": data["data"]["city"].get("name"),
                        "dominentpol": data["data"].get("dominentpol"),
                        "time": data["data"]["time"].get("iso"),
                    })
                else:
                    results.append({"state": s["state"], "error": data})
            except Exception as e:
                results.append({"state": s["state"], "error": str(e)})

        return Response({"status": "ok", "results": results})