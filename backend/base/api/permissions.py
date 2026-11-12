from rest_framework.permissions import SAFE_METHODS, BasePermission


class ReadOnlyOrCanteenAdmin(BasePermission):
    """Any signed-in user may read; only canteen admins may change."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return request.method in SAFE_METHODS or user.is_canteen_admin
