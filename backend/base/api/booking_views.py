from django.utils.dateparse import parse_date
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.models import Booking, Meal, Menu

from .booking_serializers import (
    BookingCreateSerializer,
    BookingSerializer,
    MealSerializer,
    MenuSerializer,
)
from .permissions import ReadOnlyOrCanteenAdmin


def _date_param(request, name):
    """Read an optional YYYY-MM-DD query parameter, rejecting bad values."""
    raw = request.query_params.get(name)
    if not raw:
        return None
    try:
        value = parse_date(raw)
    except ValueError:
        value = None
    if value is None:
        raise ValidationError({name: "Use the format YYYY-MM-DD."})
    return value


def _filter_by_dates(queryset, request):
    date = _date_param(request, "date")
    date_from = _date_param(request, "date_from")
    date_to = _date_param(request, "date_to")
    if date:
        queryset = queryset.filter(date=date)
    if date_from:
        queryset = queryset.filter(date__gte=date_from)
    if date_to:
        queryset = queryset.filter(date__lte=date_to)
    return queryset


class MealViewSet(viewsets.ModelViewSet):
    """Meal slots. Everyone signed in can read; canteen admins manage them."""

    serializer_class = MealSerializer
    permission_classes = [ReadOnlyOrCanteenAdmin]

    def get_queryset(self):
        queryset = Meal.objects.all()
        if not self.request.user.is_canteen_admin:
            queryset = queryset.filter(is_active=True)
        return queryset


class MenuViewSet(viewsets.ModelViewSet):
    """Daily menus. Filter with ?date=, ?date_from=, ?date_to= and ?meal=."""

    serializer_class = MenuSerializer
    permission_classes = [ReadOnlyOrCanteenAdmin]

    def get_queryset(self):
        queryset = _filter_by_dates(Menu.objects.select_related("meal"), self.request)
        meal = self.request.query_params.get("meal")
        if meal:
            if not meal.isdigit():
                raise ValidationError({"meal": "Must be a meal id."})
            queryset = queryset.filter(meal_id=meal)
        return queryset


class BookingViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Bookings.

    Employees see and cancel only their own. Canteen staff and admins see all.
    Filter with ?date=, ?date_from=, ?date_to= and ?meal=.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.select_related("meal", "user")
        if not user.is_canteen_staff:
            queryset = queryset.filter(user=user)
        queryset = _filter_by_dates(queryset, self.request)
        meal = self.request.query_params.get("meal")
        if meal:
            if not meal.isdigit():
                raise ValidationError({"meal": "Must be a meal id."})
            queryset = queryset.filter(meal_id=meal)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bookings = serializer.save()
        output = BookingSerializer(bookings, many=True, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, booking):
        user = self.request.user
        if booking.user_id != user.id and not user.is_canteen_admin:
            raise PermissionDenied("You can only cancel your own bookings.")
        if booking.is_redeemed:
            raise ValidationError("This booking has already been redeemed.")
        if not user.is_canteen_admin and not booking.meal.is_open_for(booking.date):
            raise ValidationError(
                f"Cancellation for {booking.meal.name} on {booking.date.isoformat()} has closed."
            )
        booking.delete()
