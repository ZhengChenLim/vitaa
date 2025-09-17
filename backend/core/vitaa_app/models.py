from django.db import models

class Allergen(models.Model):
    allergen_id = models.AutoField(primary_key=True)
    allergen_name = models.CharField(max_length=255)

    class Meta:
        db_table = 'allergen'
        verbose_name = 'Allergen'
        verbose_name_plural = 'Allergens'

    def __str__(self):
        return self.allergen_name


class Dish(models.Model):
    dish_id = models.AutoField(primary_key=True)
    dish_name = models.CharField(max_length=255)
    dish_ms_name = models.CharField(max_length=255, null=True, blank=True)
    dish_vi_name = models.CharField(max_length=255, null=True, blank=True)
    dish_zh_name = models.CharField(max_length=255, null=True, blank=True)
    image_url = models.CharField(max_length=255)
    ingredients = models.CharField(max_length=255)
    veg_class = models.CharField(max_length=255)
    fat_g = models.DecimalField(max_digits=7, decimal_places=1)
    protein_g = models.DecimalField(max_digits=7, decimal_places=1)
    carbohydrate_g = models.DecimalField(max_digits=7, decimal_places=1)
    calories_kcal = models.IntegerField()

    class Meta:
        db_table = 'dish'
        unique_together = ('dish_name', 'image_url')
        verbose_name = 'Dish'
        verbose_name_plural = 'Dishes'

    def __str__(self):
        return self.dish_name


class AllergenDish(models.Model):
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    allergen = models.ForeignKey(Allergen, on_delete=models.CASCADE)

    class Meta:
        db_table = 'allergen_dish'
        unique_together = ('dish', 'allergen')
        verbose_name = 'Allergen Dish'
        verbose_name_plural = 'Allergen Dishes'

    def __str__(self):
        return f"{self.dish.dish_name} - {self.allergen.allergen_name}"
    
class PhysicalActivity(models.Model):
    # From physical_activity.csv
    major_heading = models.CharField(max_length=200)
    major_heading_ms = models.CharField(max_length=200, blank=True)
    major_heading_cn = models.CharField(max_length=200, blank=True)
    major_heading_vn = models.CharField(max_length=200, blank=True)

    activity_code = models.IntegerField(unique=True, db_index=True)

    met_value = models.DecimalField(max_digits=5, decimal_places=2)

    activity_description = models.CharField(max_length=500)
    activity_description_ms = models.CharField(max_length=500, blank=True)
    activity_description_cn = models.CharField(max_length=500, blank=True)
    activity_description_vn = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "physical_activity"
        verbose_name = "Physical Activity"
        verbose_name_plural = "Physical Activities"
        indexes = [
            models.Index(fields=["major_heading"]),
            models.Index(fields=["activity_description"]),
        ]

    def __str__(self):
        return f"{self.activity_code} - {self.activity_description}"
    
    
class WeeklyPhysicalChallenge(models.Model):
    challenge_id = models.AutoField(primary_key=True)
    challenge = models.CharField(max_length=500)
    challenge_ms = models.CharField(max_length=500, blank=True, null=True)
    challenge_zh = models.CharField(max_length=500, blank=True, null=True)
    challenge_vi = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = "weekly_physical_challenge"
        verbose_name = "Weekly Physical Challenge"
        verbose_name_plural = "Weekly Physical Challenges"

    def __str__(self):
        return self.challenge


class NCDQuizQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    topic = models.CharField(max_length=255)

    question = models.CharField(max_length=1000)
    question_ms = models.CharField(max_length=1000, blank=True, null=True)
    question_zh = models.CharField(max_length=1000, blank=True, null=True)
    question_vi = models.CharField(max_length=1000, blank=True, null=True)

    option_a = models.CharField(max_length=500)
    optiona_ms = models.CharField(max_length=500, blank=True, null=True)
    optiona_zh = models.CharField(max_length=500, blank=True, null=True)
    optiona_vi = models.CharField(max_length=500, blank=True, null=True)

    option_b = models.CharField(max_length=500)
    optionb_ms = models.CharField(max_length=500, blank=True, null=True)
    optionb_zh = models.CharField(max_length=500, blank=True, null=True)
    optionb_vi = models.CharField(max_length=500, blank=True, null=True)

    option_c = models.CharField(max_length=500)
    optionc_ms = models.CharField(max_length=500, blank=True, null=True)
    optionc_zh = models.CharField(max_length=500, blank=True, null=True)
    optionc_vi = models.CharField(max_length=500, blank=True, null=True)

    option_d = models.CharField(max_length=500)
    optiond_ms = models.CharField(max_length=500, blank=True, null=True)
    optiond_zh = models.CharField(max_length=500, blank=True, null=True)
    optiond_vi = models.CharField(max_length=500, blank=True, null=True)

    correct_option = models.CharField(max_length=10)

    class Meta:
        db_table = "ncd_quiz_question"
        verbose_name = "NCD Quiz Question"
        verbose_name_plural = "NCD Quiz Questions"

    def __str__(self):
        return f"{self.topic} - {self.question[:50]}..."


