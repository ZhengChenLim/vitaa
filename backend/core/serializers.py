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