from django.contrib import admin
from base.models import MealUser, Uni
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
        "is_admin",
    ]
    list_filter = ["is_admin"]
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
        ("Permissions", {"fields": ["is_admin"]}),
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

admin.site.register(Uni)
