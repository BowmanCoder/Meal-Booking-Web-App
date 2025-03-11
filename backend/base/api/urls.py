from django.urls import path
from . import views
from .views import MyTokenObtainPairView
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserProfileView,
    UserChangePasswordView,
    SendPasswordResetEmailView,
    UserPasswordResetView,
    BookingView,
    BookingDetailsView,
)


from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [
    path("", views.getRoutes),
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
    path("booking/", BookingView.as_view(), name="booking"),
    # path("bookingdetails/", BookingDetailsView.as_view(), name="bookingdetails"),
    path("bookdetail/", views.getBooking),
    path("all_events/", views.all_events, name="all_events"),
    path("add_event/", views.add_event, name="add_event"),
    path("update/", views.update, name="update"),
    path("remove/", views.remove, name="remove"),
    path("event/save/", views.save_event_api, name="save_event_api"),
    path("task-delete/<str:pk>/", views.taskDelete, name="task-delete"),
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
