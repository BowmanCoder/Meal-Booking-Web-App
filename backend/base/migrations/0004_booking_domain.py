import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Replace the prototype `Uni` table with meals, menus and per-day bookings.

    Prototype bookings were date ranges with no meal, so they cannot be
    converted and are dropped.
    """

    dependencies = [
        ("base", "0003_uni"),
    ]

    operations = [
        migrations.AddField(
            model_name="mealuser",
            name="role",
            field=models.CharField(
                choices=[
                    ("employee", "Employee"),
                    ("staff", "Canteen staff"),
                    ("admin", "Admin"),
                ],
                default="employee",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="mealuser",
            name="dietary_preference",
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
        migrations.DeleteModel(name="Uni"),
        migrations.CreateModel(
            name="Meal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=50, unique=True)),
                ("serve_time", models.TimeField()),
                ("cutoff_time", models.TimeField()),
                ("cutoff_days_before", models.PositiveSmallIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["serve_time"]},
        ),
        migrations.CreateModel(
            name="Menu",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("description", models.TextField()),
                ("meal", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="menus", to="base.meal")),
            ],
            options={"ordering": ["date", "meal__serve_time"]},
        ),
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("guest_name", models.CharField(blank=True, default="", max_length=100)),
                ("coupon_code", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("redeemed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("meal", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="base.meal")),
                ("redeemed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="redemptions", to=settings.AUTH_USER_MODEL)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookings", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["date", "meal__serve_time", "id"]},
        ),
        migrations.AddConstraint(
            model_name="menu",
            constraint=models.UniqueConstraint(fields=("date", "meal"), name="unique_menu_per_date_and_meal"),
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=models.UniqueConstraint(
                condition=models.Q(("guest_name", "")),
                fields=("user", "date", "meal"),
                name="unique_own_booking_per_date_and_meal",
            ),
        ),
    ]
