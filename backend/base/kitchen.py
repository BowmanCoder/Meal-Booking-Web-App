"""Coupon redemption and the numbers the kitchen plans with."""

from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db.models import Count, Min, Q
from django.utils import timezone

from base.models import Booking, DietaryPreference, Meal, Menu

REDEEMED = "redeemed"
ALREADY_REDEEMED = "already_redeemed"
WRONG_DAY = "wrong_day"
NOT_FOUND = "not_found"

FORECAST_WEEKS = 4
REDEEMED_FILTER = Q(redeemed_at__isnull=False)


# --- Redemption -------------------------------------------------------------


def claim_booking(booking, staff_user):
    """Mark a booking redeemed, returning True only for the caller that wins.

    This is a single conditional UPDATE: the database changes the row only if
    it is still unredeemed. If two scans of the same coupon arrive together,
    exactly one of them updates a row and the other updates none, so a coupon
    can never be served twice. No lock or read-then-write is involved.
    """
    updated = Booking.objects.filter(pk=booking.pk, redeemed_at__isnull=True).update(
        redeemed_at=timezone.now(), redeemed_by=staff_user
    )
    return updated == 1


def redeem_coupon(coupon_code, staff_user):
    """Try to redeem a coupon. Returns (result, booking or None)."""
    try:
        booking = Booking.objects.select_related("meal", "user").get(coupon_code=coupon_code)
    except (Booking.DoesNotExist, ValidationError, ValueError):
        # Unknown code, or text that is not a coupon code at all.
        return NOT_FOUND, None

    if booking.is_redeemed:
        return ALREADY_REDEEMED, booking
    if booking.date != timezone.localdate():
        return WRONG_DAY, booking
    if not claim_booking(booking, staff_user):
        booking.refresh_from_db()
        return ALREADY_REDEEMED, booking
    booking.refresh_from_db()
    return REDEEMED, booking


# --- Prep sheet -------------------------------------------------------------


def prep_sheet(day):
    """How many of each meal to prepare on `day`, split by dietary preference."""
    bookings = Booking.objects.filter(date=day)
    totals = {
        row["meal_id"]: row
        for row in bookings.values("meal_id").annotate(
            total=Count("id"),
            guests=Count("id", filter=~Q(guest_name="")),
            redeemed=Count("id", filter=REDEEMED_FILTER),
        )
    }
    by_diet = {}
    own_meals = bookings.filter(guest_name="")
    for row in own_meals.values("meal_id", "user__dietary_preference").annotate(n=Count("id")):
        by_diet.setdefault(row["meal_id"], {})[row["user__dietary_preference"]] = row["n"]
    menus = {menu.meal_id: menu.description for menu in Menu.objects.filter(date=day)}

    sheet = []
    for meal in Meal.objects.filter(Q(is_active=True) | Q(id__in=list(totals))):
        counts = totals.get(meal.id, {})
        diets = by_diet.get(meal.id, {})
        sheet.append(
            {
                "meal": meal.id,
                "meal_name": meal.name,
                "serve_time": meal.serve_time,
                "menu": menus.get(meal.id, ""),
                # Once booking has closed the count can no longer change.
                "is_final": not meal.is_open_for(day),
                "total": counts.get("total", 0),
                "guests": counts.get("guests", 0),
                "redeemed": counts.get("redeemed", 0),
                # Guests have no profile, so they are not in this split.
                "by_dietary_preference": {
                    value: diets.get(value, 0) for value in DietaryPreference.values
                },
            }
        )
    return sheet


# --- Booked versus redeemed -------------------------------------------------


def _rate(no_shows, booked):
    return round(no_shows / booked, 3) if booked else None


def attendance(date_from, date_to):
    """Booked, redeemed and no-show counts per day and meal, with totals."""
    rows = (
        Booking.objects.filter(date__gte=date_from, date__lte=date_to)
        .values("date", "meal_id", "meal__name")
        .annotate(booked=Count("id"), redeemed=Count("id", filter=REDEEMED_FILTER))
        .order_by("date", "meal__serve_time")
    )
    daily = []
    by_meal = {}
    for row in rows:
        no_shows = row["booked"] - row["redeemed"]
        daily.append(
            {
                "date": row["date"],
                "meal": row["meal_id"],
                "meal_name": row["meal__name"],
                "booked": row["booked"],
                "redeemed": row["redeemed"],
                "no_shows": no_shows,
                "no_show_rate": _rate(no_shows, row["booked"]),
            }
        )
        summary = by_meal.setdefault(
            row["meal_id"],
            {"meal": row["meal_id"], "meal_name": row["meal__name"], "booked": 0, "redeemed": 0},
        )
        summary["booked"] += row["booked"]
        summary["redeemed"] += row["redeemed"]

    for summary in by_meal.values():
        summary["no_shows"] = summary["booked"] - summary["redeemed"]
        summary["no_show_rate"] = _rate(summary["no_shows"], summary["booked"])

    booked = sum(s["booked"] for s in by_meal.values())
    redeemed = sum(s["redeemed"] for s in by_meal.values())
    return {
        "date_from": date_from,
        "date_to": date_to,
        "overall": {
            "booked": booked,
            "redeemed": redeemed,
            "no_shows": booked - redeemed,
            "no_show_rate": _rate(booked - redeemed, booked),
        },
        "by_meal": list(by_meal.values()),
        "daily": daily,
    }


# --- Forecast ---------------------------------------------------------------


def forecast(days):
    """Expected bookings per meal for today and the following days.

    A deliberately simple baseline: the average number of bookings for the
    same meal on the same weekday over up to the last four weeks. Canteen
    demand is strongly weekly, so this captures most of the pattern while
    staying easy to explain. The forecast is never below what is already
    booked, and once booking has closed it is simply the final count.
    """
    today = timezone.localdate()
    last_day = today + timedelta(days=days - 1)
    history_start = today - timedelta(weeks=FORECAST_WEEKS)
    first_booking = Booking.objects.aggregate(first=Min("date"))["first"]

    def counts(queryset):
        return {
            (row["date"], row["meal_id"]): row["n"]
            for row in queryset.values("date", "meal_id").annotate(n=Count("id"))
        }

    history = counts(Booking.objects.filter(date__gte=history_start, date__lt=today))
    upcoming = counts(Booking.objects.filter(date__gte=today, date__lte=last_day))
    meals = list(Meal.objects.filter(is_active=True))

    result = []
    for offset in range(days):
        day = today + timedelta(days=offset)
        # The same weekday in earlier weeks, limited to days we have data for.
        past_days = [
            past
            for past in (day - timedelta(weeks=week) for week in range(1, FORECAST_WEEKS + 2))
            if first_booking and max(history_start, first_booking) <= past < today
        ][:FORECAST_WEEKS]
        for meal in meals:
            samples = [history.get((past, meal.id), 0) for past in past_days]
            expected = int(sum(samples) / len(samples) + 0.5) if samples else None
            booked = upcoming.get((day, meal.id), 0)
            is_final = not meal.is_open_for(day)
            if is_final:
                predicted = booked
            elif expected is None:
                predicted = None
            else:
                predicted = max(booked, expected)
            result.append(
                {
                    "date": day,
                    "meal": meal.id,
                    "meal_name": meal.name,
                    "booked": booked,
                    "forecast": predicted,
                    "is_final": is_final,
                    "based_on_days": len(samples),
                }
            )
    return result
