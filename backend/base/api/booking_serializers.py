from datetime import timedelta

from django.db import IntegrityError, transaction
from rest_framework import serializers

from base.models import Booking, DietaryPreference, Meal, Menu

MAX_RANGE_DAYS = 31


class MealSerializer(serializers.ModelSerializer):
    # Stored as a string of digits ("01234"); exposed as a list ([0, 1, 2, 3, 4]).
    serving_days = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        allow_empty=False,
        required=False,
    )

    class Meta:
        model = Meal
        fields = [
            "id",
            "name",
            "serve_time",
            "cutoff_time",
            "cutoff_days_before",
            "serving_days",
            "is_active",
        ]

    def validate_serving_days(self, value):
        return "".join(str(day) for day in sorted(set(value)))


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
    # The guest's preference for a guest booking, otherwise the user's own.
    dietary_preference = serializers.CharField(read_only=True)
    is_guest = serializers.BooleanField(read_only=True)
    is_redeemed = serializers.BooleanField(read_only=True)
    serve_time = serializers.TimeField(source="meal.serve_time", read_only=True)
    cutoff = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()

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
            "dietary_preference",
            "guest_name",
            "is_guest",
            "coupon_code",
            "is_redeemed",
            "redeemed_at",
            "serve_time",
            "cutoff",
            "can_cancel",
            "created_at",
        ]
        read_only_fields = fields

    def get_cutoff(self, booking):
        return booking.meal.cutoff_for(booking.date)

    def get_can_cancel(self, booking):
        return not booking.is_redeemed and booking.meal.is_before_cutoff(booking.date)


class BookingCreateSerializer(serializers.Serializer):
    """Book one meal for a single `date`, for every day from `start_date` to
    `end_date`, or for a hand-picked list of `dates`. One booking (and coupon)
    is created per day.

    The booking always belongs to the signed-in user; there is no user field.
    The whole request is rejected if any day in it cannot be booked.
    """

    meal = serializers.PrimaryKeyRelatedField(queryset=Meal.objects.filter(is_active=True))
    date = serializers.DateField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    dates = serializers.ListField(
        child=serializers.DateField(),
        required=False,
        allow_empty=False,
        max_length=MAX_RANGE_DAYS,
    )
    guest_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    guest_dietary_preference = serializers.ChoiceField(
        choices=DietaryPreference.choices, required=False, default=DietaryPreference.NONE
    )

    def validate(self, attrs):
        date = attrs.get("date")
        start = attrs.get("start_date")
        end = attrs.get("end_date")

        picked = attrs.get("dates")

        ways = [bool(date), bool(start or end), bool(picked)]
        if sum(ways) != 1:
            raise serializers.ValidationError(
                "Send exactly one of: date, start_date with end_date, or dates."
            )
        if picked:
            dates = sorted(set(picked))
        else:
            if date:
                start = end = date
            elif not (start and end):
                raise serializers.ValidationError("Send both start_date and end_date.")
            if end < start:
                raise serializers.ValidationError(
                    {"end_date": "End date cannot be before start date."}
                )
            day_count = (end - start).days + 1
            if day_count > MAX_RANGE_DAYS:
                raise serializers.ValidationError(
                    f"A booking can cover at most {MAX_RANGE_DAYS} days."
                )
            # A range means "every serving day in between": days the meal is not
            # served, such as weekends, are skipped rather than rejected.
            dates = [
                day
                for day in (start + timedelta(days=offset) for offset in range(day_count))
                if attrs["meal"].is_served_on(day)
            ]
            if not dates:
                raise serializers.ValidationError(
                    f"{attrs['meal'].name} is not served on any day in that range."
                )

        meal = attrs["meal"]
        not_served = [d for d in dates if not meal.is_served_on(d)]
        if not_served:
            raise serializers.ValidationError(
                f"{meal.name} is not served on: {_format_dates(not_served)}."
            )
        closed = [d for d in dates if not meal.is_before_cutoff(d)]
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
        if not guest_name:
            # Only guests carry a preference on the booking itself.
            attrs["guest_dietary_preference"] = DietaryPreference.NONE
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
                        user=user,
                        meal=meal,
                        date=date,
                        guest_name=guest_name,
                        guest_dietary_preference=validated_data["guest_dietary_preference"],
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


class RedeemSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(max_length=64)
