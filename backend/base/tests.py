import io
import re
import tempfile
from pathlib import Path
from datetime import datetime, time, timedelta
from datetime import timezone as dt_timezone
from unittest import mock

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from base import kitchen
from base.models import Booking, DietaryPreference, Meal, MealUser, Menu, Role

# The tests freeze "now" so cut-off rules do not depend on when they run.
NOW = datetime(2030, 1, 10, 8, 0, tzinfo=dt_timezone.utc)  # a Thursday, 08:00
TODAY = NOW.date()
TOMORROW = TODAY + timedelta(days=1)
YESTERDAY = TODAY - timedelta(days=1)
PASSWORD = "Correct-Horse-42"
EVERY_DAY = "0123456"


def make_user(email, role=Role.EMPLOYEE, **extra):
    return MealUser.objects.create_user(
        email=email, fullname="Test User", password=PASSWORD, role=role, **extra
    )


# Pinned to UTC so the frozen clock and the cut-off times line up whatever
# DJANGO_TIME_ZONE the developer has in their .env.
@override_settings(TIME_ZONE="UTC")
class FrozenTimeAPITestCase(APITestCase):
    def setUp(self):
        patcher = mock.patch("django.utils.timezone.now", return_value=NOW)
        patcher.start()
        self.addCleanup(patcher.stop)

        # Lunch closes at 09:30 the same day; breakfast at 20:00 the day before.
        # Both are served every day here; ServingDayTests covers closed days.
        self.lunch = Meal.objects.create(
            name="Lunch",
            serve_time=time(12, 30),
            cutoff_time=time(9, 30),
            serving_days=EVERY_DAY,
        )
        self.breakfast = Meal.objects.create(
            name="Breakfast",
            serve_time=time(8, 0),
            cutoff_time=time(20, 0),
            cutoff_days_before=1,
            serving_days=EVERY_DAY,
        )
        self.employee = make_user("employee@example.com")
        self.other = make_user("other@example.com")
        self.staff = make_user("staff@example.com", Role.STAFF)
        self.admin = make_user("admin@example.com", Role.ADMIN)

    def login(self, user):
        self.client.force_authenticate(user=user)

    def book(self, **body):
        body.setdefault("meal", self.lunch.id)
        return self.client.post("/api/bookings/", body, format="json")


