# app/serializers.py
from rest_framework import serializers
from vitaa_app.models import NCDQuizQuestion, WeeklyPhysicalChallenge

class FamilyHistorySerializer(serializers.Serializer):
    Diabetes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    Hypertension = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class HealthAnalysisRequestSerializer(serializers.Serializer):
    """
    For /api/health-analysis/ (proxied to n8n)
    Keeps field names to match your current client payload.
    """
    Age = serializers.IntegerField(min_value=1, max_value=120)
    Sex = serializers.ChoiceField(choices=["Male", "Female"])
    WeightKg = serializers.FloatField(min_value=10)
    HeightCm = serializers.FloatField(min_value=50)
    WaistCircumferenceCm = serializers.FloatField(required=False, allow_null=True, min_value=0)
    ActivityLevel = serializers.ChoiceField(
        choices=["Sedentary", "Low", "Medium", "High", "Very_High", "Very High"],
        help_text="Client may send 'Very High' or 'Very_High'."
    )
    Smoking = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    AlcoholConsumption = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    FamilyHistory = FamilyHistorySerializer(required=False)

    def validate_ActivityLevel(self, value):
        # Normalize "Very High" -> "Very_High" for consistent downstream handling (optional)
        v = (value or "").strip()
        if v.lower() == "very high":
            return "Very_High"
        return v


class HealthPlanMealSerializer(serializers.Serializer):
    """
    For /api/mealplan/ (and /api/plan/health/ if you use it)
    This matches your 'health_plan_meal' expected input.
    """
    age = serializers.IntegerField(min_value=1, max_value=120)
    sex = serializers.ChoiceField(choices=["male", "female"])
    height_cm = serializers.FloatField(min_value=50)
    weight_kg = serializers.FloatField(min_value=10)
    waist_cm = serializers.FloatField(required=False, allow_null=True, min_value=0)

    # activity_frequency maps to your _ACTIVITY_MAP in views
    activity_frequency = serializers.ChoiceField(
        choices=["sedentary", "low", "medium", "high", "very_high"]
    )

    # diet fields
    diet_preference = serializers.ChoiceField(
        choices=["any", "vegetarian", "vegan", "non-veg"],
        default="any"
    )
    include_eggs = serializers.BooleanField(default=True)
    allergies = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )

    # planner goal
    fitness_goal = serializers.ChoiceField(
        choices=["weight loss", "maintenance", "gain"],
        default="maintenance"
    )

    # Make inputs case-insensitive (optional nicety)
    def to_internal_value(self, data):
        # shallow copy, normalize some common strings
        d = dict(data)
        for k in ["sex", "diet_preference", "fitness_goal", "activity_frequency"]:
            if k in d and isinstance(d[k], str):
                d[k] = d[k].strip().lower()
        return super().to_internal_value(d)

class PlanRequestSerializer(serializers.Serializer):
    Age = serializers.IntegerField()
    Sex = serializers.ChoiceField(choices=["Male", "Female"])
    WeightKg = serializers.FloatField()
    HeightCm = serializers.FloatField()
    WaistCircumferenceCm = serializers.FloatField(required=False, allow_null=True)
    ActivityLevel = serializers.ChoiceField(choices=["Sedentary", "Low", "Medium", "High"], default="Low")
    FavoriteActivities = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    goal = serializers.ChoiceField(choices=["weight loss", "muscle gain", "maintain health"])
    seed = serializers.IntegerField(required=False)

class NCDQuizQuestionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="pk", read_only=True)
    class Meta:
        model = NCDQuizQuestion
        fields = [
            "id",
            "topic",
            "question", "question_ms", "question_zh", "question_vi",
            "option_a", "option_a_ms", "option_a_zh", "option_a_vi",
            "option_b", "option_b_ms", "option_b_zh", "option_b_vi",
            "option_c", "option_c_ms", "option_c_zh", "option_c_vi",
            "option_d", "option_d_ms", "option_d_zh", "option_d_vi",
            "correct_option",
        ]

class WeeklyPhysicalChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyPhysicalChallenge
        fields = ["challenge_id", "challenge", "challenge_ms", "challenge_zh", "challenge_vi"]

class AQIQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(required=False)
    lon = serializers.FloatField(required=False)
    city = serializers.CharField(required=False, allow_blank=False)
    here = serializers.BooleanField(required=False, default=False)
    # Optional: allow overriding token for testing (you can remove in prod)
    token = serializers.CharField(required=False, allow_blank=False)

    def validate(self, attrs):
        lat, lon, city, here = attrs.get("lat"), attrs.get("lon"), attrs.get("city"), attrs.get("here", False)

        modes = sum([
            1 if (lat is not None or lon is not None) else 0,
            1 if city else 0,
            1 if here else 0
        ])

        if modes == 0:
            raise serializers.ValidationError("Provide either (lat & lon), or city, or here=true.")
        if modes > 1:
            raise serializers.ValidationError("Use only one: (lat & lon) OR city OR here=true.")

        if (lat is not None) ^ (lon is not None):
            raise serializers.ValidationError("Both lat and lon must be provided together.")

        return attrs
    
class ActivityPlanRequestSerializer(serializers.Serializer):
    Age = serializers.IntegerField(min_value=1, max_value=120)
    Sex = serializers.ChoiceField(choices=["Male", "Female"])
    WeightKg = serializers.FloatField(min_value=10)
    HeightCm = serializers.FloatField(min_value=50)
    WaistCircumferenceCm = serializers.FloatField(required=False, allow_null=True, min_value=0)
    ActivityLevel = serializers.ChoiceField(choices=["Sedentary", "Low", "Medium", "High"], default="Low")
    FavoriteActivities = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    goal = serializers.ChoiceField(choices=["weight loss", "muscle gain", "maintain health"])
    seed = serializers.IntegerField(required=False)

    def to_internal_value(self, data):
        d = dict(data)
        # normalize favorites to list of strings
        favs = d.get("FavoriteActivities")
        if isinstance(favs, str):
            d["FavoriteActivities"] = [v.strip() for v in favs.split(",") if v.strip()]
        # normalize goal casing
        g = d.get("goal")
        if isinstance(g, str):
            d["goal"] = g.strip().lower()
        return super().to_internal_value(d)


# --- Activity Plan (Response) ---
class DayPlanSerializer(serializers.Serializer):
    day = serializers.ChoiceField(choices=[
        "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
    ])
    recommendation = serializers.CharField()
    duration = serializers.IntegerField(min_value=0)


class ActivityPlanResponseSerializer(serializers.ListSerializer):
    child = DayPlanSerializer()