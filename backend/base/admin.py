from django.contrib import admin
from base.models import Booking, Meal, MealUser, Menu
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Register your models here.


class UserModelAdmin(BaseUserAdmin):
    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserModelAdmin
    # that reference specific fields on auth.User.
    list_display = [
        "id",
        "email",
        "fullname",
        "username",
        "date_of_birth",
        "contact",
        "gender",
        "address",
        "role",
        "is_admin",
    ]
    list_filter = ["role", "is_admin"]
    fieldsets = [
        ("User Credentials", {"fields": ["email", "password"]}),
        (
            "Personal info",
            {
                "fields": [
                    "fullname",
                    "username",
                    "contact",
                    "gender",
                    "address",
                    "date_of_birth",
                ]
            },
        ),
        ("Preferences", {"fields": ["dietary_preference"]}),
        ("Permissions", {"fields": ["role", "is_admin"]}),
    ]
    # add_fieldsets is not a standard ModelAdmin attribute. UserModelAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": [
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "fullname",
                    "contact",
                    "gender",
                    "address",
                    "date_of_birth",
                ],
            },
        ),
    ]
    search_fields = ["email"]
    ordering = ["email", "id"]
    filter_horizontal = []


# Now register the new UserModelAdmin...
admin.site.register(MealUser, UserModelAdmin)



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
