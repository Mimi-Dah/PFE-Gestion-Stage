from celery import shared_task
import logging
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.utils.text import format_lazy
from datetime import timedelta
from .models import ConventionDeStage
from notifications.utils import create_notification

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def generate_convention_pdf_task(self, convention_id):
    from .utils import generate_convention_pdf
    try:
        generate_convention_pdf(convention_id)
    except Exception as exc:
        logger.error("PDF generation failed for convention %s: %s", convention_id, exc)
        raise self.retry(exc=exc)


@shared_task
def auto_reject_expired_conventions():
    """
    BUSINESS RULE: If a convention is not processed within 3 days, it is automatically rejected.
    """
    expiration_threshold = timezone.now() - timedelta(days=3)
    expired_conventions = ConventionDeStage.objects.filter(
        statut='En_attente_validation',
        cree_le__lt=expiration_threshold
    )

    count = expired_conventions.count()
    if count == 0:
        return f"No expired conventions to process."

    for convention in expired_conventions:
        convention.statut = 'Refusée'
        convention.motif_refus = "Rejected automatically after 3 days of inactivity (System Policy)."
        convention.save()

        # Notify Student
        create_notification(
            user=convention.candidature.etudiant.user,
            titre=_("Convention Expirée"),
            message=format_lazy(
                _(
                    "Votre convention {numero} a été automatiquement rejetée car elle n'a pas "
                    "été traitée dans le délai de 3 jours."
                ),
                numero=convention.numero_convention,
            ),
            type_event="Convention_refusee",
            lien="/espace/mon-stage"
        )
        # Notify Enterprise
        create_notification(
            user=convention.candidature.offre.entreprise.user,
            titre=_("Convention Expirée (Auto-Rejet)"),
            message=format_lazy(
                _(
                    "La convention {numero} pour {etudiant} a été rejetée automatiquement "
                    "(délai de 3 jours dépassé)."
                ),
                numero=convention.numero_convention,
                etudiant=f"{convention.candidature.etudiant.prenom} {convention.candidature.etudiant.nom}",
            ),
            type_event="Convention_refusee",
            lien="/espace/entreprise/conventions"
        )

    return f"Successfully auto-rejected {count} expired conventions."
