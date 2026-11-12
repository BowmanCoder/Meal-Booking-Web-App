from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .booking_views import BookingViewSet, MealViewSet, MenuViewSet
from .views import (
    MyTokenObtainPairView,
    SendPasswordResetEmailView,
    UserChangePasswordView,
    UserLoginView,
    UserPasswordResetView,
    UserProfileView,
    UserRegistrationView,
)

router = DefaultRouter()
router.register("meals", MealViewSet, basename="meal")
router.register("menus", MenuViewSet, basename="menu")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", UserLoginView.as_view(), name="login"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("changepassword/", UserChangePasswordView.as_view(), name="changepassword"),
    path(
        "resetpasswordemail/",
        SendPasswordResetEmailView.as_view(),
        name="resetpasswordemail",
    ),
    path(
        "resetpassword/<uid>/<token>/",
        UserPasswordResetView.as_view(),
        name="resetpassword",
    ),
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
