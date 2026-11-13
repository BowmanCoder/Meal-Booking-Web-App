import uuid
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone

class MealUserManager(BaseUserManager):
    def create_user(self, email, fullname="", password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        # Emails are stored lower-case so login is not case-sensitive.
        user = self.model(email=email.strip().lower(), fullname=fullname, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, fullname="", password=None, **extra_fields):
        extra_fields.setdefault("is_admin", True)
        extra_fields.setdefault("role", Role.ADMIN)
        return self.create_user(email, fullname=fullname, password=password, **extra_fields)


class Role(models.TextChoices):
    EMPLOYEE = "employee", "Employee"
    STAFF = "staff", "Canteen staff"
    ADMIN = "admin", "Admin"


class DietaryPreference(models.TextChoices):
    NONE = "none", "No preference"
    VEGETARIAN = "vegetarian", "Vegetarian"
    VEGAN = "vegan", "Vegan"
    GLUTEN_FREE = "gluten_free", "Gluten free"


class MealUser(AbstractBaseUser):
    fullname = models.TextField()
    email = models.EmailField(
        verbose_name="email",
        max_length=255,
        unique=True,
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    dietary_preference = models.CharField(
        max_length=20,
        choices=DietaryPreference.choices,
        default=DietaryPreference.NONE,
    )
    # Evening-before email listing tomorrow's booked meals.
    email_reminders = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MealUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["fullname"]

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return self.is_admin

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin


    @property
    def is_canteen_admin(self):
        """Can manage meals, menus and every booking."""
        return self.is_admin or self.role == Role.ADMIN

    @property
    def is_canteen_staff(self):
        """Can see every booking and redeem coupons. Admins count as staff."""
        return self.is_canteen_admin or self.role == Role.STAFF


class Meal(models.Model):
    """A bookable meal slot such as Breakfast, Lunch or Dinner."""

    name = models.CharField(max_length=50, unique=True)
    serve_time = models.TimeField()
    # Bookings and cancellations for a given day close at `cutoff_time`,
    # `cutoff_days_before` days earlier (0 = the same day).
    cutoff_time = models.TimeField()
    cutoff_days_before = models.PositiveSmallIntegerField(default=0)
    serving_days = models.CharField(
        max_length=7,
        default="01234",
        help_text="Weekdays this meal is served, as digits: 0 is Monday, 6 is Sunday.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["serve_time"]

    def __str__(self):
        return self.name

    def cutoff_for(self, date):
        """The moment after which `date` can no longer be booked or cancelled."""
        cutoff_day = date - timedelta(days=self.cutoff_days_before)
        return timezone.make_aware(datetime.combine(cutoff_day, self.cutoff_time))

    def is_served_on(self, date):
        return str(date.weekday()) in self.serving_days

    def is_before_cutoff(self, date):
        return timezone.now() < self.cutoff_for(date)

    def is_open_for(self, date):
        """Can `date` still be booked? It must be a serving day, before the cut-off."""
        return self.is_served_on(date) and self.is_before_cutoff(date)


class Menu(models.Model):
    """What is being served for one meal on one date."""

    date = models.DateField()
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name="menus")
    description = models.TextField()

    class Meta:
        ordering = ["date", "meal__serve_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["date", "meal"], name="unique_menu_per_date_and_meal"
            ),
        ]

    def __str__(self):
        return f"{self.meal} on {self.date}"


class Booking(models.Model):
    """One person's place at one meal on one date, with its own coupon."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )
    meal = models.ForeignKey(Meal, on_delete=models.PROTECT, related_name="bookings")
    date = models.DateField()
    # Empty for the employee's own meal; filled in when booking for a guest.
    guest_name = models.CharField(max_length=100, blank=True, default="")
    coupon_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    redeemed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="redemptions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "meal__serve_time", "id"]
        constraints = [
            # One own meal per person, date and meal. Guest bookings are exempt.
            models.UniqueConstraint(
                fields=["user", "date", "meal"],
                condition=models.Q(guest_name=""),
                name="unique_own_booking_per_date_and_meal",
            ),
        ]

    def __str__(self):
        who = self.guest_name or self.user.email
        return f"{who}: {self.meal} on {self.date}"

    @property
    def is_guest(self):
        return bool(self.guest_name)

    @property
    def is_redeemed(self):
        return self.redeemed_at is not None
