"""
Test settings — uses SQLite so tests run without a MySQL server.
Run with:  python manage.py test --settings=internhub_backend.settings_test
"""
from .settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',  # noqa: F405
    }
}

# Silent email (no SMTP needed in tests)
EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'

# Run Celery tasks synchronously and surface exceptions immediately
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Faster password hashing in tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
