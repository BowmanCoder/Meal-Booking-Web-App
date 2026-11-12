from datetime import timedelta

from django.db import IntegrityError, transaction
from rest_framework import serializers

from base.models import Booking, Meal, Menu

MAX_RANGE_DAYS = 31


class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = [
            "id",
            "name",
            "serve_time",
            "cutoff_time",
            "cutoff_days_before",
            "is_active",
        ]


class MenuSerializer(serializers.ModelSerializer):
    meal_name = serializers.CharField(source="meal.name", read_only=True)

    class Meta:
        model = Menu
        fields = ["id", "date", "meal", "meal_name", "description"]


class BookingSerializer(serializers.ModelSerializer):
    """Read-only view of a booking."""

    meal_name = serializers.CharField(source="meal.name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.fullname", read_only=True)
    is_guest = serializers.BooleanField(read_only=True)
    is_redeemed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "date",
            "meal",
            "meal_name",
            "user",
            "user_email",
            "user_name",
            "guest_name",
            "is_guest",
            "coupon_code",
            "is_redeemed",
            "redeemed_at",
            "created_at",
        ]
        read_only_fields = fields


class BookingCreateSerializer(serializers.Serializer):
    """Book one meal for a single `date`, or for every day from
    `start_date` to `end_date`. One booking (and coupon) is created per day.

    The booking always belongs to the signed-in user; there is no user field.
    The whole request is rejected if any day in it cannot be booked.
    """

    meal = serializers.PrimaryKeyRelatedField(queryset=Meal.objects.filter(is_active=True))
    date = serializers.DateField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    guest_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )

    def validate(self, attrs):
        date = attrs.get("date")
        start = attrs.get("start_date")
        end = attrs.get("end_date")

        if date and (start or end):
            raise serializers.ValidationError(
                "Send either date, or start_date and end_date, not both."
            )
        if date:
            start = end = date
        elif not (start and end):
            raise serializers.ValidationError(
                "Send either date, or both start_date and end_date."
            )
        if end < start:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be before start date."}
            )

        day_count = (end - start).days + 1
        if day_count > MAX_RANGE_DAYS:
            raise serializers.ValidationError(
                f"A booking can cover at most {MAX_RANGE_DAYS} days."
            )
        dates = [start + timedelta(days=offset) for offset in range(day_count)]

        meal = attrs["meal"]
        closed = [d for d in dates if not meal.is_open_for(d)]
        if closed:
            raise serializers.ValidationError(
                f"Booking for {meal.name} has closed for: {_format_dates(closed)}."
            )

        guest_name = attrs.get("guest_name", "").strip()
        if not guest_name:
            user = self.context["request"].user
            already_booked = list(
                Booking.objects.filter(
                    user=user, meal=meal, date__in=dates, guest_name=""
                ).values_list("date", flat=True)
            )
            if already_booked:
                raise serializers.ValidationError(
                    f"You already have a {meal.name} booking for: "
                    f"{_format_dates(already_booked)}."
                )

        attrs["guest_name"] = guest_name
        attrs["dates"] = dates
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        meal = validated_data["meal"]
        guest_name = validated_data["guest_name"]
        try:
            with transaction.atomic():
                return [
                    Booking.objects.create(
                        user=user, meal=meal, date=date, guest_name=guest_name
                    )
                    for date in validated_data["dates"]
                ]
        except IntegrityError:
            # Two identical requests raced past the check above; the database
            # constraint caught the second one.
            raise serializers.ValidationError(
                f"You already have a {meal.name} booking for one of these dates."
            )


def _format_dates(dates):
    return ", ".join(d.isoformat() for d in sorted(dates))