class AuthenticationTests(FrozenTimeAPITestCase):
    def test_booking_endpoints_require_login(self):
        self.assertEqual(
            self.client.get("/api/bookings/").status_code, status.HTTP_401_UNAUTHORIZED
        )
        self.assertEqual(self.book(date=TOMORROW).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            self.client.get("/api/meals/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_prototype_endpoints_are_gone(self):
        self.login(self.employee)
        for url in ["/api/bookdetail/", "/api/task-delete/1/", "/api/event/save/"]:
            self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_login_with_wrong_password_is_401(self):
        response = self.client.post(
            "/api/login/",
            {"email": "employee@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CreateBookingTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        self.login(self.employee)

    def test_book_single_day(self):
        response = self.book(date=TOMORROW)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(len(response.data), 1)
        booking = Booking.objects.get()
        self.assertEqual(booking.user, self.employee)
        self.assertEqual(booking.date, TOMORROW)
        self.assertEqual(response.data[0]["coupon_code"], str(booking.coupon_code))
        self.assertFalse(response.data[0]["is_redeemed"])

    def test_booking_always_belongs_to_the_caller(self):
        response = self.book(date=TOMORROW, user=self.other.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Booking.objects.get().user, self.employee)

    def test_range_creates_one_booking_per_day_with_distinct_coupons(self):
        response = self.book(start_date=TOMORROW, end_date=TOMORROW + timedelta(days=4))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Booking.objects.count(), 5)
        coupons = {b["coupon_code"] for b in response.data}
        self.assertEqual(len(coupons), 5)

    def test_duplicate_booking_is_rejected(self):
        self.assertEqual(self.book(date=TOMORROW).status_code, status.HTTP_201_CREATED)
        response = self.book(date=TOMORROW)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 1)

    def test_range_overlapping_an_existing_booking_creates_nothing(self):
        self.book(date=TOMORROW + timedelta(days=2))
        response = self.book(start_date=TOMORROW, end_date=TOMORROW + timedelta(days=4))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 1)

    def test_same_day_different_meals_is_allowed(self):
        tomorrow_plus = TOMORROW + timedelta(days=1)
        self.assertEqual(self.book(date=tomorrow_plus).status_code, status.HTTP_201_CREATED)
        response = self.book(date=tomorrow_plus, meal=self.breakfast.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_guest_bookings_do_not_count_as_duplicates(self):
        self.book(date=TOMORROW)
        first = self.book(date=TOMORROW, guest_name="Visitor One")
        second = self.book(date=TOMORROW, guest_name="Visitor Two")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED, first.data)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED, second.data)
        self.assertEqual(Booking.objects.count(), 3)
        self.assertTrue(first.data[0]["is_guest"])

    def test_guest_booking_records_the_guests_dietary_preference(self):
        response = self.book(
            date=TOMORROW, guest_name="Visitor", guest_dietary_preference="gluten_free"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data[0]["dietary_preference"], "gluten_free")

        # An own booking always uses the profile, whatever is sent.
        own = self.book(date=TOMORROW, guest_dietary_preference="vegan")
        self.assertEqual(own.data[0]["dietary_preference"], "none")
        bad = self.book(date=TOMORROW, guest_name="Other", guest_dietary_preference="carnivore")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_past_date_is_rejected(self):
        response = self.book(date=YESTERDAY)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_same_day_before_cutoff_is_allowed(self):
        # 08:00 now, lunch closes 09:30.
        self.assertEqual(self.book(date=TODAY).status_code, status.HTTP_201_CREATED)

    def test_same_day_after_cutoff_is_rejected(self):
        late = NOW.replace(hour=9, minute=30)
        with mock.patch("django.utils.timezone.now", return_value=late):
            response = self.book(date=TODAY)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_previous_day_cutoff(self):
        # Breakfast for tomorrow closes today at 20:00; for today it closed yesterday.
        self.assertEqual(
            self.book(date=TOMORROW, meal=self.breakfast.id).status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            self.book(date=TODAY, meal=self.breakfast.id).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_range_longer_than_31_days_is_rejected(self):
        response = self.book(start_date=TOMORROW, end_date=TOMORROW + timedelta(days=31))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 0)

    def test_end_before_start_is_rejected(self):
        response = self.book(start_date=TOMORROW, end_date=TODAY)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_dates_is_rejected(self):
        self.assertEqual(self.book().status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            self.book(start_date=TOMORROW).status_code, status.HTTP_400_BAD_REQUEST
        )

    def test_book_a_list_of_picked_dates(self):
        monday = TOMORROW + timedelta(days=3)
        wednesday = monday + timedelta(days=2)
        response = self.book(
            dates=[wednesday.isoformat(), monday.isoformat(), monday.isoformat()]
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        booked = list(Booking.objects.order_by("date").values_list("date", flat=True))
        self.assertEqual(booked, [monday, wednesday])

    def test_picked_dates_follow_the_same_rules(self):
        closed = self.book(dates=[YESTERDAY.isoformat(), TOMORROW.isoformat()])
        self.assertEqual(closed.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 0)

        too_many = [(TOMORROW + timedelta(days=n)).isoformat() for n in range(32)]
        self.assertEqual(self.book(dates=too_many).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.book(dates=[]).status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_one_way_of_giving_dates_is_allowed(self):
        response = self.book(date=TOMORROW, dates=[TOMORROW.isoformat()])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_meal_cannot_be_booked(self):
        self.lunch.is_active = False
        self.lunch.save()
        self.assertEqual(self.book(date=TOMORROW).status_code, status.HTTP_400_BAD_REQUEST)


class ServingDayTests(FrozenTimeAPITestCase):
    """NOW is Thursday 10 January 2030, so the 12th and 13th are a weekend."""

    SATURDAY = TODAY + timedelta(days=2)
    SUNDAY = TODAY + timedelta(days=3)
    MONDAY = TODAY + timedelta(days=4)

    def setUp(self):
        super().setUp()
        self.dinner = Meal.objects.create(
            name="Dinner", serve_time=time(19, 30), cutoff_time=time(15, 0)
        )
        self.login(self.employee)

    def test_meals_are_served_on_weekdays_by_default(self):
        self.assertEqual(self.dinner.serving_days, "01234")
        response = self.client.get(f"/api/meals/{self.dinner.id}/")
        self.assertEqual(response.data["serving_days"], [0, 1, 2, 3, 4])

    def test_a_day_the_meal_is_not_served_cannot_be_booked(self):
        single = self.book(meal=self.dinner.id, date=self.SATURDAY)
        picked = self.book(
            meal=self.dinner.id, dates=[TOMORROW.isoformat(), self.SUNDAY.isoformat()]
        )
        self.assertEqual(single.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(picked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 0)

    def test_a_range_skips_days_the_meal_is_not_served(self):
        response = self.book(meal=self.dinner.id, start_date=TOMORROW, end_date=self.MONDAY)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        booked = list(Booking.objects.order_by("date").values_list("date", flat=True))
        self.assertEqual(booked, [TOMORROW, self.MONDAY])

    def test_a_range_with_no_serving_days_is_rejected(self):
        response = self.book(
            meal=self.dinner.id, start_date=self.SATURDAY, end_date=self.SUNDAY
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_availability_marks_days_not_served(self):
        url = (
            f"/api/bookings/availability/?meal={self.dinner.id}"
            f"&date_from={TOMORROW.isoformat()}&date_to={self.SATURDAY.isoformat()}"
        )
        friday, saturday = self.client.get(url).data["days"]
        self.assertTrue(friday["is_served"])
        self.assertTrue(friday["is_open"])
        self.assertFalse(saturday["is_served"])
        self.assertFalse(saturday["is_open"])

    def test_admin_can_open_the_canteen_at_weekends(self):
        self.login(self.admin)
        response = self.client.patch(
            f"/api/meals/{self.dinner.id}/", {"serving_days": [5, 0, 1, 5]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.dinner.refresh_from_db()
        self.assertEqual(self.dinner.serving_days, "015")
        bad = self.client.patch(
            f"/api/meals/{self.dinner.id}/", {"serving_days": [7]}, format="json"
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_on_a_day_later_closed_can_still_be_cancelled(self):
        booking = Booking.objects.create(user=self.employee, meal=self.dinner, date=self.MONDAY)
        self.dinner.serving_days = "1234"  # the admin stops serving on Mondays
        self.dinner.save()
        response = self.client.delete(f"/api/bookings/{booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_forecast_leaves_out_days_not_served(self):
        self.login(self.staff)
        response = self.client.get("/api/kitchen/forecast/?days=7")
        dinner_days = [row["date"] for row in response.data["days"] if row["meal_name"] == "Dinner"]
        self.assertNotIn(self.SATURDAY, dinner_days)
        self.assertNotIn(self.SUNDAY, dinner_days)
        self.assertIn(self.MONDAY, dinner_days)

    def test_booking_shows_whether_it_can_be_cancelled(self):
        Booking.objects.create(user=self.employee, meal=self.lunch, date=TODAY)
        early = self.client.get("/api/bookings/").data[0]
        self.assertTrue(early["can_cancel"])
        with mock.patch("django.utils.timezone.now", return_value=NOW.replace(hour=11)):
            late = self.client.get("/api/bookings/").data[0]
        self.assertFalse(late["can_cancel"])


class ViewBookingTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        self.mine = Booking.objects.create(user=self.employee, meal=self.lunch, date=TOMORROW)
        self.theirs = Booking.objects.create(user=self.other, meal=self.lunch, date=TOMORROW)

    def ids(self, response):
        return {b["id"] for b in response.data}

    def test_employee_sees_only_own_bookings(self):
        self.login(self.employee)
        response = self.client.get("/api/bookings/")
        self.assertEqual(self.ids(response), {self.mine.id})

    def test_employee_cannot_open_someone_elses_booking(self):
        self.login(self.employee)
        response = self.client.get(f"/api/bookings/{self.theirs.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_and_admin_see_all_bookings(self):
        for user in (self.staff, self.admin):
            self.login(user)
            response = self.client.get("/api/bookings/")
            self.assertEqual(self.ids(response), {self.mine.id, self.theirs.id})

    def test_filter_by_date_and_meal(self):
        later = Booking.objects.create(
            user=self.employee, meal=self.breakfast, date=TOMORROW + timedelta(days=3)
        )
        self.login(self.admin)
        by_date = self.client.get(f"/api/bookings/?date={later.date.isoformat()}")
        self.assertEqual(self.ids(by_date), {later.id})
        by_meal = self.client.get(f"/api/bookings/?meal={self.lunch.id}")
        self.assertEqual(self.ids(by_meal), {self.mine.id, self.theirs.id})

    def test_staff_can_ask_for_only_their_own(self):
        own = Booking.objects.create(user=self.staff, meal=self.lunch, date=TOMORROW)
        self.login(self.staff)
        response = self.client.get("/api/bookings/?mine=1")
        self.assertEqual(self.ids(response), {own.id})

    def test_availability_shows_open_days_and_own_bookings(self):
        self.login(self.employee)
        url = (
            f"/api/bookings/availability/?meal={self.lunch.id}"
            f"&date_from={YESTERDAY.isoformat()}&date_to={TOMORROW.isoformat()}"
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        yesterday, today, tomorrow = response.data["days"]
        self.assertFalse(yesterday["is_open"])
        self.assertTrue(today["is_open"])  # 08:00, lunch closes 09:30
        self.assertIsNone(today["booking"])
        # Only the caller's own booking is reported, never someone else's.
        self.assertEqual(tomorrow["booking"], self.mine.id)
        self.assertFalse(tomorrow["is_redeemed"])

    def test_availability_needs_a_meal_and_a_sensible_range(self):
        self.login(self.employee)
        base = "/api/bookings/availability/"
        day = TOMORROW.isoformat()
        far = (TOMORROW + timedelta(days=90)).isoformat()
        for query in [
            f"?date_from={day}&date_to={day}",
            f"?meal=999&date_from={day}&date_to={day}",
            f"?meal={self.lunch.id}&date_from={day}",
            f"?meal={self.lunch.id}&date_from={day}&date_to={YESTERDAY.isoformat()}",
            f"?meal={self.lunch.id}&date_from={day}&date_to={far}",
        ]:
            response = self.client.get(base + query)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, query)

    def test_bad_date_filter_is_400(self):
        self.login(self.admin)
        response = self.client.get("/api/bookings/?date=tomorrow")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CancelBookingTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        self.mine = Booking.objects.create(user=self.employee, meal=self.lunch, date=TODAY)
        self.theirs = Booking.objects.create(user=self.other, meal=self.lunch, date=TODAY)

    def cancel(self, booking):
        return self.client.delete(f"/api/bookings/{booking.id}/")

    def test_employee_cancels_own_booking_before_cutoff(self):
        self.login(self.employee)
        self.assertEqual(self.cancel(self.mine).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Booking.objects.filter(id=self.mine.id).exists())

    def test_employee_cannot_cancel_after_cutoff(self):
        self.login(self.employee)
        late = NOW.replace(hour=11)
        with mock.patch("django.utils.timezone.now", return_value=late):
            response = self.cancel(self.mine)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Booking.objects.filter(id=self.mine.id).exists())

    def test_employee_cannot_cancel_someone_elses_booking(self):
        self.login(self.employee)
        self.assertEqual(self.cancel(self.theirs).status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Booking.objects.filter(id=self.theirs.id).exists())

    def test_staff_cannot_cancel_someone_elses_booking(self):
        self.login(self.staff)
        self.assertEqual(self.cancel(self.mine).status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Booking.objects.filter(id=self.mine.id).exists())

    def test_admin_can_cancel_any_booking_even_after_cutoff(self):
        self.login(self.admin)
        late = NOW.replace(hour=11)
        with mock.patch("django.utils.timezone.now", return_value=late):
            response = self.cancel(self.mine)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_redeemed_booking_cannot_be_cancelled(self):
        self.mine.redeemed_at = timezone.now()
        self.mine.redeemed_by = self.staff
        self.mine.save()
        self.login(self.admin)
        self.assertEqual(self.cancel(self.mine).status_code, status.HTTP_400_BAD_REQUEST)


class MealAndMenuTests(FrozenTimeAPITestCase):
    def test_employee_can_list_active_meals_only(self):
        Meal.objects.create(
            name="Retired", serve_time=time(15, 0), cutoff_time=time(10, 0), is_active=False
        )
        self.login(self.employee)
        response = self.client.get("/api/meals/")
        self.assertEqual({m["name"] for m in response.data}, {"Lunch", "Breakfast"})

    def test_employee_cannot_change_meals_or_menus(self):
        self.login(self.employee)
        meal = self.client.post(
            "/api/meals/",
            {"name": "Dinner", "serve_time": "19:00", "cutoff_time": "15:00"},
            format="json",
        )
        menu = self.client.post(
            "/api/menus/",
            {"date": TOMORROW.isoformat(), "meal": self.lunch.id, "description": "Dal"},
            format="json",
        )
        self.assertEqual(meal.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(menu.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_manages_meals_and_menus(self):
        self.login(self.admin)
        meal = self.client.post(
            "/api/meals/",
            {"name": "Dinner", "serve_time": "19:00", "cutoff_time": "15:00"},
            format="json",
        )
        self.assertEqual(meal.status_code, status.HTTP_201_CREATED, meal.data)
        body = {"date": TOMORROW.isoformat(), "meal": self.lunch.id, "description": "Dal and rice"}
        menu = self.client.post("/api/menus/", body, format="json")
        self.assertEqual(menu.status_code, status.HTTP_201_CREATED, menu.data)
        self.assertEqual(menu.data["meal_name"], "Lunch")
        # Only one menu per date and meal.
        again = self.client.post("/api/menus/", body, format="json")
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)

    def test_menus_filter_by_date_range(self):
        Menu.objects.create(date=TODAY, meal=self.lunch, description="Today")
        Menu.objects.create(date=TOMORROW, meal=self.lunch, description="Tomorrow")
        self.login(self.employee)
        response = self.client.get(f"/api/menus/?date_from={TOMORROW.isoformat()}")
        self.assertEqual([m["description"] for m in response.data], ["Tomorrow"])


class RedeemTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        self.today = Booking.objects.create(user=self.employee, meal=self.lunch, date=TODAY)
        self.tomorrow = Booking.objects.create(user=self.employee, meal=self.lunch, date=TOMORROW)

    def redeem(self, code):
        return self.client.post("/api/bookings/redeem/", {"coupon_code": str(code)}, format="json")

    def test_only_staff_and_admins_can_redeem(self):
        self.assertEqual(
            self.redeem(self.today.coupon_code).status_code, status.HTTP_401_UNAUTHORIZED
        )
        self.login(self.employee)
        self.assertEqual(
            self.redeem(self.today.coupon_code).status_code, status.HTTP_403_FORBIDDEN
        )
        self.today.refresh_from_db()
        self.assertFalse(self.today.is_redeemed)

    def test_staff_redeems_todays_coupon(self):
        self.login(self.staff)
        response = self.redeem(self.today.coupon_code)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["result"], "redeemed")
        self.assertEqual(response.data["booking"]["user_email"], "employee@example.com")
        self.today.refresh_from_db()
        self.assertEqual(self.today.redeemed_at, NOW)
        self.assertEqual(self.today.redeemed_by, self.staff)

    def test_coupon_cannot_be_redeemed_twice(self):
        self.login(self.staff)
        self.redeem(self.today.coupon_code)
        later = NOW + timedelta(minutes=5)
        with mock.patch("django.utils.timezone.now", return_value=later):
            self.login(self.admin)
            response = self.redeem(self.today.coupon_code)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["result"], "already_redeemed")
        # The first redemption is untouched.
        self.today.refresh_from_db()
        self.assertEqual(self.today.redeemed_at, NOW)
        self.assertEqual(self.today.redeemed_by, self.staff)

    def test_simultaneous_scans_only_one_wins(self):
        # Two scanners both load the booking while it is still unredeemed...
        first_scanner = Booking.objects.get(pk=self.today.pk)
        second_scanner = Booking.objects.get(pk=self.today.pk)
        # ...then both try to claim it. Only one conditional UPDATE can match.
        self.assertTrue(kitchen.claim_booking(first_scanner, self.staff))
        self.assertFalse(kitchen.claim_booking(second_scanner, self.admin))
        self.today.refresh_from_db()
        self.assertEqual(self.today.redeemed_by, self.staff)

    def test_coupon_for_another_day_is_refused(self):
        self.login(self.staff)
        response = self.redeem(self.tomorrow.coupon_code)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["result"], "wrong_day")
        self.tomorrow.refresh_from_db()
        self.assertFalse(self.tomorrow.is_redeemed)

    def test_unknown_or_malformed_coupon_is_not_found(self):
        self.login(self.staff)
        for code in ["3f2b8c1e-0000-4000-8000-000000000000", "not-a-coupon", "12345"]:
            response = self.redeem(code)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, code)
            self.assertEqual(response.data["result"], "not_found")


class KitchenTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        self.vegan = make_user("vegan@example.com", dietary_preference=DietaryPreference.VEGAN)

    def book(self, user, day, meal=None, redeemed=False, guest_name="", guest_diet="none"):
        booking = Booking.objects.create(
            user=user,
            meal=meal or self.lunch,
            date=day,
            guest_name=guest_name,
            guest_dietary_preference=guest_diet,
        )
        if redeemed:
            booking.redeemed_at = NOW
            booking.redeemed_by = self.staff
            booking.save()
        return booking

    def test_kitchen_endpoints_are_staff_only(self):
        urls = ["/api/kitchen/prep-sheet/", "/api/kitchen/attendance/", "/api/kitchen/forecast/"]
        for url in urls:
            self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.login(self.employee)
        for url in urls:
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        self.login(self.staff)
        for url in urls:
            self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

    def test_prep_sheet_counts_by_meal_and_diet(self):
        Menu.objects.create(date=TODAY, meal=self.lunch, description="Dal and rice")
        self.book(self.employee, TODAY, redeemed=True)
        self.book(self.other, TODAY)
        self.book(self.vegan, TODAY)
        self.book(self.employee, TODAY, guest_name="Visitor", guest_diet="vegan")
        self.book(self.employee, TOMORROW)  # another day, not counted
        self.login(self.staff)

        response = self.client.get("/api/kitchen/prep-sheet/")
        self.assertEqual(response.data["date"], TODAY)
        lunch = next(m for m in response.data["meals"] if m["meal_name"] == "Lunch")
        self.assertEqual(lunch["total"], 4)
        self.assertEqual(lunch["guests"], 1)
        self.assertEqual(lunch["redeemed"], 1)
        self.assertEqual(lunch["menu"], "Dal and rice")
        # One vegan employee plus the vegan guest; the split adds up to the total.
        self.assertEqual(lunch["by_dietary_preference"]["vegan"], 2)
        self.assertEqual(lunch["by_dietary_preference"]["none"], 2)
        self.assertEqual(sum(lunch["by_dietary_preference"].values()), lunch["total"])
        self.assertFalse(lunch["is_final"])  # 08:00, lunch closes 09:30

        breakfast = next(m for m in response.data["meals"] if m["meal_name"] == "Breakfast")
        self.assertEqual(breakfast["total"], 0)
        self.assertTrue(breakfast["is_final"])  # closed yesterday evening

        other_day = self.client.get(f"/api/kitchen/prep-sheet/?date={TOMORROW.isoformat()}")
        lunch = next(m for m in other_day.data["meals"] if m["meal_name"] == "Lunch")
        self.assertEqual(lunch["total"], 1)

    def test_attendance_counts_no_shows_for_past_days_only(self):
        self.book(self.employee, YESTERDAY, redeemed=True)
        self.book(self.other, YESTERDAY, redeemed=True)
        self.book(self.vegan, YESTERDAY, redeemed=True)
        self.book(self.staff, YESTERDAY)  # no-show
        self.book(self.employee, TODAY)  # not over yet, must be ignored
        self.login(self.admin)

        response = self.client.get("/api/kitchen/attendance/")
        self.assertEqual(response.data["date_to"], YESTERDAY)
        self.assertEqual(
            response.data["overall"],
            {"booked": 4, "redeemed": 3, "no_shows": 1, "no_show_rate": 0.25},
        )
        self.assertEqual(len(response.data["daily"]), 1)
        self.assertEqual(response.data["daily"][0]["no_shows"], 1)
        self.assertEqual(response.data["by_meal"][0]["meal_name"], "Lunch")

    def test_attendance_rejects_a_range_in_the_future(self):
        self.login(self.admin)
        response = self.client.get(f"/api/kitchen/attendance/?date_from={TOMORROW.isoformat()}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def forecast_for(self, day, meal_name="Lunch", days=7):
        response = self.client.get(f"/api/kitchen/forecast/?days={days}")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return next(
            row
            for row in response.data["days"]
            if row["date"] == day and row["meal_name"] == meal_name
        )

    def test_forecast_averages_the_same_weekday(self):
        people = [self.employee, self.other, self.vegan, self.staff]
        # Lunch on the four previous Fridays: 2, 4, 2, 4 bookings -> average 3.
        for weeks_ago, count in enumerate([2, 4, 2, 4], start=1):
            for person in people[:count]:
                self.book(person, TOMORROW - timedelta(weeks=weeks_ago))
        self.book(self.employee, TOMORROW)
        self.login(self.staff)

        row = self.forecast_for(TOMORROW)
        self.assertEqual(row["booked"], 1)
        self.assertEqual(row["forecast"], 3)
        self.assertEqual(row["based_on_days"], 4)
        self.assertFalse(row["is_final"])

    def test_forecast_is_never_below_current_bookings(self):
        self.book(self.employee, TOMORROW - timedelta(weeks=1))
        for person in [self.employee, self.other, self.vegan]:
            self.book(person, TOMORROW)
        self.login(self.staff)
        self.assertEqual(self.forecast_for(TOMORROW)["forecast"], 3)

    def test_forecast_is_the_final_count_once_booking_has_closed(self):
        for weeks_ago in (1, 2):
            for person in [self.employee, self.other, self.vegan]:
                self.book(person, TODAY - timedelta(weeks=weeks_ago), meal=self.breakfast)
        self.book(self.employee, TODAY, meal=self.breakfast)
        self.login(self.staff)

        row = self.forecast_for(TODAY, meal_name="Breakfast")
        self.assertTrue(row["is_final"])
        self.assertEqual(row["forecast"], 1)

    def test_forecast_without_history_is_empty(self):
        self.login(self.staff)
        row = self.forecast_for(TOMORROW)
        self.assertIsNone(row["forecast"])
        self.assertEqual(row["based_on_days"], 0)

    def test_forecast_days_must_be_sensible(self):
        self.login(self.staff)
        for value in ["0", "15", "abc"]:
            response = self.client.get(f"/api/kitchen/forecast/?days={value}")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, value)


def png_upload(name="dish.png"):
    buffer = io.BytesIO()
    Image.new("RGB", (24, 24), "purple").save(buffer, "PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


class MenuPhotoTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        # Uploads go to a throwaway folder, never the real media directory.
        media = tempfile.TemporaryDirectory()
        self.addCleanup(media.cleanup)
        settings_override = override_settings(MEDIA_ROOT=media.name)
        settings_override.enable()
        self.addCleanup(settings_override.disable)
        self.login(self.admin)

    def create(self, **extra):
        body = {"date": TOMORROW.isoformat(), "meal": self.lunch.id, "description": "Dal"}
        body.update(extra)
        return self.client.post("/api/menus/", body, format="multipart")

    def test_admin_uploads_a_photo_and_everyone_sees_it(self):
        response = self.create(photo=png_upload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn("/media/menus/", response.data["photo"])

        self.login(self.employee)
        listed = self.client.get("/api/menus/").data[0]
        self.assertIn("/media/menus/", listed["photo"])

    def test_menu_without_a_photo_is_fine(self):
        response = self.create()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(response.data["photo"])

    def test_a_file_that_is_not_an_image_is_rejected(self):
        fake = SimpleUploadedFile("dish.png", b"not really an image", content_type="image/png")
        response = self.create(photo=fake)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Menu.objects.count(), 0)

    def test_photo_can_be_replaced_and_removed(self):
        menu_id = self.create(photo=png_upload("first.png")).data["id"]
        menu = Menu.objects.get(pk=menu_id)
        first_path = menu.photo.path

        replaced = self.client.patch(
            f"/api/menus/{menu_id}/", {"photo": png_upload("second.png")}, format="multipart"
        )
        self.assertEqual(replaced.status_code, status.HTTP_200_OK, replaced.data)
        menu.refresh_from_db()
        self.assertNotEqual(menu.photo.path, first_path)
        self.assertFalse(Path(first_path).exists())  # the old file is cleaned up

        removed = self.client.patch(
            f"/api/menus/{menu_id}/", {"remove_photo": "true"}, format="multipart"
        )
        self.assertEqual(removed.status_code, status.HTTP_200_OK, removed.data)
        self.assertIsNone(removed.data["photo"])
        menu.refresh_from_db()
        self.assertFalse(menu.photo)


class RegistrationAndLoginTests(APITestCase):
    def register(self, **overrides):
        body = {
            "email": "new@example.com",
            "fullname": "New Person",
            "password": PASSWORD,
            "password2": PASSWORD,
        }
        body.update(overrides)
        return self.client.post("/api/register/", body, format="json")

    def test_register_needs_only_name_email_and_password(self):
        response = self.register()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        user = MealUser.objects.get(email="new@example.com")
        self.assertEqual(user.role, Role.EMPLOYEE)
        self.assertTrue(user.check_password(PASSWORD))

    def test_register_cannot_choose_a_role(self):
        self.register(role="admin", is_admin=True)
        user = MealUser.objects.get(email="new@example.com")
        self.assertEqual(user.role, Role.EMPLOYEE)
        self.assertFalse(user.is_admin)

    def test_duplicate_email_is_rejected_ignoring_case(self):
        make_user("new@example.com")
        response = self.register(email="New@Example.com")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MealUser.objects.count(), 1)

    def test_weak_or_mismatched_password_is_rejected(self):
        weak = self.register(password="12345678", password2="12345678")
        mismatch = self.register(password2="Something-Else-42")
        self.assertEqual(weak.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MealUser.objects.count(), 0)

    def test_login_ignores_email_case(self):
        make_user("new@example.com")
        response = self.client.post(
            "/api/login/", {"email": "NEW@example.com", "password": PASSWORD}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = make_user("me@example.com")
        self.client.force_authenticate(user=self.user)

    def test_profile_shows_role_and_preference(self):
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(b'"role"', response.content)
        self.assertIn(b'"dietary_preference"', response.content)

    def test_user_can_update_dietary_preference(self):
        response = self.client.patch(
            "/api/profile/", {"dietary_preference": "vegan"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.user.refresh_from_db()
        self.assertEqual(self.user.dietary_preference, DietaryPreference.VEGAN)

    def test_user_cannot_change_own_role_or_email(self):
        self.client.patch(
            "/api/profile/", {"role": "admin", "email": "x@example.com"}, format="json"
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, Role.EMPLOYEE)
        self.assertEqual(self.user.email, "me@example.com")


class PasswordTests(APITestCase):
    NEW = "Battery-Staple-77"

    def setUp(self):
        self.user = make_user("me@example.com")

    def change(self, **body):
        self.client.force_authenticate(user=self.user)
        return self.client.post("/api/changepassword/", body, format="json")

    def test_change_password_requires_the_current_one(self):
        missing = self.change(password=self.NEW, password2=self.NEW)
        wrong = self.change(current_password="nope", password=self.NEW, password2=self.NEW)
        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(wrong.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_change_password(self):
        response = self.change(current_password=PASSWORD, password=self.NEW, password2=self.NEW)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.NEW))

    def test_reset_request_for_unknown_email_looks_the_same_and_sends_nothing(self):
        known = self.client.post(
            "/api/resetpasswordemail/", {"email": "me@example.com"}, format="json"
        )
        unknown = self.client.post(
            "/api/resetpasswordemail/", {"email": "nobody@example.com"}, format="json"
        )
        self.assertEqual(known.status_code, status.HTTP_200_OK)
        self.assertEqual(unknown.status_code, status.HTTP_200_OK)
        self.assertEqual(known.content, unknown.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["me@example.com"])

    def test_reset_link_sets_a_new_password_once(self):
        self.client.post("/api/resetpasswordemail/", {"email": "me@example.com"}, format="json")
        uid, token = re.search(r"/reset-password/([^/]+)/(\S+)", mail.outbox[0].body).groups()
        url = f"/api/resetpassword/{uid}/{token}/"
        body = {"password": self.NEW, "password2": self.NEW}

        response = self.client.post(url, body, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.NEW))

        # The link stops working once the password has changed.
        again = self.client.post(url, body, format="json")
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bad_reset_link_is_400(self):
        body = {"password": self.NEW, "password2": self.NEW}
        for url in ["/api/resetpassword/not-a-uid/not-a-token/", "/api/resetpassword/OTk5/x-y/"]:
            response = self.client.post(url, body, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, url)


class SessionTests(APITestCase):
    def setUp(self):
        self.user = make_user("me@example.com")

    def tokens(self):
        response = self.client.post(
            "/api/login/", {"email": "me@example.com", "password": PASSWORD}, format="json"
        )
        return response.json()["token"]

    def refresh(self, refresh_token):
        return self.client.post("/api/token/refresh/", {"refresh": refresh_token}, format="json")

    def test_logout_ends_only_that_session(self):
        phone, laptop = self.tokens(), self.tokens()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {phone['access']}")
        response = self.client.post("/api/logout/", {"refresh": phone["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.client.credentials()
        self.assertEqual(self.refresh(phone["refresh"]).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.refresh(laptop["refresh"]).status_code, status.HTTP_200_OK)

    def test_logout_everywhere_ends_every_session(self):
        phone, laptop = self.tokens(), self.tokens()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {phone['access']}")
        response = self.client.post("/api/logout-all/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.client.credentials()
        self.assertEqual(self.refresh(phone["refresh"]).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.refresh(laptop["refresh"]).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_cannot_end_someone_elses_session(self):
        other = make_user("other@example.com")
        mine = self.tokens()
        self.client.force_authenticate(user=other)
        self.client.post("/api/logout/", {"refresh": mine["refresh"]}, format="json")
        self.client.force_authenticate(user=None)
        self.assertEqual(self.refresh(mine["refresh"]).status_code, status.HTTP_200_OK)


class ReminderTests(FrozenTimeAPITestCase):
    def setUp(self):
        super().setUp()
        self.real = make_user("real.person@bookmymeal.test")
        self.quiet = make_user("quiet.person@bookmymeal.test", email_reminders=False)

    def test_reminders_go_to_people_with_bookings_tomorrow(self):
        Booking.objects.create(user=self.real, meal=self.lunch, date=TOMORROW)
        Booking.objects.create(user=self.real, meal=self.breakfast, date=TOMORROW)
        Booking.objects.create(user=self.real, meal=self.lunch, date=TODAY)  # not tomorrow
        Booking.objects.create(user=self.quiet, meal=self.lunch, date=TOMORROW)  # opted out
        Booking.objects.create(user=self.employee, meal=self.lunch, date=TOMORROW)  # example.com

        call_command("send_reminders", verbosity=0)

        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["real.person@bookmymeal.test"])
        self.assertIn("Breakfast", message.body)
        self.assertIn("Lunch", message.body)
        self.assertIn("Friday 11 January", message.subject)

    def test_user_can_switch_reminders_off(self):
        self.login(self.real)
        response = self.client.patch("/api/profile/", {"email_reminders": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.real.refresh_from_db()
        self.assertFalse(self.real.email_reminders)


class SeedPhotoTests(APITestCase):
    def test_seed_attaches_photos_found_in_the_seed_folder(self):
        from base.management.commands import seed_demo

        photos = tempfile.TemporaryDirectory()
        media = tempfile.TemporaryDirectory()
        self.addCleanup(photos.cleanup)
        self.addCleanup(media.cleanup)
        Path(photos.name, "upma.png").write_bytes(png_upload().read())

        with override_settings(MEDIA_ROOT=media.name), mock.patch.object(
            seed_demo, "SEED_PHOTO_DIR", Path(photos.name)
        ):
            call_command("seed_demo", verbosity=0)
            upma = Menu.objects.filter(description__startswith="Upma")
            dosa = Menu.objects.filter(description__startswith="Masala dosa")
            self.assertTrue(upma.exists())
            self.assertTrue(all(menu.photo for menu in upma))
            self.assertFalse(any(menu.photo for menu in dosa))  # no file for it

            # Adding a photo later and re-running fills in the existing menus.
            Path(photos.name, "masala-dosa.png").write_bytes(png_upload().read())
            call_command("seed_demo", verbosity=0)
            self.assertTrue(all(menu.photo for menu in dosa.all()))


class SeedDemoTests(APITestCase):
    def test_seed_creates_demo_data_and_is_safe_to_rerun(self):
        call_command("seed_demo", verbosity=0)
        counts = (MealUser.objects.count(), Meal.objects.count(), Menu.objects.count())
        bookings = Booking.objects.count()
        self.assertEqual(Meal.objects.count(), 3)
        # Meals are served on weekdays, so nothing is seeded for a weekend.
        self.assertFalse(Booking.objects.filter(date__week_day__in=[1, 7]).exists())
        self.assertFalse(Menu.objects.filter(date__week_day__in=[1, 7]).exists())
        self.assertTrue(MealUser.objects.filter(role=Role.ADMIN).exists())
        self.assertTrue(MealUser.objects.filter(role=Role.STAFF).exists())
        self.assertGreater(bookings, 0)
        self.assertTrue(Booking.objects.filter(redeemed_at__isnull=False).exists())

        call_command("seed_demo", verbosity=0)
        self.assertEqual(
            counts, (MealUser.objects.count(), Meal.objects.count(), Menu.objects.count())
        )
        self.assertEqual(Booking.objects.count(), bookings)
