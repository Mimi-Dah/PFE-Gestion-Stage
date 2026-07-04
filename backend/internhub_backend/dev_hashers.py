from django.contrib.auth.hashers import PBKDF2PasswordHasher


class FastPBKDF2Hasher(PBKDF2PasswordHasher):
    """Hasher rapide pour le développement local. Ne jamais utiliser en production."""
    iterations = 4
