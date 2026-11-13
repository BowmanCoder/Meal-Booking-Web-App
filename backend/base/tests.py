import re
from datetime import datetime, time, timedelta
from datetime import timezone as dt_timezone
from unittest import mock

from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from base.models import Booking, DietaryPreference, Meal, MealUser, Menu, Role

# The tests freeze "now" so cut-off rules do not depend on when they run.
NOW = datetime(2030, 1, 10, 8, 0, tzinfo=dt_timezone.utc)  # a Thursday, 08:00
TODAY = NOW.date()
TOMORROW = TODAY + timedelta(days=1)
YESTERDAY = TODAY - timedelta(days=1)
PASSWORD = "Correct-Horse-42"


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
        self.lunch = Meal.objects.create(
            name="Lunch", serve_time=time(12, 30), cutoff_time=time(9, 30)
        )
        self.breakfast = Meal.objects.create(
            name="Breakfast",
            serve_time=time(8, 0),
            cutoff_time=time(20, 0),
            cutoff_days_before=1,
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

    def test_inactive_meal_cannot_be_booked(self):
        self.lunch.is_active = False
        self.lunch.save()
        self.assertEqual(self.book(date=TOMORROW).status_code, status.HTTP_400_BAD_REQUEST)


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
        uid, token = re.search(r"/resetpassword/([^/]+)/(\S+)", mail.outbox[0].body).groups()
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


class SeedDemoTests(APITestCase):
    def test_seed_creates_demo_data_and_is_safe_to_rerun(self):
        call_command("seed_demo", verbosity=0)
        counts = (MealUser.objects.count(), Meal.objects.count(), Menu.objects.count())
        bookings = Booking.objects.count()
        self.assertEqual(Meal.objects.count(), 3)
        self.assertTrue(MealUser.objects.filter(role=Role.ADMIN).exists())
        self.assertTrue(MealUser.objects.filter(role=Role.STAFF).exists())
        self.assertGreater(bookings, 0)
        self.assertTrue(Booking.objects.filter(redeemed_at__isnull=False).exists())

        call_command("seed_demo", verbosity=0)
        self.assertEqual(
            counts, (MealUser.objects.count(), Meal.objects.count(), Menu.objects.count())
        )
        self.assertEqual(Booking.objects.count(), bookings)
