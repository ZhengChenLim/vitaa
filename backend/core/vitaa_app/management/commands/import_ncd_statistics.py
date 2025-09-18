import csv
import re
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from vitaa_app.models import NCDDeathStat  # <-- see model stub below if you don't have this yet

# ---------- Helpers ----------
ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\uFEFF]")

def snake(s: str) -> str:
    s = ZERO_WIDTH_RE.sub("", s or "")
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def clean_val(v):
    if v is None:
        return ""
    s = ZERO_WIDTH_RE.sub("", str(v)).strip()
    return "" if s.lower() in {"nan", "null", "none"} else s

def to_decimal(x, default="0"):
    if x is None or x == "":
        return Decimal(default)
    try:
        return Decimal(str(x))
    except Exception:
        return Decimal(default)

def to_int_like(x):
    # Handles scientific notation or floats that should be rounded to nearest int
    try:
        return int(Decimal(str(x)).to_integral_value(rounding="ROUND_HALF_UP"))
    except Exception:
        return None

def pick_key(columns: set[str], candidates: list[str]) -> str | None:
    # exact match, else prefix match
    for c in candidates:
        if c in columns:
            return c
    for c in candidates:
        for col in columns:
            if col.startswith(c):
                return col
    return None

# Accept common header variants
YEAR_CANDS      = ["year"]
LOCATION_CANDS  = ["location", "location_name", "country", "country_name"]
CAUSE_CANDS     = ["cause", "cause_name", "cause_of_death"]
NUMBER_CANDS    = ["number_of_deaths", "number", "deaths", "n"]
PERCENT_CANDS   = ["percent_of_deaths", "percent", "pct", "percentage"]

class Command(BaseCommand):
    help = "Import NCD death stats from CSV (idempotent on year+location+cause). Usage: python manage.py import_ncd_statistics [--path data/ncd_statistics.csv]"

    def add_arguments(self, parser):
        parser.add_argument("--path", type=str, default="data/ncd_statistics.csv", help="Path to CSV file")

    @transaction.atomic
    def handle(self, *args, **kwargs):
        csv_path = Path(kwargs["path"])
        if not csv_path.exists():
            raise CommandError(f"CSV file not found: {csv_path}")

        # 1) Sniff dialect & read headers
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

        # 2) Map required columns
        year_col   = pick_key(header_set, YEAR_CANDS)
        loc_col    = pick_key(header_set, LOCATION_CANDS)
        cause_col  = pick_key(header_set, CAUSE_CANDS)
        num_col    = pick_key(header_set, NUMBER_CANDS)
        pct_col    = pick_key(header_set, PERCENT_CANDS)

        required = {
            "year": year_col, "location": loc_col,
            "cause": cause_col, "number_of_deaths": num_col, "percent_of_deaths": pct_col
        }
        missing = [k for k, v in required.items() if not v]
        if missing:
            raise CommandError(
                "Required columns not found.\n"
                f"Detected: {headers}\n"
                f"Missing logical fields: {missing}\n"
                f"Looked for year in {YEAR_CANDS}\n"
                f"location in {LOCATION_CANDS}\n"
                f"cause in {CAUSE_CANDS}\n"
                f"number in {NUMBER_CANDS}\n"
                f"percent in {PERCENT_CANDS}"
            )

        self.stdout.write(self.style.NOTICE(
            "Using columns → "
            f"year={year_col}, location={loc_col}, cause={cause_col}, "
            f"number_of_deaths={num_col}, percent_of_deaths={pct_col}"
        ))

        # 3) Iterate rows
        imported, updated, skipped = 0, 0, 0
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh, fieldnames=headers, dialect=dialect, skipinitialspace=True)
            next(reader, None)  # skip header row

            for idx, row in enumerate(reader, start=2):
                try:
                    year_raw = clean_val(row.get(year_col))
                    loc      = clean_val(row.get(loc_col))
                    cause    = clean_val(row.get(cause_col))
                    num_raw  = clean_val(row.get(num_col))
                    pct_raw  = clean_val(row.get(pct_col))

                    if not (year_raw and loc and cause):
                        skipped += 1
                        self.stderr.write(f"Row {idx}: Missing key fields (year/location/cause). Skipping.")
                        continue

                    # year → int
                    try:
                        year = int(year_raw)
                    except Exception:
                        skipped += 1
                        self.stderr.write(f"Row {idx}: Bad year '{year_raw}'. Skipping.")
                        continue

                    # number_of_deaths
                    number_int = to_int_like(num_raw)
                    number_val = to_decimal(num_raw) if number_int is None else Decimal(number_int)

                    # percent_of_deaths
                    percent_val = to_decimal(pct_raw)

                    lookup = {"year": year, "location": loc, "cause": cause}
                    defaults = {
                        "number_of_deaths": number_val,
                        "percent_of_deaths": percent_val,
                    }

                    obj, created = NCDDeathStat.objects.update_or_create(**lookup, defaults=defaults)
                    if created:
                        imported += 1
                    else:
                        updated += 1

                except Exception as e:
                    skipped += 1
                    self.stderr.write(
                        f"Row {idx}: Error importing '{loc or '?'} | {cause or '?'} | {year_raw or '?'}': {e}"
                    )

        self.stdout.write(self.style.SUCCESS(
            f"Done. Imported {imported}, Updated {updated}, Skipped {skipped}."
        ))