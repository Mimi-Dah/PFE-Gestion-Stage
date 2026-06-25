from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task(name='absences.tasks.close_expired_absences')
def close_expired_absences():
    from .models import Absence, JUSTIFY_WINDOW_DAYS
    from notifications.utils import create_notification

    deadline = timezone.now() - timedelta(days=JUSTIFY_WINDOW_DAYS)
    expired = Absence.objects.filter(
        statut='Signaler',
        cree_le__lte=deadline,
    ).select_related(
        'candidature__etudiant__user',
        'candidature__offre',
    )

    count = 0
    for absence in expired:
        absence.statut    = 'Non_justifiée'
        absence.valide_le = timezone.now()
        absence.save(update_fields=['statut', 'valide_le'])

        create_notification(
            user=absence.candidature.etudiant.user,
            titre="Absence clôturée — délai dépassé",
            message=(
                f"Le délai de 3 jours pour justifier votre absence du {absence.date_absence} "
                f"(stage '{absence.candidature.offre.titre}') est dépassé. "
                f"Elle est désormais définitivement marquée comme non justifiée."
            ),
            type_event="Absence_expiree",
            lien="/espace/absences",
        )
        count += 1

    return f"{count} absence(s) clôturée(s) automatiquement."
