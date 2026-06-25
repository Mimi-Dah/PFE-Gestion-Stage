import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')

# Bypass MariaDB version check for Django 6.0+
from django.db.backends.base.base import BaseDatabaseWrapper
BaseDatabaseWrapper.check_database_version_supported = lambda self: None

django.setup()

from accounts.serializers import RegisterSerializer

data = {
    'courriel': 'test_user_reg@example.com',
    'password': 'Password123!',
    'role': 'Étudiant',
    'prenom': 'Test',
    'nom': 'User',
    'telephone': '12345678',
    'adresse': 'Test Address',
    'niveau_academique': 'Master 2',
    'departement_id': 1
}

serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    try:
        user = serializer.save()
        print(f"User created: {user.courriel}")
        print(f"Role: {user.role}")
        from accounts.models import Etudiant
        etudiant = Etudiant.objects.get(user=user)
        print(f"Etudiant profile created: {etudiant.prenom} {etudiant.nom}")
    except Exception as e:
        print(f"Error during save: {e}")
else:
    print(f"Serializer errors: {serializer.errors}")
