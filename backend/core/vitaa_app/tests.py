from django.test import TestCase
from vitaa_app.utils import calc_targets
from rest_framework.test import APIClient
from vitaa_app.models import PhysicalActivity
from django.urls import reverse
from rest_framework.test import APITestCase
from vitaa_app.models import NCDDeathStat, NCDQuizQuestion

class CalcTargetsTests(TestCase):
    '''
    Notes
    This test checks inputs and outputs sanity.
    It validates macro math (protein in grams matches formula).
    It ensures macro percentages add up to ~100%.
    The calorie range check prevents silent crazy values.
    '''
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

        # Basic existence checks
        self.assertIn("inputs", result)
        self.assertIn("targets", result)

        # Inputs should echo back correct values
        self.assertEqual(result["inputs"]["age"], 28)
        self.assertEqual(result["inputs"]["sex"].lower(), "male")
        self.assertEqual(result["inputs"]["activity_level"], "moderately_active")

        # Check calorie target is within a sensible range
        self.assertTrue(1600 < result["targets"]["calories_kcal"] < 3000)

        # Protein should be roughly weight * protein_g_per_kg
        expected_protein = round(72.5 * 2.0, 1)
        self.assertEqual(result["targets"]["protein_g"], expected_protein)

        # Macro split percentages should sum ~100
        split = result["targets"]["macro_split_pct"]
        total_pct = split["protein"] + split["fat"] + split["carbs"]
        self.assertTrue(98 <= total_pct <= 102)  # allow rounding wiggle

class ActivityPlanAPITest(TestCase):
    def setUp(self):
        # seed minimal data if your DB is empty in tests
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

    def test_plan_endpoint(self):
        client = APIClient()
        payload = {
            "Age": 25, "Sex": "Male", "WeightKg": 120, "HeightCm": 180,
            "WaistCircumferenceCm": 100, "ActivityLevel": "Low",
            "FavoriteActivities": ["walking"],
            "goal": "weight loss",
            "seed": 1
        }
        resp = client.post("/api/activity-plan/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 7)
        self.assertIn("day", data[0])
        self.assertIn("recommendation", data[0])
        self.assertIn("duration", data[0])

class NCDDeathSeriesTests(APITestCase):
    def setUp(self):
        NCDDeathStat.objects.create(year=2020, location="Global", cause="Stroke",
                                    number_of_deaths=1000, percent_of_deaths=12.5)
        NCDDeathStat.objects.create(year=2020, location="Malaysia", cause="Stroke",
                                    number_of_deaths=200, percent_of_deaths=15.0)

    def test_series_endpoint(self):
        url = reverse("ncd-stats-series")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("Global", data["series"])
        self.assertIn("Malaysia", data["series"])

TOPICS = ["Diabetes", "Stroke", "Hypertension", "Other NCD's", "General Knowledge"]

class NCDQuizAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create 100 questions: 20 per topic
        qid = 1
        for topic in TOPICS:
            for i in range(20):
                NCDQuizQuestion.objects.create(
                    topic=topic,
                    question=f"Q{qid} about {topic}",
                    question_ms=f"Q{qid} ms",
                    question_zh=f"Q{qid} zh",
                    question_vi=f"Q{qid} vi",
                    option_a="A1", optiona_ms="A1 ms", optiona_zh="A1 zh", optiona_vi="A1 vi",
                    option_b="B1", optionb_ms="B1 ms", optionb_zh="B1 zh", optionb_vi="B1 vi",
                    option_c="C1", optionc_ms="C1 ms", optionc_zh="C1 zh", optionc_vi="C1 vi",
                    option_d="D1", optiond_ms="D1 ms", optiond_zh="D1 zh", optiond_vi="D1 vi",
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
        # Check we got exactly 5 from each of 5 topics
        counts = {}
        for q in data["questions"]:
            counts[q["topic"]] = counts.get(q["topic"], 0) + 1
        self.assertEqual(len(counts), 5)
        for t in TOPICS:
            # there may be ordering of topics[:5]; accept any 5 topics from the set
            if t in counts:
                self.assertEqual(counts[t], 5)

    def test_grade_endpoint(self):
        # Grab some ids deterministically
        sample_ids = list(
            NCDQuizQuestion.objects.values_list("pk", flat=True).order_by("pk")[:5]
        )
        # Submit answers: first 3 correct (A), last 2 wrong (B)
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
        # Each result has the expected keys
        for r in data["results"]:
            self.assertIn("id", r)
            self.assertIn("selected", r)
            self.assertIn("correct_option", r)
            self.assertIn("correct", r)