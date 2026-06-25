from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileMeView, EtudiantDetailView,
    EntrepriseDetailView, VerifyEmailView, ChefManagementView,
    DepartementListView, UserManagementView, DepartementManagementView,
    PasswordResetRequestView, PasswordResetConfirmView, AdminPasswordResetView,
    ChangePasswordView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/verify/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', ProfileMeView.as_view(), name='auth_me'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('etudiants/<int:pk>/', EtudiantDetailView.as_view(), name='etudiant-detail'),
    path('entreprises/<int:pk>/', EntrepriseDetailView.as_view(), name='entreprise-detail'),
    path('admin/chefs/', ChefManagementView.as_view(), name='admin-chefs'),
    path('admin/chefs/<int:pk>/', ChefManagementView.as_view(), name='admin-chef-detail'),
    path('admin/utilisateurs/', UserManagementView.as_view(), name='admin-users'),
    path('admin/utilisateurs/<int:pk>/', UserManagementView.as_view(), name='admin-user-detail'),
    path('admin/utilisateurs/<int:pk>/reset-password/', AdminPasswordResetView.as_view(), name='admin-reset-password'),
    path('admin/departements/', DepartementManagementView.as_view(), name='admin-depts'),
    path('departements/', DepartementListView.as_view(), name='departement-list'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
]
