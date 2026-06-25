import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')

# Bypass MariaDB version check for Django 6.0+
from django.db.backends.base.base import BaseDatabaseWrapper
BaseDatabaseWrapper.check_database_version_supported = lambda self: None

django.setup()

from accounts.models import User

def reset_passwords():
    users = User.objects.all()
    count = 0
    for user in users:
        user.set_password('password123')
        user.save()
        count += 1
    print(f"Successfully reset passwords for {count} users to 'password123'")

if __name__ == "__main__":
    reset_passwords()
