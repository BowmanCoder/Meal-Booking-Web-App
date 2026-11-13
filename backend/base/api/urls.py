from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .booking_views import BookingViewSet, MealViewSet, MenuViewSet
from .kitchen_views import AttendanceView, ForecastView, PrepSheetView
from .views import (
    LogoutEverywhereView,
    LogoutView,
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
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutEverywhereView.as_view(), name="logout_all"),
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
    path("kitchen/prep-sheet/", PrepSheetView.as_view(), name="kitchen_prep_sheet"),
    path("kitchen/attendance/", AttendanceView.as_view(), name="kitchen_attendance"),
    path("kitchen/forecast/", ForecastView.as_view(), name="kitchen_forecast"),
    path("", include(router.urls)),
]
