from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0008_booking_guest_dietary_preference"),
    ]

    operations = [
        migrations.AddField(
            model_name="menu",
            name="photo",
            field=models.ImageField(blank=True, upload_to="menus/"),
        ),
    ]
