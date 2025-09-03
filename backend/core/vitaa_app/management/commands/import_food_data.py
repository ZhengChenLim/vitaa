import csv
import json
import ast
import re
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from vitaa_app.models import Dish, Allergen, AllergenDish

# ---------- Helpers & config ----------

ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\uFEFF]")

# Accept multiple header variants (exact or prefix)
DISH_NAME_CANDS = [
    "dish_name", "dish", "name", "title", "food_name", "recipe_name", "menu_item", "meal_name",
]
IMAGE_URL_CANDS = [
    "image_url", "image", "image_link", "imageurl", "img_url", "photo_url", "picture", "img",
]
INGREDIENTS_CANDS = ["ingredients", "ingredient_list", "ingredient"]
DIET_CLASS_CANDS = ["diet_class", "veg_class", "diet_type"]
NUTRITION_JSON_CANDS = ["nutritional_profile", "nutrition", "nutrition_json"]

# Localized names (optional)
MS_NAME_CANDS = ["dish_name_ms", "dish_ms_name", "dish_ms"]
VI_NAME_CANDS = ["dish_name_vi", "dish_name_vn", "dish_vi_name", "dish_vn_name"]
ZH_NAME_CANDS = ["dish_name_zh", "dish_name_cn", "dish_zh_name", "dish_cn_name"]

def snake(s: str) -> str:
    """Normalize header to snake_case and strip zero-width chars."""
    s = ZERO_WIDTH_RE.sub("", s or "")
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def clean_val(v):
    """Trim and coerce 'nan'/'null'/'none' to empty string."""
    if v is None:
        return ""
    s = ZERO_WIDTH_RE.sub("", str(v)).strip()
    return "" if s.lower() in {"nan", "null", "none"} else s

def pick_key(columns: set[str], candidates: list[str]) -> str | None:
    """Find a column by exact match, else allow prefix match (tolerates truncation)."""
    for c in candidates:
        if c in columns:
            return c
    for c in candidates:
        for col in columns:
            if col.startswith(c):
                return col
    return None

def parse_list(value: str) -> list[str]:
    """Parse JSON, Python literal list, or comma-separated string into a list[str]."""
    s = clean_val(value)
    if not s:
        return []
    try:
        out = json.loads(s)
        return out if isinstance(out, list) else [str(out)]
    except Exception:
        pass
    try:
        out = ast.literal_eval(s)
        return out if isinstance(out, list) else [str(out)]
    except Exception:
        pass
    return [part.strip() for part in s.split(",") if part.strip()]

def to_decimal(x, default="0"):
    if x is None:
        return Decimal(default)
    try:
        return Decimal(str(x))
    except Exception:
        return Decimal(default)

# ---------- Command ----------

