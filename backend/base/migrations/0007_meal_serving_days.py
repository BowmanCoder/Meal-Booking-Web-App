from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0006_mealuser_email_reminders"),
    ]

    operations = [
        migrations.AddField(
            model_name="meal",
            name="serving_days",
            field=models.CharField(
                default="01234",
                help_text="Weekdays this meal is served, as digits: 0 is Monday, 6 is Sunday.",
                max_length=7,
            ),
        ),
    ]
