import csv
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from vitaa_app.models import PhysicalActivity


def _clean(s):
    return (s or "").strip()

class Command(BaseCommand):
    help = "Import physical_activity.csv into PhysicalActivity table."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            required=True,
            help="Path to physical_activity.csv",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            help="If present, update existing rows (matched by activity_code).",
        )

    def handle(self, *args, **opts):
        path = opts["path"]
        update = opts["update"]

        try:
            with open(path, "r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
        except FileNotFoundError:
            raise CommandError(f"File not found: {path}")
        except Exception as e:
            raise CommandError(f"Failed to read CSV: {e}")

        created, updated = 0, 0
        to_create = []

        for r in rows:
            try:
                activity_code = int(_clean(r.get("Activity Code")))
            except (TypeError, ValueError):
                self.stderr.write(self.style.WARNING(f"Skipping row with invalid Activity Code: {r}"))
                continue

            met_raw = _clean(r.get("MET Value"))
            try:
                # keep 2dp; Decimal handles exactness better than float
                met_value = Decimal(met_raw)
            except (InvalidOperation, TypeError):
                self.stderr.write(self.style.WARNING(f"Skipping row with invalid MET Value: {r}"))
                continue

            data = dict(
                major_heading=_clean(r.get("Major Heading")),
                major_heading_ms=_clean(r.get("Major_Heading_MS")),
                major_heading_cn=_clean(r.get("Major_Heading_CN")),
                major_heading_vn=_clean(r.get("Major_Heading_VN")),
                activity_code=activity_code,
                met_value=met_value,
                activity_description=_clean(r.get("Activity Description")),
                activity_description_ms=_clean(r.get("Activity_Description_MS")),
                activity_description_cn=_clean(r.get("Activity_Description_CN")),
                activity_description_vn=_clean(r.get("Activity_Description_VN")),
            )

            if update:
                obj, was_created = PhysicalActivity.objects.update_or_create(
                    activity_code=activity_code,
                    defaults=data,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            else:
                to_create.append(PhysicalActivity(**data))

        if not update and to_create:
            # avoid duplicates if command is run twice without --update
            # ignore_conflicts=True skips rows whose unique activity_code already exists
            PhysicalActivity.objects.bulk_create(to_create, ignore_conflicts=True, batch_size=500)
            created = len(to_create)

        self.stdout.write(self.style.SUCCESS(
            f"Done. Created={created}" + (f", Updated={updated}" if update else "")
        ))
