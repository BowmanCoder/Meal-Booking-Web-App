from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from base.models import Uni
from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from datetime import datetime, timedelta


from .serializers import UserRegistrationSerializer

from base.api.serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserChangePasswordSerializer,
    SendPasswordResetEmailSerializer,
    UserPasswordResetSerializer,
    BookingSerializer,
)
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated

from base.api.renderers import UserRenderer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["email"] = user.email
        # ...

        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(["GET"])
def getRoutes(request):
    routes = [
        "/api/token",
        "/api/token/refresh",
    ]

    return Response(routes)


@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def getBooking(request):
    user = request.user
    # unis = user.uni_set.all()
    unis = Uni.objects.all()
    serializer = BookingSerializer(unis, many=True)

    return Response(serializer.data)


@api_view(["DELETE"])
def taskDelete(request, pk):
    task = Uni.objects.get(id=pk)
    task.delete()

    return Response("Item succsesfully deleted!")


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = get_tokens_for_user(user)  # generating token when user registers

        return Response(
            {"token": token, "msg": "User Registration Successful!!!"},
            status=status.HTTP_201_CREATED,
        )
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.data.get("email")
        password = serializer.data.get("password")
        user = authenticate(email=email, password=password)

        if user is not None:
            token = get_tokens_for_user(user)  #  token when user is authenticated
            return Response(
                {"token": token, "msg": "User Login Successful!!!"},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"errors": {"non_field_errors": ["Email or Password is INVALID!!!"]}},
                status=status.HTTP_404_NOT_FOUND,
            )


class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        return Response(
            {"msg": "Password Changed Successfully"}, status=status.HTTP_200_OK
        )
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendPasswordResetEmailView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = SendPasswordResetEmailSerializer(
            data=request.data,
            # context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        return Response(
            {"msg": "The Password Reset Link has been sent! Check your mail ASAP!!! "},
            status=status.HTTP_200_OK,
        )


class UserPasswordResetView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(
            data=request.data,
            context={
                "uid": uid,
                "token": token,
            },
        )
        serializer.is_valid(raise_exception=True)
        return Response(
            {"msg": "Password Reset Successfull!!! "},
            status=status.HTTP_200_OK,
        )


class BookingView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # token = get_tokens_for_user(user)
        #  # generating token when user registers

        return Response(
            {
                # "token": token,
                "msg": "Booking Successful!!!"
            },
            status=status.HTTP_201_CREATED,
        )
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailsView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        unis = user.uni_set.all()
        serializer = BookingSerializer(unis, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST", "GET"])
def save_event_api(request):
    serializer = BookingSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"status": "success"})
    else:
        return Response({"status": "error", "message": serializer.errors})


def index(request):
    all_events = Uni.objects.all()
    context = {
        "events": all_events,
    }
    return render(request, "index.html", context)


def all_events(request):
    all_events = Uni.objects.all()
    out = []
    for event in all_events:
        out.append(
            {
                "id": Uni.id,
                "title": Uni.email,
                "couponid": Uni.couponid,
                "start": Uni.startdate.strftime("%m/%d/%Y"),
                "end": Uni.enddate.strftime("%m/%d/%Y"),
            }
        )
    return JsonResponse(out, safe=False)


def add_event(request):
    startdate = (datetime.now() + 1).strftime("%m/%d/%Y")
    enddate = request.GET.get("end", None)
    title = request.GET.get("title", None)
    event = Uni(name=str(title), start=startdate, end=enddate)
    event.save()
    data = {"start_date": startdate}
    return JsonResponse(data)


def update(request):
    startdate = (datetime.now() + 1).strftime("%m/%d/%Y")
    enddate = request.GET.get("end", None)
    title = request.GET.get("title", None)
    id = request.GET.get("id", None)
    event = Uni.objects.get(id=id)
    event.startdate = startdate
    event.enddate = enddate
    event.email = title
    event.save()
    data = {"start_date": startdate}
    return JsonResponse(data)


def remove(request):
    id = request.GET.get("id", None)
    event = Uni.objects.get(id=id)
    event.delete()
    data = {}
    return JsonResponse(data)
