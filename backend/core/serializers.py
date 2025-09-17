# app/serializers.py
from rest_framework import serializers

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
