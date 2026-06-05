from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'ADMIN'


class IsHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'HR'


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'EMPLOYEE'


class IsHRorAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['HR', 'ADMIN']


class IsAnyUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['EMPLOYEE', 'HR', 'ADMIN']


class IsProfileOwnerOrAdmin(BasePermission):
    """
    Allows full access to Admins, HRs editing Employees, 
    and Users editing their own profile.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'HR' and obj.role == 'EMPLOYEE':
            return True
        return obj == request.user
