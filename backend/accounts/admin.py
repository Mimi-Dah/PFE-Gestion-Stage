from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Etudiant, Entreprise, ChefDepartement
from .forms import CustomUserCreationForm, CustomUserChangeForm

try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    list_display = ('courriel', 'role', 'is_active', 'is_verified', 'is_staff', 'cree_le')
    list_filter = ('role', 'is_staff', 'is_verified', 'is_active')
    fieldsets = (
        (None, {'fields': ('courriel', 'password')}),
        ('Permissions', {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('cree_le', 'mis_a_jour_le')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('courriel', 'role', 'password1', 'password2', 'is_active', 'is_verified', 'is_staff', 'is_superuser'),
        }),
    )
    search_fields = ('courriel',)
    ordering = ('courriel',)
    filter_horizontal = ('groups', 'user_permissions',)
    readonly_fields = ('cree_le', 'mis_a_jour_le')

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ('prenom', 'nom', 'user', 'departement')
    search_fields = ('prenom', 'nom', 'user__courriel')

@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'user', 'email_contact', 'telephone')
    search_fields = ('nom', 'user__courriel')

@admin.register(ChefDepartement)
class ChefDepartementAdmin(admin.ModelAdmin):
    list_display = ('prenom', 'nom', 'user', 'departement')
    search_fields = ('prenom', 'nom', 'user__courriel')
