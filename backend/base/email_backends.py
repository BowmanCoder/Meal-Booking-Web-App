import json
import logging
import urllib.error
import urllib.request
from email.utils import parseaddr

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"

# example.com is reserved and can never receive mail; the demo accounts use it.
UNDELIVERABLE_DOMAINS = ("@example.com", "@example.org", "@example.net")


class BrevoEmailBackend(BaseEmailBackend):
    """Send mail through Brevo's HTTPS API instead of SMTP.

    Free hosting tiers commonly block outgoing SMTP ports, and an HTTPS call
    is allowed everywhere. Mail to the demo accounts is dropped rather than
    sent, because it could only bounce.
    """

    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages:
            recipients = [
                address
                for address in message.to
                if not address.lower().endswith(UNDELIVERABLE_DOMAINS)
            ]
            if not recipients:
                continue
            sender_name, sender_address = parseaddr(message.from_email)
            payload = {
                "sender": {"email": sender_address, "name": sender_name or "BookMyMeal"},
                "to": [{"email": address} for address in recipients],
                "subject": message.subject,
                "textContent": message.body,
            }
            request = urllib.request.Request(
                BREVO_SEND_URL,
                data=json.dumps(payload).encode(),
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "content-type": "application/json",
                    "accept": "application/json",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=10):
                    sent += 1
            except (urllib.error.URLError, TimeoutError) as error:
                # Log the reason but never the message or the address.
                logger.error("Brevo refused or did not answer: %s", error)
                if not self.fail_silently:
                    raise
        return sent
