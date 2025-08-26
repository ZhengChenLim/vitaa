import csv
from django.core.management.base import BaseCommand
from vitaa_app.models import Food

class Command(BaseCommand):
    help = "Import food data from one or more CSV files into the Food model"

    def add_arguments(self, parser):
        parser.add_argument("csv_files", nargs="+", type=str, help="Path(s) to CSV file(s)")

    def handle(self, *args, **options):
        def to_float(value):
            try:
                return float(value) if value not in (None, "", "NA", "N/A") else None
            except ValueError:
                return None

        total_count = 0
        for csv_file in options["csv_files"]:
            with open(csv_file, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                count = 0

                for row in reader:
                    food, created = Food.objects.update_or_create(
                        name=row["food"],  # assumes CSV column is named "food"
                        defaults={
                            "caloric_value": to_float(row.get("Caloric Value")),
                            "fat": to_float(row.get("Fat")),
                            "saturated_fats": to_float(row.get("Saturated Fats")),
                            "monounsaturated_fats": to_float(row.get("Monounsaturated Fats")),
                            "polyunsaturated_fats": to_float(row.get("Polyunsaturated Fats")),
                            "carbohydrates": to_float(row.get("Carbohydrates")),
                            "sugars": to_float(row.get("Sugars")),
                            "protein": to_float(row.get("Protein")),
                            "dietary_fiber": to_float(row.get("Dietary Fiber")),
                            "cholesterol": to_float(row.get("Cholesterol")),
                            "sodium": to_float(row.get("Sodium")),
                            "water": to_float(row.get("Water")),
                            "nutrition_density": to_float(row.get("Nutrition Density")),
                        },
                    )
                    count += 1

                total_count += count
                self.stdout.write(self.style.SUCCESS(f"Imported {count} foods from {csv_file}"))

        self.stdout.write(self.style.SUCCESS(f"Total imported: {total_count} foods"))
