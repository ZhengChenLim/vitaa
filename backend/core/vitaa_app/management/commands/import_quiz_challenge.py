# vitaa_app/management/commands/import_quiz_challenge.py

import re
import pandas as pd
from django.core.management.base import BaseCommand
from django.db import transaction
from vitaa_app.models import WeeklyPhysicalChallenge, NCDQuizQuestion

# ---------- helpers ----------

ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\uFEFF]")

def snake(s: str) -> str:
    """Normalize a header to snake_case (robust to spaces/nbspace/zero-width chars)."""
    s = ZERO_WIDTH_RE.sub("", str(s or "")).strip().replace("\u00A0", " ")
    s = re.sub(r"\s+", " ", s).lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def first_nonempty(row: dict, *keys):
    """Return the first non-empty value for any of the provided keys."""
    for k in keys:
        v = row.get(k)
        if v is not None and str(v).strip() != "":
            return v
    return None

def normalize_quiz_kwargs(row: dict) -> dict:
    """
    Row keys are already snake-cased by import_quiz().
    Supports both legacy names (optiona_ms) and new names (option_a_ms).
    """
    return {
        "topic": first_nonempty(row, "topic", "topics", "category"),

        "question":     first_nonempty(row, "question"),
        "question_ms":  first_nonempty(row, "question_ms", "question_ms_my"),
        "question_zh":  first_nonempty(row, "question_zh", "question_cn"),
        "question_vi":  first_nonempty(row, "question_vi"),

        "option_a":     first_nonempty(row, "option_a"),
        "option_a_ms":  first_nonempty(row, "option_a_ms", "optiona_ms"),
        "option_a_zh":  first_nonempty(row, "option_a_zh", "optiona_zh"),
        "option_a_vi":  first_nonempty(row, "option_a_vi", "optiona_vi"),

        "option_b":     first_nonempty(row, "option_b"),
        "option_b_ms":  first_nonempty(row, "option_b_ms", "optionb_ms"),
        "option_b_zh":  first_nonempty(row, "option_b_zh", "optionb_zh"),
        "option_b_vi":  first_nonempty(row, "option_b_vi", "optionb_vi"),

        "option_c":     first_nonempty(row, "option_c"),
        "option_c_ms":  first_nonempty(row, "option_c_ms", "optionc_ms"),
        "option_c_zh":  first_nonempty(row, "option_c_zh", "optionc_zh"),
        "option_c_vi":  first_nonempty(row, "option_c_vi", "optionc_vi"),

        "option_d":     first_nonempty(row, "option_d"),
        "option_d_ms":  first_nonempty(row, "option_d_ms", "optiond_ms"),
        "option_d_zh":  first_nonempty(row, "option_d_zh", "optiond_zh"),
        "option_d_vi":  first_nonempty(row, "option_d_vi", "optiond_vi"),

        "correct_option": first_nonempty(row, "correct_option", "answer"),
    }

# ---------- command ----------

class Command(BaseCommand):
    help = "Import data from Excel files into WeeklyPhysicalChallenge and NCDQuizQuestion tables"

    def add_arguments(self, parser):
        parser.add_argument("--challenges", type=str, help="Path to Weekly_Physical_Challenges_Translated.xlsx")
        parser.add_argument("--quiz", type=str, help="Path to NCD_Quiz_Translated.xlsx")

    def handle(self, *args, **options):
        if options.get("challenges"):
            self.import_challenges(options["challenges"])
        if options.get("quiz"):
            self.import_quiz(options["quiz"])

    # ----- challenges -----

    def import_challenges(self, filepath: str):
        df = pd.read_excel(filepath)
        df.columns = [snake(c) for c in df.columns]  # e.g., "Challenge_ms" -> "challenge_ms"

        records = df.to_dict(orient="records")
        objs = []
        for row in records:
            challenge = first_nonempty(row, "challenge")
            if not challenge:
                continue
            objs.append(WeeklyPhysicalChallenge(
                challenge=challenge,
                challenge_ms=row.get("challenge_ms"),
                challenge_zh=row.get("challenge_zh"),
                challenge_vi=row.get("challenge_vi"),
            ))

        if not objs:
            self.stdout.write(self.style.WARNING("No challenges detected to import."))
            return

        WeeklyPhysicalChallenge.objects.bulk_create(objs, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f"Imported {len(objs)} challenges."))

    # ----- quiz -----

    def import_quiz(self, filepath: str):
        df = pd.read_excel(filepath)
        # Critical: normalize headers like 'Option A' -> 'option_a'
        df.columns = [snake(c) for c in df.columns]
        records = df.to_dict(orient="records")

        objs = []
        for row in records:
            kwargs = normalize_quiz_kwargs(row)

            # Required fields guard (prevents empty rows)
            if not (kwargs["topic"] and kwargs["question"]
                    and kwargs["option_a"] and kwargs["option_b"]
                    and kwargs["option_c"] and kwargs["option_d"]
                    and kwargs["correct_option"]):
                continue

            # Normalize correct_option to A/B/C/D
            ans = str(kwargs["correct_option"]).strip().upper()[:1]
            if ans not in {"A", "B", "C", "D"}:
                continue
            kwargs["correct_option"] = ans

            objs.append(NCDQuizQuestion(**kwargs))

        if not objs:
            self.stdout.write(self.style.WARNING("No quiz rows detected to import."))
            return

        before = NCDQuizQuestion.objects.count()
        with transaction.atomic():
            # Use ignore_conflicts=False first to surface real issues; set True if needed later.
            NCDQuizQuestion.objects.bulk_create(objs, ignore_conflicts=False)
        after = NCDQuizQuestion.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Inserted {after - before} / tried {len(objs)} quiz questions."
        ))
