from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from vitaa_app.utils import calc_targets
from vitaa_app.meal_planner_service import generate_meal_plan

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
    """
    Expects a flat JSON like:
    {
      "age": 30, "sex": "male", "height_cm": 175, "weight_kg": 78, "waist_cm": 90,
      "activity_frequency": "medium",
      "allergies": ["Peanuts","Shellfish"],
      "diet_preference": "Vegetarian",
      "include_eggs": true,
      "fitness_goal": "Weight Loss"
    }
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))

        # --- Nutrition targets ---
        activity_freq = _norm(body.get("activity_frequency")).lower()
        activity_level = _ACTIVITY_MAP.get(activity_freq)
        if not activity_level:
            raise ValueError("activity_frequency must be one of: " + ", ".join(_ACTIVITY_MAP.keys()))

        profile = {
            "age": int(body["age"]),
            "sex": _norm(body["sex"]).lower(),
            "height_cm": float(body["height_cm"]),
            "weight_kg": float(body["weight_kg"]),
            "activity_level": activity_level,
        }

        targets_result = calc_targets(profile)
        calories_kcal = float(targets_result["targets"]["calories_kcal"])

        # --- Meal planner goals ---
        diet_pref = _norm(body.get("diet_preference")).lower()
        if diet_pref in {"veg", "vegetarian"}:
            diet_pref = "vegetarian"
        elif diet_pref in {"vegan"}:
            diet_pref = "vegan"
        elif diet_pref in {"non-veg", "non vegetarian", "non_vegetarian"}:
            diet_pref = "non-veg"
        elif not diet_pref:
            diet_pref = "any"

        allergies = [str(a).strip().lower() for a in body.get("allergies", [])]

        goals = {
            "energy": {"target_kcal": calories_kcal},
            "inputs": {
                "fitness_goal": _norm(body.get("fitness_goal")).lower() or "maintenance",
                "diet": {
                    "diet_preference": diet_pref,
                    "include_eggs": bool(body.get("include_eggs", True)),
                    "allergies": allergies,
                },
            },
        }

        # --- Generate meal plan ---
        plan = generate_meal_plan(goals)

        targets_only = targets_result.get("targets", {})
        return JsonResponse({"targets": targets_only, "plan": plan}, status=200, safe=False)

    except KeyError as ke:
        return JsonResponse({"error": f"missing field: {ke.args[0]}"}, status=400)
    except ValueError as ve:
        return JsonResponse({"error": str(ve)}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)