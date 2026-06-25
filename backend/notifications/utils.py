from django.utils import translation
from .models import Notification


def create_notification(user, titre, message, type_event, lien=None, send_email=True):
    """
    Crée une notification persistée dans la langue préférée de l'utilisateur.

    `titre` et `message` peuvent être des chaînes lazy (_("…")) ou des chaînes
    ordinaires. Ils sont évalués sous translation.override() afin que la
    traduction corresponde à la locale de l'utilisateur, pas à celle du thread
    courant (worker Celery ou request d'un autre utilisateur).

    Exemple d'appel depuis une vue :
        from django.utils.translation import gettext_lazy as _
        create_notification(
            user=etudiant.user,
            titre=_("Candidature acceptée"),
            message=_("Félicitations ! Votre candidature a été acceptée."),
            type_event='Candidature_acceptee',
        )
    """
    lang = getattr(user, 'preferred_language', None) or 'fr'
    with translation.override(lang):
        titre_str   = str(titre)
        message_str = str(message)

    notification = Notification.objects.create(
        user=user,
        titre=titre_str,
        message=message_str,
        type_event=type_event,
        lien=lien,
    )

    if send_email:
        try:
            from .tasks import send_notification_email
            send_notification_email.delay(user.courriel, titre_str, message_str, lien)
        except Exception:
            pass

    return notification
