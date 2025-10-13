# tests.py
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from unittest.mock import patch, MagicMock

from vitaa_app.utils import calc_targets
from vitaa_app.models import (
    PhysicalActivity, NCDDeathStat, NCDQuizQuestion,
    Dish, AllergenDish
)

# --------------------------
# calc_targets unit tests
# --------------------------
class CalcTargetsTests(TestCase):
    def test_calc_targets_with_weekly_loss(self):
        payload = {
            "age": 28,
            "sex": "male",
            "weight_kg": 72.5,
            "height_cm": 178,
            "activity_level": "moderately_active",
            "weekly_loss_kg": 0.5,
            "protein_g_per_kg": 2.0,
            "fat_percent": 0.3,
        }
        result = calc_targets(payload)
        self.assertIn("inputs", result)
        self.assertIn("targets", result)
        self.assertEqual(result["inputs"]["age"], 28)
        self.assertEqual(result["inputs"]["sex"].lower(), "male")
        self.assertEqual(result["inputs"]["activity_level"], "moderately_active")
        self.assertTrue(1600 < result["targets"]["calories_kcal"] < 3000)
        expected_protein = round(72.5 * 2.0, 1)
        self.assertEqual(result["targets"]["protein_g"], expected_protein)
        split = result["targets"]["macro_split_pct"]
        total_pct = split["protein"] + split["fat"] + split["carbs"]
        self.assertTrue(98 <= total_pct <= 102)

        # Per-test output
        print(f"[✓] {self._testMethodName} — kcal={result['targets']['calories_kcal']}, "
              f"protein_g={result['targets']['protein_g']}, macro_total~={round(total_pct,1)}%")


# --------------------------
# nutrition_targets endpoint
# --------------------------
class NutritionTargetsAPITests(APITestCase):
    def test_post_ok(self):
        url = reverse("nutrition_targets")
        payload = {
            "age": 30, "sex": "male",
            "height_cm": 175, "weight_kg": 78,
            "activity_level": "moderately_active"
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn("targets", data)

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, keys={list(data.keys())}")

    def test_wrong_method(self):
        url = reverse("nutrition_targets")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (method not allowed as expected)")


# --------------------------
# HealthAnalysisProxyView
# --------------------------
class HealthAnalysisProxyViewTests(APITestCase):
    @patch("vitaa_app.views.requests.post")
    def test_health_analysis_ok(self, mock_post):
        url = reverse("health-analysis")
        req_payload = {
            "Age": 30, "Sex": "Male", "WeightKg": 78, "HeightCm": 175,
            "ActivityLevel": "Medium", "WaistCircumferenceCm": 85,
            "Smoking": "no", "AlcoholConsumption": "low",
            "FamilyHistory": {"Diabetes": "no", "Hypertension": "yes"}
        }

        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"ok": True}
        mock_post.return_value = mock_response

        resp = self.client.post(url, req_payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("forwarded"))

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, forwarded={resp.json().get('forwarded')}")

    @patch("vitaa_app.views.requests.post")
    def test_health_analysis_webhook_error(self, mock_post):
        url = reverse("health-analysis")
        req_payload = {
            "Age": 30, "Sex": "Male", "WeightKg": 78, "HeightCm": 175,
            "ActivityLevel": "Medium"
        }
        from requests import HTTPError
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = HTTPError("bad gateway")
        mock_post.return_value = mock_response

        resp = self.client.post(url, req_payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_502_BAD_GATEWAY)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (webhook error simulated)")

    @patch("vitaa_app.views.requests.post")
    def test_health_analysis_timeout(self, mock_post):
        url = reverse("health-analysis")
        req_payload = {"Age": 30, "Sex": "Male", "WeightKg": 78, "HeightCm": 175, "ActivityLevel": "Medium"}
        from requests import Timeout
        mock_post.side_effect = Timeout("timeout")
        resp = self.client.post(url, req_payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_504_GATEWAY_TIMEOUT)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (timeout simulated)")


