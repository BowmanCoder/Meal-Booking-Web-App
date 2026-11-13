from datetime import timedelta

from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from base.models import Booking

# example.com is reserved and can never receive mail; the demo accounts use it.
UNDELIVERABLE_DOMAINS = ("@example.com", "@example.org", "@example.net")


class Command(BaseCommand):
    help = (
        "Email each user who has reminders switched on a list of the meals they "
        "have booked for tomorrow. Meant to be run once every evening."
    )

    def handle(self, *args, **options):
        tomorrow = timezone.localdate() + timedelta(days=1)
        bookings = (
            Booking.objects.filter(
                date=tomorrow,
                redeemed_at__isnull=True,
                user__email_reminders=True,
                user__is_active=True,
            )
            .select_related("user", "meal")
            .order_by("user_id", "meal__serve_time", "id")
        )

        by_user = {}
        for booking in bookings:
            if booking.user.email.endswith(UNDELIVERABLE_DOMAINS):
                continue
            by_user.setdefault(booking.user, []).append(booking)

        for user, user_bookings in by_user.items():
            lines = []
            for booking in user_bookings:
                cutoff = timezone.localtime(booking.meal.cutoff_for(booking.date))
                who = f" (guest: {booking.guest_name})" if booking.guest_name else ""
                lines.append(
                    f"- {booking.meal.name} at {booking.meal.serve_time:%H:%M}{who}. "
                    f"Cancel before {cutoff:%a %d %b, %H:%M}."
                )
            body = (
                f"Hi {user.fullname},\n\n"
                f"You have booked for {tomorrow:%A %d %B}:\n"
                + "\n".join(lines)
                + "\n\nShow your coupon in the app at the counter.\n"
                "You can switch these reminders off in your profile menu."
            )
            send_mail(
                subject=f"Your meals for {tomorrow:%A %d %B}",
                message=body,
                from_email=None,
                recipient_list=[user.email],
            )

        self.stdout.write(f"Sent {len(by_user)} reminder email(s) for {tomorrow.isoformat()}.")
