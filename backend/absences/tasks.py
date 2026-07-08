from celery import shared_task
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.utils.text import format_lazy
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
            titre=_("Absence clôturée — délai dépassé"),
            message=format_lazy(
                _(
                    "Le délai de 3 jours pour justifier votre absence du {date} "
                    "(stage '{offre}') est dépassé. "
                    "Elle est désormais définitivement marquée comme non justifiée."
                ),
                date=absence.date_absence, offre=absence.candidature.offre.titre,
            ),
            type_event="Absence_expiree",
            lien="/espace/absences",
        )
        count += 1

    return f"{count} absence(s) clôturée(s) automatiquement."
