import pandas as pd
from django.core.management.base import BaseCommand
from vitaa_app.models import WeeklyPhysicalChallenge, NCDQuizQuestion



class Command(BaseCommand):
    help = "Import data from Excel files into WeeklyPhysicalChallenge and NCDQuizQuestion tables"

    def add_arguments(self, parser):
        parser.add_argument(
            "--challenges",
            type=str,
            help="Path to Weekly_Physical_Challenges_Translated.xlsx",
        )
        parser.add_argument(
            "--quiz",
            type=str,
            help="Path to NCD_Quiz_Translated.xlsx",
        )

    def handle(self, *args, **options):
        if options["challenges"]:
            self.import_challenges(options["challenges"])
        if options["quiz"]:
            self.import_quiz(options["quiz"])

    def import_challenges(self, filepath):
        df = pd.read_excel(filepath)

        objs = [
            WeeklyPhysicalChallenge(
                challenge=row["Challenge"],
                challenge_ms=row.get("Challenge_ms", None),
                challenge_zh=row.get("Challenge_zh", None),
                challenge_vi=row.get("Challenge_vi", None),
            )
            for _, row in df.iterrows()
        ]

        WeeklyPhysicalChallenge.objects.bulk_create(objs, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f"Imported {len(objs)} challenges."))

    def import_quiz(self, filepath):
        df = pd.read_excel(filepath)

        objs = [
            NCDQuizQuestion(
                topic=row["Topic"],
                question=row["Question"],
                question_ms=row.get("Question_ms", None),
                question_zh=row.get("Question_zh", None),
                question_vi=row.get("Question_vi", None),

                option_a=row["Option A"],
                optiona_ms=row.get("OptionA_ms", None),
                optiona_zh=row.get("OptionA_zh", None),
                optiona_vi=row.get("OptionA_vi", None),

                option_b=row["Option B"],
                optionb_ms=row.get("OptionB_ms", None),
                optionb_zh=row.get("OptionB_zh", None),
                optionb_vi=row.get("OptionB_vi", None),

                option_c=row["Option C"],
                optionc_ms=row.get("OptionC_ms", None),
                optionc_zh=row.get("OptionC_zh", None),
                optionc_vi=row.get("OptionC_vi", None),

                option_d=row["Option D"],
                optiond_ms=row.get("OptionD_ms", None),
                optiond_zh=row.get("OptionD_zh", None),
                optiond_vi=row.get("OptionD_vi", None),

                correct_option=row["Correct Option"],
            )
            for _, row in df.iterrows()
        ]

        NCDQuizQuestion.objects.bulk_create(objs, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f"Imported {len(objs)} quiz questions."))

