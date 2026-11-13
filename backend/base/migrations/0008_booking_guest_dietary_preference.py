from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0007_meal_serving_days"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="guest_dietary_preference",
            field=models.CharField(
                choices=[
                    ("none", "No preference"),
                    ("vegetarian", "Vegetarian"),
                    ("vegan", "Vegan"),
                    ("gluten_free", "Gluten free"),
                ],
                default="none",
                max_length=20,
            ),
        ),
    ]
