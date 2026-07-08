from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.utils.text import format_lazy

from .models import Absence

UNJUSTIFIED_LIMIT = 3


@receiver(post_save, sender=Absence)
def enforce_three_absences_rule(sender, instance, **kwargs):
    """
    When a third (or more) unjustified absence is recorded for the same
    candidature, the internship is automatically marked as Abandonné and
    both the student and the enterprise receive a notification.
    """
    if instance.statut != 'Non_justifiée':
        return

    candidature = instance.candidature

    # Idempotent: nothing to do if already abandoned.
    if candidature.statut == 'Abandonné':
        return

    unjustified_count = Absence.objects.filter(
        candidature=candidature,
        statut='Non_justifiée',
    ).count()

    if unjustified_count < UNJUSTIFIED_LIMIT:
        return

    candidature.statut = 'Abandonné'
    candidature.save(update_fields=['statut'])

    try:
        from notifications.utils import create_notification
        create_notification(
            user=candidature.etudiant.user,
            titre=_("Stage marqué comme abandonné"),
            message=format_lazy(
                _(
                    "Votre stage pour '{offre}' a été automatiquement "
                    "marqué comme abandonné suite à {count} absences non justifiées."
                ),
                offre=candidature.offre.titre, count=unjustified_count,
            ),
            type_event="Absence_stage_abandonne",
            lien="/espace/candidatures",
        )
        create_notification(
            user=candidature.offre.entreprise.user,
            titre=_("Stage marqué comme abandonné"),
            message=format_lazy(
                _(
                    "Le stage de {etudiant} pour '{offre}' a été automatiquement marqué comme "
                    "abandonné ({count} absences non justifiées)."
                ),
                etudiant=f"{candidature.etudiant.prenom} {candidature.etudiant.nom}",
                offre=candidature.offre.titre,
                count=unjustified_count,
            ),
            type_event="Absence_stage_abandonne",
            lien=f"/espace/entreprise/offres/{candidature.offre.id_offre}/candidatures",
        )
    except Exception:
        pass
