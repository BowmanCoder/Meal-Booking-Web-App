from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from base import kitchen

from .booking_views import date_param
from .permissions import IsCanteenStaff

DEFAULT_HISTORY_DAYS = 28
MAX_HISTORY_DAYS = 366
DEFAULT_FORECAST_DAYS = 7
MAX_FORECAST_DAYS = 14


class PrepSheetView(APIView):
    """GET ?date=YYYY-MM-DD (default today): what to prepare, per meal."""

    permission_classes = [IsCanteenStaff]

    def get(self, request):
        day = date_param(request, "date") or timezone.localdate()
        return Response({"date": day, "meals": kitchen.prep_sheet(day)})


class AttendanceView(APIView):
    """GET ?date_from=&date_to=: booked versus redeemed, and no-show rates.

    Defaults to the last 28 days. Only days that are over are counted, because
    a meal that has not been served yet has no no-shows.
    """

    permission_classes = [IsCanteenStaff]

    def get(self, request):
        yesterday = timezone.localdate() - timedelta(days=1)
        date_to = min(date_param(request, "date_to") or yesterday, yesterday)
        date_from = date_param(request, "date_from") or (
            date_to - timedelta(days=DEFAULT_HISTORY_DAYS - 1)
        )
        if date_from > date_to:
            raise ValidationError({"date_from": "Must be a past date, on or before date_to."})
        if (date_to - date_from).days >= MAX_HISTORY_DAYS:
            raise ValidationError(f"The range can cover at most {MAX_HISTORY_DAYS} days.")
        return Response(kitchen.attendance(date_from, date_to))


class ForecastView(APIView):
    """GET ?days=7: expected bookings per meal for today and the days after."""

    permission_classes = [IsCanteenStaff]

    def get(self, request):
        raw = request.query_params.get("days", str(DEFAULT_FORECAST_DAYS))
        if not raw.isdigit() or not 1 <= int(raw) <= MAX_FORECAST_DAYS:
            raise ValidationError({"days": f"Must be a number from 1 to {MAX_FORECAST_DAYS}."})
        return Response({"days": kitchen.forecast(int(raw))})
