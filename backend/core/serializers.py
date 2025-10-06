# app/serializers.py
from rest_framework import serializers
from vitaa_app.models import NCDQuizQuestion, WeeklyPhysicalChallenge

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