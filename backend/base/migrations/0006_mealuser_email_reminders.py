from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0005_slim_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="mealuser",
            name="email_reminders",
            field=models.BooleanField(default=True),
        ),
    ]
