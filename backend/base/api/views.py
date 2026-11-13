from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from base.api.renderers import UserRenderer
from base.api.serializers import (
    SendPasswordResetEmailSerializer,
    UserChangePasswordSerializer,
    UserLoginSerializer,
    UserPasswordResetSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = get_tokens_for_user(user)
        return Response(
            {"token": token, "msg": "User Registration Successful!!!"},
            status=status.HTTP_201_CREATED,
        )


class UserLoginView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]
        user = authenticate(email=email, password=password)

        if user is not None:
            token = get_tokens_for_user(user)
            return Response(
                {"token": token, "msg": "User Login Successful!!!"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"errors": {"non_field_errors": ["Email or Password is INVALID!!!"]}},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, format=None):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """End this session: the given refresh token can no longer be used."""

    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        try:
            token = RefreshToken(request.data.get("refresh", ""))
        except TokenError:
            # Already expired or blacklisted: the session is over either way.
            return Response(status=status.HTTP_204_NO_CONTENT)
        if str(token.get("user_id")) == str(request.user.id):
            token.blacklist()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutEverywhereView(APIView):
    """End every session for this user, on all devices.

    Refresh tokens stop working at once. An access token already issued stays
    valid until it expires (at most 30 minutes), as access tokens are not
    checked against the database.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        for token in OutstandingToken.objects.filter(user=request.user):
            BlacklistedToken.objects.get_or_create(token=token)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"msg": "Password Changed Successfully"}, status=status.HTTP_200_OK
        )


class SendPasswordResetEmailView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Same answer whether or not the email is registered.
        return Response(
            {"msg": "If that email is registered, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class UserPasswordResetView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [AllowAny]

    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(
            data=request.data,
            context={"uid": uid, "token": token},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"msg": "Password Reset Successfull!!! "},
            status=status.HTTP_200_OK,
        )