# --------------------------
# Activity Plan endpoint
# --------------------------
class ActivityPlanAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        PhysicalActivity.objects.create(
            major_heading="Walking",
            major_heading_ms="",
            major_heading_cn="",
            major_heading_vn="",
            activity_code=1000001,
            met_value="3.80",
            activity_description="Walking, brisk pace",
            activity_description_ms="",
            activity_description_cn="",
            activity_description_vn="",
        )

    def test_plan_endpoint_ok(self):
        url = reverse("activity-plan")
        payload = {
            "Age": 25, "Sex": "Male", "WeightKg": 120, "HeightCm": 180,
            "WaistCircumferenceCm": 100, "ActivityLevel": "Low",
            "FavoriteActivities": ["walking"],
            "goal": "weight loss",
            "seed": 1
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(len(data), 7)
        self.assertIn("day", data[0])
        self.assertIn("recommendation", data[0])
        self.assertIn("duration", data[0])

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, days={len(data)}, "
              f"sample={data[0].get('day','?')}")

    def test_plan_endpoint_bad_payload(self):
        url = reverse("activity-plan")
        resp = self.client.post(url, {"Age": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (bad payload as expected)")


# --------------------------
# NCD Death Series endpoint
# --------------------------
class NCDDeathSeriesTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        NCDDeathStat.objects.create(year=2020, location="Global", cause="Stroke",
                                    number_of_deaths=1000, percent_of_deaths=12.5)
        NCDDeathStat.objects.create(year=2020, location="Malaysia", cause="Stroke",
                                    number_of_deaths=200, percent_of_deaths=15.0)
        NCDDeathStat.objects.create(year=2021, location="Malaysia", cause="Diabetes",
                                    number_of_deaths=180, percent_of_deaths=14.0)

    def test_series_default(self):
        url = reverse("ncd-stats-series")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn("Global", data["series"])
        self.assertIn("Malaysia", data["series"])
        self.assertIn("years", data)

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, "
              f"locations={list(data['series'].keys())}, years={data.get('years')}")

    def test_series_filters(self):
        url = reverse("ncd-stats-series")
        resp = self.client.get(url, {"locations": "Malaysia", "causes": "diab", "years": "2021"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data["locations"], ["Malaysia"])
        # Should only include Diabetes for 2021 in Malaysia
        self.assertIn("Malaysia", data["series"])
        self.assertTrue(any("Diabetes" in k for k in data["series"]["Malaysia"].keys()))

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, "
              f"locations={data['locations']}, series_keys={list(data['series']['Malaysia'].keys())}")


# --------------------------
# NCD Quiz endpoints (keep yours, add a tiny negative)
# --------------------------
TOPICS = ["Diabetes", "Stroke", "Hypertension", "Other NCD's", "General Knowledge"]

class NCDQuizAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        qid = 1
        for topic in TOPICS:
            for i in range(20):
                NCDQuizQuestion.objects.create(
                    topic=topic,
                    question=f"Q{qid} about {topic}",
                    question_ms=f"Q{qid} ms",
                    question_zh=f"Q{qid} zh",
                    question_vi=f"Q{qid} vi",
                    option_a="A1", option_a_ms="A1 ms", option_a_zh="A1 zh", option_a_vi="A1 vi",
                    option_b="B1", option_b_ms="B1 ms", option_b_zh="B1 zh", option_b_vi="B1 vi",
                    option_c="C1", option_c_ms="C1 ms", option_c_zh="C1 zh", option_c_vi="C1 vi",
                    option_d="D1", option_d_ms="D1 ms", option_d_zh="D1 zh", option_d_vi="D1 vi",
                    correct_option="A",
                )
                qid += 1

    def test_get_25_questions_5_per_topic(self):
        url = reverse("ncd-quiz-questions")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("questions", data)
        self.assertEqual(data["total"], 25)
        counts = {}
        for q in data["questions"]:
            counts[q["topic"]] = counts.get(q["topic"], 0) + 1
        self.assertEqual(len(counts), 5)
        for t in TOPICS:
            if t in counts:
                self.assertEqual(counts[t], 5)

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, "
              f"total={data['total']}, per_topic={counts}")

    def test_grade_endpoint_ok(self):
        sample_ids = list(
            NCDQuizQuestion.objects.values_list("pk", flat=True).order_by("pk")[:5]
        )
        answers = []
        for i, qid in enumerate(sample_ids):
            sel = "A" if i < 3 else "B"
            answers.append({"id": qid, "selected": sel})
        url = reverse("ncd-quiz-grade")
        resp = self.client.post(url, {"answers": answers}, format="json")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total"], 5)
        self.assertEqual(data["score"], 3)
        self.assertEqual(len(data["results"]), 5)

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, "
              f"total={data['total']}, score={data['score']}")

    def test_grade_endpoint_bad_payload(self):
        url = reverse("ncd-quiz-grade")
        resp = self.client.post(url, {"answers": []}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (bad payload as expected)")


# --------------------------
# Meal plan endpoint (/api/mealplan/)
# --------------------------
class MealPlanAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Minimal dish data enabling mains/sides
        # Main
        Dish.objects.create(
            dish_id=1,
            dish_name="Grilled Chicken",
            dish_ms_name="Ayam Bakar",
            dish_vi_name="Gà nướng",
            dish_zh_name="烤鸡",
            veg_class="non-veg",
            ingredients='["chicken","salt","pepper"]',
            calories_kcal=350,
            protein_g=35,
            fat_g=12,
            carbohydrate_g=5,
            image_url="http://example.com/chicken.jpg",
        )
        # Side
        Dish.objects.create(
            dish_id=2,
            dish_name="Garden Salad",
            dish_ms_name="Salad",
            dish_vi_name="Rau trộn",
            dish_zh_name="沙拉",
            veg_class="vegetarian",
            ingredients='["lettuce","tomato","cucumber"]',
            calories_kcal=120,
            protein_g=3,
            fat_g=4,
            carbohydrate_g=16,
            image_url="http://example.com/salad.jpg",
        )

    def test_meal_plan_ok(self):
        url = reverse("meal_plan")
        payload = {
            "age": 30, "sex": "male", "height_cm": 175, "weight_kg": 78,
            "activity_frequency": "medium",
            "allergies": [], "diet_preference": "any", "include_eggs": True,
            "fitness_goal": "weight loss"
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn("targets", data)
        self.assertIn("plan", data)
        self.assertTrue(isinstance(data["plan"], list))
        self.assertEqual(len(data["plan"]), 3)  # Breakfast, Lunch, Dinner

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, meals={len(data['plan'])}, "
              f"meal_names={[m.get('meal','?') for m in data['plan']]}")

    def test_meal_plan_bad_payload(self):
        url = reverse("meal_plan")
        resp = self.client.post(url, {"age": 30}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (bad payload as expected)")

    def test_meal_plan_no_dishes(self):
        # wipe dishes and try
        Dish.objects.all().delete()
        url = reverse("meal_plan")
        payload = {
            "age": 30, "sex": "male", "height_cm": 175, "weight_kg": 78,
            "activity_frequency": "medium",
            "allergies": [], "diet_preference": "any", "include_eggs": True,
            "fitness_goal": "weight loss"
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)  # ValueError bubbled as 400

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (no dishes available as expected)")


# --------------------------
# AQI endpoints
# --------------------------
class AQIViewTests(APITestCase):
    @override_settings(WAQI_TOKEN="test-token", WAQI_BASE_URL="https://example.com/feed")
    @patch("vitaa_app.views.requests.get")
    def test_aqi_city_ok(self, mock_get):
        url = reverse("aqi")
        payload = {"city": "beijing"}
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "ok", "data": {"aqi": 80, "city": {"name": "Beijing"}}}
        mock_get.return_value = mock_resp
        resp = self.client.get(url, payload)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ok")

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, data={resp.json()}")

    @override_settings(WAQI_TOKEN="test-token", WAQI_BASE_URL="https://example.com/feed")
    @patch("vitaa_app.views.requests.get")
    def test_aqi_geo_ok(self, mock_get):
        url = reverse("aqi")
        payload = {"lat": 3.14, "lon": 101.68}
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "ok", "data": {"aqi": 50}}
        mock_get.return_value = mock_resp
        resp = self.client.get(url, payload)
        self.assertEqual(resp.status_code, 200)

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, data={resp.json()}")

    @override_settings(WAQI_TOKEN="test-token", WAQI_BASE_URL="https://example.com/feed")
    @patch("vitaa_app.views.requests.get")
    def test_aqi_here_ok(self, mock_get):
        url = reverse("aqi")
        payload = {"here": True}
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "ok", "data": {"aqi": 60}}
        mock_get.return_value = mock_resp
        resp = self.client.get(url, payload)
        self.assertEqual(resp.status_code, 200)

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, data={resp.json()}")

    @override_settings(WAQI_TOKEN="test-token")
    def test_aqi_invalid_combination(self):
        url = reverse("aqi")
        # both city and here -> 400
        resp = self.client.get(url, {"city": "kl", "here": True})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        print(f"[✓] {self._testMethodName} — status={resp.status_code} (invalid params as expected)")


class MalaysiaAQIViewTests(APITestCase):
    @override_settings(WAQI_TOKEN="test-token", WAQI_BASE_URL="https://example.com/feed")
    @patch("vitaa_app.views.requests.get")
    def test_all_states_ok(self, mock_get):
        # Mock each call with a consistent ok payload
        m = MagicMock()
        m.status_code = 200
        m.json.return_value = {"status": "ok", "data": {"aqi": 42, "city": {"name": "X"}, "dominentpol": "pm25", "time": {"iso": "2024-01-01T00:00:00Z"}}}
        mock_get.return_value = m

        url = reverse("aqi-all-states")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(len(data["results"]), 14)  # 14 states

        print(f"[✓] {self._testMethodName} — status={resp.status_code}, results={len(data['results'])}")
