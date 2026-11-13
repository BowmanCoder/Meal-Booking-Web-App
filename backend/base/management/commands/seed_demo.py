import random
from datetime import datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from base.models import Booking, DietaryPreference, Meal, MealUser, Menu, Role

DEMO_PASSWORD = "DemoPass#2026"
HISTORY_DAYS = 28
UPCOMING_DAYS = 7

MEALS = [
    # name, served at, booking closes at, days before
    ("Breakfast", time(8, 0), time(20, 0), 1),
    ("Lunch", time(12, 30), time(9, 30), 0),
    ("Dinner", time(19, 30), time(15, 0), 0),
]

DISHES = {
    "Breakfast": [
        "Masala dosa, sambar, coconut chutney",
        "Poha, boiled egg, fruit",
        "Idli, sambar, tomato chutney",
        "Aloo paratha, curd, pickle",
        "Upma, banana, filter coffee",
    ],
    "Lunch": [
        "Dal tadka, jeera rice, roti, salad",
        "Paneer butter masala, naan, raita",
        "Veg biryani, boondi raita",
        "Rajma, steamed rice, roti",
        "Chole, bhature, onion salad",
        "Sambar rice, beans poriyal, papad",
    ],
    "Dinner": [
        "Mixed veg curry, roti, dal",
        "Palak paneer, jeera rice",
        "Veg pulao, kadhi",
        "Aloo gobi, roti, curd",
        "Khichdi, papad, pickle",
    ],
}

STAFF_ACCOUNTS = [
    ("admin@example.com", "Asha Admin", Role.ADMIN),
    ("staff@example.com", "Sam Staff", Role.STAFF),
]

EMPLOYEES = [
    ("employee@example.com", "Eli Employee", DietaryPreference.NONE),
    ("priya@example.com", "Priya Nair", DietaryPreference.VEGETARIAN),
    ("marcus@example.com", "Marcus Lee", DietaryPreference.NONE),
    ("fatima@example.com", "Fatima Khan", DietaryPreference.NONE),
    ("jonas@example.com", "Jonas Weber", DietaryPreference.VEGAN),
    ("mei@example.com", "Mei Tanaka", DietaryPreference.VEGETARIAN),
    ("diego@example.com", "Diego Alvarez", DietaryPreference.NONE),
    ("anika@example.com", "Anika Rao", DietaryPreference.VEGETARIAN),
    ("tom@example.com", "Tom Becker", DietaryPreference.GLUTEN_FREE),
    ("zara@example.com", "Zara Ahmed", DietaryPreference.NONE),
    ("leo@example.com", "Leo Martin", DietaryPreference.VEGAN),
    ("nina@example.com", "Nina Petrova", DietaryPreference.NONE),
]

# Share of employees who book each meal, by weekday (Mon=0). Weekends are quiet.
DEMAND = {
    "Breakfast": [0.35, 0.40, 0.40, 0.35, 0.25, 0.05, 0.05],
    "Lunch": [0.80, 0.90, 0.90, 0.85, 0.65, 0.10, 0.10],
    "Dinner": [0.30, 0.30, 0.35, 0.30, 0.15, 0.05, 0.05],
}
NO_SHOW_RATE = 0.12


class Command(BaseCommand):
    help = (
        "Create demo meals, menus, accounts and booking history. "
        "Safe to run more than once: existing records are left alone."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        rng = random.Random(2026)
        today = timezone.localdate()

        meals = {}
        for name, serve, cutoff, days_before in MEALS:
            meals[name], _ = Meal.objects.get_or_create(
                name=name,
                defaults={
                    "serve_time": serve,
                    "cutoff_time": cutoff,
                    "cutoff_days_before": days_before,
                },
            )

        for offset in range(-HISTORY_DAYS, UPCOMING_DAYS + 7):
            day = today + timedelta(days=offset)
            for name, meal in meals.items():
                dishes = DISHES[name]
                Menu.objects.get_or_create(
                    date=day,
                    meal=meal,
                    defaults={"description": dishes[day.toordinal() % len(dishes)]},
                )

        for email, fullname, role in STAFF_ACCOUNTS:
            self._user(email, fullname, role=role, is_admin=(role == Role.ADMIN))
        employees = [
            self._user(email, fullname, dietary_preference=diet)
            for email, fullname, diet in EMPLOYEES
        ]
        staff = MealUser.objects.get(email="staff@example.com")

        if Booking.objects.exists():
            self.stdout.write("Bookings already exist, so no demo bookings were added.")
        else:
            bookings = []
            for offset in range(-HISTORY_DAYS, UPCOMING_DAYS + 1):
                day = today + timedelta(days=offset)
                for name, meal in meals.items():
                    share = DEMAND[name][day.weekday()]
                    for employee in employees:
                        if rng.random() >= share:
                            continue
                        booking = Booking(user=employee, meal=meal, date=day)
                        if offset < 0 and rng.random() >= NO_SHOW_RATE:
                            served = datetime.combine(day, meal.serve_time)
                            served += timedelta(minutes=rng.randint(0, 40))
                            booking.redeemed_at = timezone.make_aware(served)
                            booking.redeemed_by = staff
                        bookings.append(booking)
            Booking.objects.bulk_create(bookings)
            self.stdout.write(f"Created {len(bookings)} demo bookings.")

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data ready. App sign-ins: admin@example.com, staff@example.com, "
                f"employee@example.com. Password for all: {DEMO_PASSWORD}\n"
                "Only admin@example.com can open the Django admin at /admin/."
            )
        )

    def _user(self, email, fullname, **fields):
        user = MealUser.objects.filter(email=email).first()
        if user is None:
            user = MealUser.objects.create_user(
                email=email, fullname=fullname, password=DEMO_PASSWORD, **fields
            )
        return user
