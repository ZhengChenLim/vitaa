from django.db import models

class Food(models.Model):
    food_id = models.AutoField(primary_key=True)  # Auto-generated ID
    
    # Basic
    name = models.CharField(max_length=255, unique=True)

    # Macronutrients
    caloric_value = models.FloatField(null=True, blank=True) 
    fat = models.FloatField(null=True, blank=True)
    saturated_fats = models.FloatField(null=True, blank=True)
    monounsaturated_fats = models.FloatField(null=True, blank=True)
    polyunsaturated_fats = models.FloatField(null=True, blank=True)
    carbohydrates = models.FloatField(null=True, blank=True)
    sugars = models.FloatField(null=True, blank=True)
    protein = models.FloatField(null=True, blank=True)
    dietary_fiber = models.FloatField(null=True, blank=True)
    cholesterol = models.FloatField(null=True, blank=True)
    sodium = models.FloatField(null=True, blank=True)
    water = models.FloatField(null=True, blank=True)

    # Extra
    nutrition_density = models.FloatField(null=True, blank=True)


    #New fields
    veg_class = models.CharField(max_length=255, null=False, blank=True) # veterinary class
    allergen = models.CharField(max_length=255, null=True, blank=True)  # allergen description

    def __str__(self):
        return f"{self.food_id} - {self.name} ({self.vet_class})"

