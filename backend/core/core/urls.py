from django.contrib import admin
from django.urls import path, include
from vitaa_app import views
from vitaa_app.views import GenerateActivityPlanView, NCDQuizGetQuestionsView, NCDQuizGradeView, NCDDeathSeriesView, WeeklyChallengePlanView, AQIView, MalaysiaAQIView 
from vitaa_app.views import (
    GenerateActivityPlanView,
    NCDQuizGetQuestionsView,
    NCDQuizGradeView,
    NCDDeathSeriesView,
    WeeklyChallengePlanView,
    AQIView,
    MalaysiaAQIView,
    HealthAnalysisProxyView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Nutrition API
    path("api/nutrition/targets/", views.nutrition_targets, name="nutrition_targets"),

    # Meal Planner API (pick one)
    path("api/mealplan/", views.health_plan_meal, name="meal_plan"),
    # path("api/plan/health/", views.health_plan_meal, name="health_plan_meal"),

    # n8n Health Analysis API
    path("api/health-analysis/", HealthAnalysisProxyView.as_view(), name="health-analysis"),

    # Activity Planner API
    path("api/activity-plan/", GenerateActivityPlanView.as_view(), name="activity-plan"),

    # NCD Statistics API
    path("api/ncd/stats-series/", NCDDeathSeriesView.as_view(), name="ncd-stats-series"),

    # NCD Quiz APIs
    path("api/ncd-quiz/questions/", NCDQuizGetQuestionsView.as_view(), name="ncd-quiz-questions"),
    path("api/ncd-quiz/grade/", NCDQuizGradeView.as_view(), name="ncd-quiz-grade"),

    # Weekly Challenges API
    path("api/weekly-challenges/", WeeklyChallengePlanView.as_view(), name="weekly-challenges"),

    # Air Quality Index APIs
    path("api/aqi/", AQIView.as_view(), name="aqi"),
    path("api/aqi/all-states/", MalaysiaAQIView.as_view(), name="aqi-all-states"),
]
