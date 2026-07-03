from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """5 tentatives de connexion par minute par adresse IP."""
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """10 inscriptions par heure par adresse IP (anti-spam)."""
    scope = 'register'
