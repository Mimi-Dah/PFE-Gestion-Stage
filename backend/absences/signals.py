from django.db.models.signals import post_save
from django.dispatch import receiver

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
            titre="Stage marqué comme abandonné",
            message=(
                f"Votre stage pour '{candidature.offre.titre}' a été automatiquement "
                f"marqué comme abandonné suite à {unjustified_count} absences non justifiées."
            ),
            type_event="Absence_stage_abandonne",
            lien="/espace/candidatures",
        )
        create_notification(
            user=candidature.offre.entreprise.user,
            titre="Stage marqué comme abandonné",
            message=(
                f"Le stage de {candidature.etudiant.prenom} {candidature.etudiant.nom} "
                f"pour '{candidature.offre.titre}' a été automatiquement marqué comme "
                f"abandonné ({unjustified_count} absences non justifiées)."
            ),
            type_event="Absence_stage_abandonne",
            lien=f"/espace/entreprise/offres/{candidature.offre.id_offre}/candidatures",
        )
    except Exception:
        pass
