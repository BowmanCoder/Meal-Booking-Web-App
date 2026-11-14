import random
from datetime import datetime, time, timedelta
from pathlib import Path

from django.core.files import File
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

# Each dish is (description, photo name). A photo is attached when a file with
# that name (.jpg, .jpeg, .png or .webp) exists in base/seed_photos/.
DISHES = {
    "Breakfast": [
        ("Masala dosa, sambar, coconut chutney", "masala-dosa"),
        ("Poha, boiled egg, fruit", "poha"),
        ("Idli, sambar, tomato chutney", "idli"),
        ("Aloo paratha, curd, pickle", "aloo-paratha"),
        ("Upma, banana, filter coffee", "upma"),
    ],
    "Lunch": [
        ("Dal tadka, jeera rice, roti, salad", "dal-tadka"),
        ("Paneer butter masala, naan, raita", "paneer-butter-masala"),
        ("Veg biryani, boondi raita", "veg-biryani"),
        ("Rajma, steamed rice, roti", "rajma"),
        ("Chole, bhature, onion salad", "chole-bhature"),
        ("Sambar rice, beans poriyal, papad", "sambar-rice"),
    ],
    "Dinner": [
        ("Mixed veg curry, roti, dal", "mixed-veg-curry"),
        ("Palak paneer, jeera rice", "palak-paneer"),
        ("Veg pulao, kadhi", "veg-pulao"),
        ("Aloo gobi, roti, curd", "aloo-gobi"),
        ("Khichdi, papad, pickle", "khichdi"),
    ],
}
PHOTO_NAMES = {
    description: name for dishes in DISHES.values() for description, name in dishes
}
SEED_PHOTO_DIR = Path(__file__).resolve().parents[2] / "seed_photos"
PHOTO_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

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

# Share of employees who book each meal, by weekday (Mon=0). Meals are served
# Monday to Friday by default, so the weekend figures only matter if an admin
# opens the canteen on those days.
DEMAND = {
    "Breakfast": [0.35, 0.40, 0.40, 0.35, 0.25, 0.05, 0.05],
    "Lunch": [0.80, 0.90, 0.90, 0.85, 0.65, 0.10, 0.10],
    "Dinner": [0.30, 0.30, 0.35, 0.30, 0.15, 0.05, 0.05],
}
NO_SHOW_RATE = 0.12


class Command(BaseCommand):
    help = (
        "Create demo meals, menus, accounts and booking history. "
        "Safe to run more than once, and meant to be run daily on the live "
        "demo: it only fills in days that have nothing yet."
    )

    @transaction.atomic
    def handle(self, *args, **options):
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
                if not meal.is_served_on(day):
                    continue
                dishes = DISHES[name]
                Menu.objects.get_or_create(
                    date=day,
                    meal=meal,
                    defaults={"description": dishes[day.toordinal() % len(dishes)][0]},
                )
        photos = self._attach_photos()

        for email, fullname, role in STAFF_ACCOUNTS:
            self._user(email, fullname, role=role, is_admin=(role == Role.ADMIN))
        employees = [
            self._user(email, fullname, dietary_preference=diet)
            for email, fullname, diet in EMPLOYEES
        ]
        staff = MealUser.objects.get(email="staff@example.com")

        created = self._top_up_bookings(today, meals, employees)
        settled = self._settle_past_bookings(today, staff)
        self.stdout.write(
            f"Added {created} demo booking(s); marked {settled} past booking(s) as served."
        )

        if photos:
            self.stdout.write(f"Attached {photos} dish photo(s).")
        self.stdout.write(
            self.style.SUCCESS(
                "Demo data ready. App sign-ins: admin@example.com, staff@example.com, "
                f"employee@example.com. Password for all: {DEMO_PASSWORD}\n"
                "Only admin@example.com can open the Django admin at /admin/."
            )
        )

    def _top_up_bookings(self, today, meals, employees):
        """Fill every day in the demo window that has no bookings yet.

        Run daily, this keeps the demo looking alive: tomorrow always has
        bookings and the kitchen dashboard always has recent history. Each
        day uses its own fixed random seed, so running twice changes nothing.
        """
        first = today - timedelta(days=HISTORY_DAYS)
        last = today + timedelta(days=UPCOMING_DAYS)
        busy_days = set(
            Booking.objects.filter(date__range=(first, last)).values_list("date", flat=True)
        )
        bookings = []
        for offset in range(-HISTORY_DAYS, UPCOMING_DAYS + 1):
            day = today + timedelta(days=offset)
            if day in busy_days:
                continue
            rng = random.Random(f"bookings-{day.isoformat()}")
            for name, meal in meals.items():
                if not meal.is_served_on(day):
                    continue
                share = DEMAND[name][day.weekday()]
                for employee in employees:
                    if rng.random() < share:
                        bookings.append(Booking(user=employee, meal=meal, date=day))
        Booking.objects.bulk_create(bookings)
        return len(bookings)

    def _settle_past_bookings(self, today, staff):
        """Mark most past demo bookings as served, leaving a few as no-shows.

        Only the demo employees' own bookings are touched. The decision is
        tied to the booking's id, so a no-show stays a no-show on later runs.
        """
        pending = Booking.objects.filter(
            date__lt=today,
            date__gte=today - timedelta(days=HISTORY_DAYS),
            redeemed_at__isnull=True,
            guest_name="",
            user__email__in=[email for email, _name, _diet in EMPLOYEES],
        ).select_related("meal")
        served = []
        for booking in pending:
            rng = random.Random(f"served-{booking.pk}")
            if rng.random() < NO_SHOW_RATE:
                continue
            at = datetime.combine(booking.date, booking.meal.serve_time)
            at += timedelta(minutes=rng.randint(0, 40))
            booking.redeemed_at = timezone.make_aware(at)
            booking.redeemed_by = staff
            served.append(booking)
        Booking.objects.bulk_update(served, ["redeemed_at", "redeemed_by"])
        return len(served)

    def _attach_photos(self):
        """Give every demo menu without a photo the picture for its dish, if we have one.

        Running the command again after adding files to seed_photos/ fills in
        the menus that were created earlier.
        """
        attached = 0
        for menu in Menu.objects.filter(photo=""):
            name = PHOTO_NAMES.get(menu.description)
            source = name and next(
                (
                    SEED_PHOTO_DIR / f"{name}{extension}"
                    for extension in PHOTO_EXTENSIONS
                    if (SEED_PHOTO_DIR / f"{name}{extension}").is_file()
                ),
                None,
            )
            if not source:
                continue
            with source.open("rb") as handle:
                menu.photo.save(source.name, File(handle), save=True)
            attached += 1
        return attached

    def _user(self, email, fullname, **fields):
        user = MealUser.objects.filter(email=email).first()
        if user is None:
            user = MealUser.objects.create_user(
                email=email, fullname=fullname, password=DEMO_PASSWORD, **fields
            )
        return user
