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
