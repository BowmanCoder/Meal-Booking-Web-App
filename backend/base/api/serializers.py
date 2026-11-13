from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from base.models import MealUser

PASSWORD_STYLE = {"input_type": "password"}
INVALID_RESET_LINK = "This reset link is invalid or has expired."


def _check_new_password(password, password2, user=None):
    """Shared rules for any new password: confirmed, and strong enough."""
    if password != password2:
        raise serializers.ValidationError({"password2": "The two passwords do not match."})
    try:
        validate_password(password, user=user)
    except DjangoValidationError as error:
        raise serializers.ValidationError({"password": list(error.messages)})


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(style=PASSWORD_STYLE, write_only=True)
    password2 = serializers.CharField(style=PASSWORD_STYLE, write_only=True)

    class Meta:
        model = MealUser
        fields = ["email", "fullname", "dietary_preference", "password", "password2"]

    def validate_email(self, value):
        value = value.strip().lower()
        if MealUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        _check_new_password(attrs["password"], attrs["password2"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return MealUser.objects.create_user(**validated_data)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(style=PASSWORD_STYLE, write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Users may edit their name and dietary preference, never their role."""

    class Meta:
        model = MealUser
        fields = ["id", "email", "fullname", "role", "dietary_preference"]
        read_only_fields = ["id", "email", "role"]


class UserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(style=PASSWORD_STYLE, write_only=True)
    password = serializers.CharField(style=PASSWORD_STYLE, write_only=True)
    password2 = serializers.CharField(style=PASSWORD_STYLE, write_only=True)

    def validate_current_password(self, value):
        if not self.context["user"].check_password(value):
            raise serializers.ValidationError("Your current password is not correct.")
        return value

    def validate(self, attrs):
        _check_new_password(attrs["password"], attrs["password2"], self.context["user"])
        return attrs

    def save(self):
        user = self.context["user"]
        user.set_password(self.validated_data["password"])
        user.save()
        return user


class SendPasswordResetEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)

    def save(self):
        """Email a reset link if the account exists.

        Does nothing for an unknown email, so the response never reveals
        whether an address is registered.
        """
        email = self.validated_data["email"].strip().lower()
        user = MealUser.objects.filter(email__iexact=email, is_active=True).first()
        if user is None:
            return
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)
        link = f"{settings.FRONTEND_URL}/api/resetpassword/{uid}/{token}"
        send_mail(
            subject="Reset your BookMyMeal password",
            message=f"Use this link to choose a new password: {link}",
            from_email=None,  # DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
        )


class UserPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(style=PASSWORD_STYLE, write_only=True)
    password2 = serializers.CharField(style=PASSWORD_STYLE, write_only=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(self.context["uid"]))
            user = MealUser.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, MealUser.DoesNotExist):
            raise serializers.ValidationError(INVALID_RESET_LINK)
        if not PasswordResetTokenGenerator().check_token(user, self.context["token"]):
            raise serializers.ValidationError(INVALID_RESET_LINK)
        _check_new_password(attrs["password"], attrs["password2"], user)
        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save()
        return user