class Command(BaseCommand):
    help = "Import dishes from CSV (idempotent via dish_name + image_url). Usage: python manage.py import_food_data <csv_file>"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Path to CSV file")

    @transaction.atomic
    def handle(self, *args, **kwargs):
        csv_path = Path(kwargs["csv_file"])
        if not csv_path.exists():
            raise CommandError(f"CSV file not found: {csv_path}")

        # 1) Sniff delimiter & read headers (BOM-safe)
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
            sample = fh.read(32768)
            fh.seek(0)
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=[",", ";", "\t", "|"])
            except Exception:
                dialect = csv.get_dialect("excel")
            reader = csv.reader(fh, dialect)
            try:
                raw_headers = next(reader)
            except StopIteration:
                raise CommandError("CSV appears to be empty.")

        headers = [snake(h) for h in raw_headers]
        header_set = set(headers)
        self.stdout.write(self.style.NOTICE(f"Detected headers: {headers}"))

        # 2) Map columns
        dish_col = pick_key(header_set, DISH_NAME_CANDS)
        img_col  = pick_key(header_set, IMAGE_URL_CANDS)
        if not dish_col or not img_col:
            raise CommandError(
                "Required columns not found.\n"
                f"Detected: {headers}\n"
                f"Looked for dish in {DISH_NAME_CANDS}; image in {IMAGE_URL_CANDS}"
            )

        ing_col  = pick_key(header_set, INGREDIENTS_CANDS)
        diet_col = pick_key(header_set, DIET_CLASS_CANDS)
        nutr_col = pick_key(header_set, NUTRITION_JSON_CANDS)
        ms_col   = pick_key(header_set, MS_NAME_CANDS)
        vi_col   = pick_key(header_set, VI_NAME_CANDS)
        zh_col   = pick_key(header_set, ZH_NAME_CANDS)

        self.stdout.write(self.style.NOTICE(
            "Using columns → "
            f"dish_name={dish_col}, image_url={img_col}, ingredients={ing_col}, "
            f"diet_class={diet_col}, nutrition_json={nutr_col}, "
            f"ms={ms_col}, vi={vi_col}, zh={zh_col}"
        ))

        # 3) Iterate rows using normalized headers
        imported, skipped = 0, 0
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh, fieldnames=headers, dialect=dialect, skipinitialspace=True)
            next(reader, None)  # skip header row

            for idx, row in enumerate(reader, start=2):
                try:
                    dish_name = clean_val(row.get(dish_col))
                    image_url = clean_val(row.get(img_col))
                    if not dish_name or not image_url:
                        skipped += 1
                        self.stderr.write(
                            f"Row {idx}: Missing dish_name or image_url | "
                            f"dish_name='{dish_name}' image_url='{image_url}'"
                        )
                        continue

                    # Nutrition JSON
                    nutrition = {}
                    raw_nutrition = clean_val(row.get(nutr_col)) if nutr_col else ""
                    if raw_nutrition:
                        try:
                            nutrition = json.loads(raw_nutrition)
                        except Exception as e:
                            self.stderr.write(
                                f"Row {idx}: bad nutritional_profile JSON → {e}; value={raw_nutrition[:120]}"
                            )

                    # Ingredients → list → comma-joined
                    ingredients_list = parse_list(row.get(ing_col)) if ing_col else []
                    ingredients = ", ".join(ingredients_list)

                    veg_class = clean_val(row.get(diet_col)) or "unknown"

                    dish_name_ms = clean_val(row.get(ms_col)) or None
                    dish_name_vi = clean_val(row.get(vi_col)) or None
                    dish_name_zh = clean_val(row.get(zh_col)) or None

                    lookup = {"dish_name": dish_name, "image_url": image_url}
                    defaults = {
                        "dish_ms_name": dish_name_ms,
                        "dish_vi_name": dish_name_vi,
                        "dish_zh_name": dish_name_zh,
                        "ingredients": ingredients,
                        "veg_class": veg_class,
                        "fat_g": to_decimal(nutrition.get("fat_g", 0)),
                        "protein_g": to_decimal(nutrition.get("protein_g", 0)),
                        "carbohydrate_g": to_decimal(nutrition.get("carbohydrate_g", 0)),
                        "calories_kcal": int(nutrition.get("calories_kcal", 0) or 0),
                    }

                    dish, _created = Dish.objects.update_or_create(**lookup, defaults=defaults)

                    # Allergens
                    allergens_raw = clean_val(row.get("allergens"))
                    AllergenDish.objects.filter(dish=dish).delete()  # idempotent rebuild
                    if allergens_raw and allergens_raw.lower() != "none":
                        for name in parse_list(allergens_raw):
                            if not name:
                                continue
                            allergen, _ = Allergen.objects.get_or_create(allergen_name=name.lower())
                            AllergenDish.objects.get_or_create(dish=dish, allergen=allergen)

                    imported += 1

                except Exception as e:
                    skipped += 1
                    self.stderr.write(f"Row {idx}: Error importing '{row.get(dish_col, '') or 'Unknown'}': {e}")

        self.stdout.write(self.style.SUCCESS(
            f"Imported/updated {imported} dishes. Skipped {skipped} rows."
        ))
