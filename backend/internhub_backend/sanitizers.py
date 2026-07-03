import bleach
from rest_framework import serializers

# Whitelist vide = aucun tag HTML autorisé.
# strip=True supprime les tags au lieu de les échapper (< → &lt;).
_ALLOWED_TAGS: list[str] = []
_ALLOWED_ATTRS: dict = {}


def sanitize_text(value: str) -> str:
    """Supprime tout HTML/JS d'une chaîne via bleach (protection XSS)."""
    if not isinstance(value, str):
        return value
    return bleach.clean(
        value,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        strip=True,
    ).strip()


class SanitizeMixin:
    """
    Mixin DRF : nettoie automatiquement tous les champs texte contre
    les injections XSS AVANT la validation standard.

    Usage :
        class MonSerializer(SanitizeMixin, serializers.ModelSerializer):
            ...

    Le mixin doit être listé EN PREMIER dans l'héritage (MRO).
    """

    def to_internal_value(self, data):
        mutable = {}
        for key, value in data.items():
            mutable[key] = sanitize_text(value) if isinstance(value, str) else value
        return super().to_internal_value(mutable)
