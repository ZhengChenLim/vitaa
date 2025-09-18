from collections import defaultdict, OrderedDict
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, random
from requests import RequestException, HTTPError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from rest_framework import status

from .models import PhysicalActivity, WeeklyPhysicalChallenge, NCDDeathStat, NCDQuizQuestion
from serializers import PlanRequestSerializer, NCDQuizQuestionSerializer, WeeklyPhysicalChallengeSerializer

from vitaa_app.activity_planner_service import make_week_plan_from_queryset
from vitaa_app.utils import calc_targets
from vitaa_app.meal_planner_service import generate_meal_plan
from vitaa_app.health_analysis import n8n_health_analysis


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
        s = PlanRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        # Pull from DB (ORM hits the physical_activity table)
        qs = PhysicalActivity.objects.values(
            "activity_description", "major_heading", "met_value"
        )
        activities = list(qs)

        plan = make_week_plan_from_queryset(
            activities=activities,
            goal=data["goal"],
            favorites=data.get("FavoriteActivities", []),
            seed=data.get("seed")
        )
        # Return exactly the array of 7 items (day, recommendation, duration)
        return Response(plan, status=status.HTTP_200_OK)

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