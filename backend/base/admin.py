from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError

from base.models import Booking, Meal, MealUser, Menu


class UserCreationForm(forms.ModelForm):
    """Create a user in the admin, with a repeated password."""

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Password confirmation", widget=forms.PasswordInput)

    class Meta:
        model = MealUser
        fields = ["email", "fullname", "role"]

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = user.email.strip().lower()
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """Edit a user in the admin. The password is shown as a read-only hash."""

    password = ReadOnlyPasswordHashField()

    class Meta:
        model = MealUser
        fields = [
            "email",
            "password",
            "fullname",
            "dietary_preference",
            "role",
            "is_active",
            "is_admin",
        ]


@admin.register(MealUser)
class UserModelAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = ["email", "fullname", "role", "dietary_preference", "is_admin", "is_active"]
    list_filter = ["role", "is_admin", "is_active"]
    fieldsets = [
        ("Sign in", {"fields": ["email", "password"]}),
        ("Profile", {"fields": ["fullname", "dietary_preference"]}),
        ("Permissions", {"fields": ["role", "is_admin", "is_active"]}),
    ]
    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": ["email", "fullname", "role", "password1", "password2"],
            },
        ),
    ]
    search_fields = ["email", "fullname"]
    ordering = ["email"]
    filter_horizontal = []


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ["name", "serve_time", "cutoff_time", "cutoff_days_before", "is_active"]


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ["date", "meal", "description"]
    list_filter = ["meal"]
    date_hierarchy = "date"


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["date", "meal", "user", "guest_name", "redeemed_at", "created_at"]
    list_filter = ["meal"]
    date_hierarchy = "date"
    search_fields = ["user__email", "guest_name", "coupon_code"]
    readonly_fields = ["coupon_code", "created_at"]
