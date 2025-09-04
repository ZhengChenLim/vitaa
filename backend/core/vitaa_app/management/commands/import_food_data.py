import csv
import json
import ast
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from vitaa_app.models import Dish, Allergen, AllergenDish


def _parse_list(value: str):
    """
    Try JSON first; fall back to Python literal (e.g. "['a','b']"); finally split on commas.
    Returns a list[str].
    """
    if value is None:
        return []
    s = value.strip()
    if not s:
        return []
    # JSON
    try:
        out = json.loads(s)
        return out if isinstance(out, list) else [str(out)]
    except Exception:
        pass
    # Python literal
    try:
        out = ast.literal_eval(s)
        return out if isinstance(out, list) else [str(out)]
    except Exception:
        pass
    # Comma-separated fallback
    return [part.strip() for part in s.split(",") if part.strip()]


def _to_decimal(x, default="0"):
    if x is None:
        return Decimal(default)
    try:
        return Decimal(str(x))
    except Exception:
        return Decimal(default)


class Command(BaseCommand):
    help = 'Import dishes from the CSV file (idempotent via dish_name + image_url).'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the updated CSV file')

    @transaction.atomic
    def handle(self, *args, **kwargs):
        csv_file = kwargs['csv_file']
        imported_count = 0
        skipped_count = 0

        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                try:
                    # --- parse nutrition (JSON) ---
                    # Example format:
                    # {"fat_g":25.0,"protein_g":30.0,"calories_kcal":400,"carbohydrate_g":15.0}
                    nutrition = {}
                    raw_nutrition = (row.get('nutritional_profile') or '').strip()
                    if raw_nutrition:
                        nutrition = json.loads(raw_nutrition)

                    # --- parse ingredients (list-like string) ---
                    # Can be JSON or Python-literal, e.g. "['chicken','breading','oil']"
                    ingredients_list = _parse_list(row.get('ingredients'))
                    ingredients = ', '.join(ingredients_list)

                    # --- veg_class / diet_class ---
                    veg_class = (row.get('diet_class') or '').strip() or 'unknown'

                    # --- locale names (CSV headers may vary) ---
                    # CSV shows: dish_name_cn, dish_name_ms, dish_name_vn
                    dish_name_ms = (row.get('dish_name_ms') or '').strip() or None
                    dish_name_vi = (row.get('dish_name_vi') or row.get('dish_name_vn') or '').strip() or None
                    dish_name_zh = (row.get('dish_name_zh') or row.get('dish_name_cn') or '').strip() or None

                    # --- lookup key (unique_together) ---
                    lookup = {
                        'dish_name': (row.get('dish_name') or '').strip(),
                        'image_url': (row.get('image_url') or '').strip(),
                    }
                    if not lookup['dish_name'] or not lookup['image_url']:
                        raise ValueError("Missing dish_name or image_url (both required for uniqueness).")

                    # --- defaults for update_or_create ---
                    defaults = {
                        'dish_ms_name': dish_name_ms,
                        'dish_vi_name': dish_name_vi,
                        'dish_zh_name': dish_name_zh,
                        'ingredients': ingredients,
                        'veg_class': veg_class,
                        'fat_g': _to_decimal(nutrition.get('fat_g', 0)),
                        'protein_g': _to_decimal(nutrition.get('protein_g', 0)),
                        'carbohydrate_g': _to_decimal(nutrition.get('carbohydrate_g', 0)),
                        'calories_kcal': int(nutrition.get('calories_kcal', 0) or 0),
                    }

                    dish, created = Dish.objects.update_or_create(**lookup, defaults=defaults)

                    # --- allergens ---
                    # CSV might be "wheat" or "wheat, soy" or "['wheat','soy']" or "none"
                    allergens_raw = (row.get('allergens') or '').strip()
                    # Reset and re-add for clean idempotency
                    AllergenDish.objects.filter(dish=dish).delete()
                    if allergens_raw and allergens_raw.lower() != 'none':
                        for name in _parse_list(allergens_raw):
                            if not name:
                                continue
                            allergen, _ = Allergen.objects.get_or_create(allergen_name=name.lower())
                            AllergenDish.objects.get_or_create(dish=dish, allergen=allergen)

                    imported_count += 1

                except Exception as e:
                    skipped_count += 1
                    self.stderr.write(f"Error importing {row.get('dish_name', 'Unknown')}: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"Imported/updated {imported_count} dishes. Skipped {skipped_count} rows."
        ))
