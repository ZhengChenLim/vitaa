from django.test import TestCase
from vitaa_app.utils import calc_targets

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