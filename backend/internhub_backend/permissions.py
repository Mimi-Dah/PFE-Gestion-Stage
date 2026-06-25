from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    """Allows access only to students."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Étudiant'

class IsEnterprise(permissions.BasePermission):
    """Allows access only to enterprises."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Entreprise'

class IsChefDepartement(permissions.BasePermission):
    """Allows access only to department heads."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Chef_Departement'

class IsAdmin(permissions.BasePermission):
    """Allows access only to admins."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Admin'

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` attribute (or specific role attribute).
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check ownership based on role and linked profiles
        if hasattr(obj, 'etudiant') and obj.etudiant.user == request.user:
            return True
        if hasattr(obj, 'entreprise') and obj.entreprise.user == request.user:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False
