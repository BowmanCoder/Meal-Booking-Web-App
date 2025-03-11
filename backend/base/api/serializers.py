from rest_framework import serializers
from base.models import MealUser, Uni
from xml.dom import ValidationErr
from .utils import Util
from django.core.mail import send_mail
from django.conf import settings
from django.contrib import messages


from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={"input_type": "password"}, write_only=True)

    class Meta:
        model = MealUser
        fields = [
            "email",
            "date_of_birth",
            "fullname",
            "username",
            "contact",
            "gender",
            "address",
            "password",
            "password2",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    # Validating password and confirm password

    # attrs will get me data from UserRegistrationView

    def validate(self, attrs):
        password = attrs.get("password")
        password2 = attrs.get("password2")
        if password != password2:
            raise serializers.ValidationError("Passwords not Similar!!!")
        return attrs

    def create(self, validate_data):
        return MealUser.objects.create_user(**validate_data)


class UserLoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255)

    class Meta:
        model = MealUser
        fields = [
            "email",
            "password",
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealUser
        fields = [
            "id",
            "email",
            "username",
            "fullname",
        ]


class UserChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(
        max_length=255, style={"input_type": "password"}, write_only=True
    )
    password2 = serializers.CharField(
        max_length=255, style={"input_type": "password"}, write_only=True
    )

    class Meta:
        fields = ["password", "password2"]

    def validate(self, attrs):
        password = attrs.get("password")
        password2 = attrs.get("password2")
        user = self.context.get("user")
        if password != password2:
            raise serializers.ValidationError(
                "Password and Confirm Password doesn't match"
            )
        user.set_password(password)
        user.save()
        return attrs


class SendPasswordResetEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)

    class Meta:
        fields = ["email"]

    def validate(self, attrs):
        email = attrs.get("email")
        user = MealUser.objects.get(email=email)
        if MealUser.objects.filter(email=email).exists():
            uid = urlsafe_base64_encode(force_bytes(user.id))
            print("Encoded UID", uid)
            token = PasswordResetTokenGenerator().make_token(user)
            print("Password Reset Token", token)
            link = "http://localhost:3000/api/resetpassword/" + uid + "/" + token
            print("Password Reset Link", link)
            # Send EMail
            subject = "Reset Your Password"
            body = "Click Following Link to Reset Your Password " + link
            email_from = settings.EMAIL_HOST_USER
            receipient = [email]
            send_mail(subject, body, email_from, receipient)
            # Util.send_email(data)
            return attrs
        else:
            raise serializers.ValidationError("You are not a Registered User")

            # return super().validate(attrs)


class UserPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(
        max_length=255, style={"input_type": "password"}, write_only=True
    )
    password2 = serializers.CharField(
        max_length=255, style={"input_type": "password"}, write_only=True
    )

    class Meta:
        fields = ["password", "password2"]

    def validate(self, attrs):
        try:
            password = attrs.get("password")
            password2 = attrs.get("password2")
            uid = self.context.get("uid")
            token = self.context.get("token")
            if password != password2:
                raise serializers.ValidationError(
                    "Password and Confirm Password doesn't match"
                )
            id = smart_str(urlsafe_base64_decode(uid))
            user = MealUser.objects.get(id=id)
            if not PasswordResetTokenGenerator().check_token(
                user,
                token,
            ):
                raise ValidationErr("Either token has expired or it is inalid")
            user.set_password(password)
            user.save()
            return attrs
        except DjangoUnicodeDecodeError as identifier:
            PasswordResetTokenGenerator().check_token(user, token)
            raise ValidationErr("Either token has expired or it is inalid")


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Uni
        fields = "__all__"

    # def validate(self, attrs):
    #     startdate = attrs.get("startdate")
    #     enddate = attrs.get("enddate")
    #     if startdate and enddate:
    #         if startdate > enddate:
    #             raise serializers.ValidationError("Invalid Booking Term")
    #         return attrs

    # def create(self, validate_data):
    #     return Uni.objects.create_user(**validate_data)
