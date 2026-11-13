from django.db import migrations


class Migration(migrations.Migration):
    """Stop storing personal details that booking a meal does not need."""

    dependencies = [
        ("base", "0004_booking_domain"),
    ]

    operations = [
        migrations.RemoveField(model_name="mealuser", name="username"),
        migrations.RemoveField(model_name="mealuser", name="date_of_birth"),
        migrations.RemoveField(model_name="mealuser", name="contact"),
        migrations.RemoveField(model_name="mealuser", name="gender"),
        migrations.RemoveField(model_name="mealuser", name="address"),
    ]
