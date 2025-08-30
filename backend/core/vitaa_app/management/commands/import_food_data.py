import csv
import json
from django.core.management.base import BaseCommand
from vitaa_app.models import Dish, Allergen, AllergenDish


class Command(BaseCommand):
    help = 'Import dishes from the updated MM-Food-100K CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the updated CSV file')

    def handle(self, *args, **kwargs):
        csv_file = kwargs['csv_file']
        imported_count = 0
        skipped_count = 0

        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                try:
                    # Parse nutritional_profile JSON
                    nutrition = json.loads(row['nutritional_profile'])

                    # Parse ingredients only (ignore portion size)
                    ingredients = ', '.join(json.loads(row['ingredients']))

                    # Map diet_class -> veg_class
                    veg_class = row.get('diet_class', '').strip() or 'unknown'

                    # Create Dish
                    dish = Dish.objects.create(
                        dish_name=row['dish_name'],
                        image_url=row['image_url'],
                        ingredients=ingredients,
                        veg_class=veg_class,
                        fat_g=nutrition.get('fat_g', 0),
                        protein_g=nutrition.get('protein_g', 0),
                        carbohydrate_g=nutrition.get('carbohydrate_g', 0),
                        calories_kcal=nutrition.get('calories_kcal', 0)
                    )

                    # Handle allergens
                    allergens_raw = row.get('allergens', '').strip().lower()
                    if allergens_raw and allergens_raw != 'none':
                        allergens_list = [a.strip() for a in allergens_raw.split(',')]
                        for allergen_name in allergens_list:
                            allergen, _ = Allergen.objects.get_or_create(allergen_name=allergen_name)
                            AllergenDish.objects.create(dish=dish, allergen=allergen)

                    imported_count += 1

                except Exception as e:
                    skipped_count += 1
                    self.stderr.write(f"Error importing {row.get('dish_name', 'Unknown')}: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"Successfully imported {imported_count} dishes. Skipped {skipped_count} rows."
        ))

