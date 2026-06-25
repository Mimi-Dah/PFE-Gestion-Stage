from django.db import models
from django.utils import timezone
from datetime import timedelta

JUSTIFY_WINDOW_DAYS = 3


class Absence(models.Model):
    STATUT_CHOICES = (
        ('Signaler',               'Signalée'),
        ('En_attente_approbation', "En attente d'approbation"),
        ('Justifiée',              'Justifiée'),
        ('Non_justifiée',          'Non justifiée'),
    )

    id_absence            = models.AutoField(primary_key=True)
    candidature           = models.ForeignKey('candidatures.Candidature', on_delete=models.CASCADE, related_name='absences')
    date_absence          = models.DateField()
    motif_signalement     = models.TextField()
    justification         = models.TextField(null=True, blank=True)
    document_justificatif = models.FileField(upload_to='justifications/', null=True, blank=True)
    statut                = models.CharField(max_length=25, choices=STATUT_CHOICES, default='Signaler')
    cree_le               = models.DateTimeField(auto_now_add=True)
    valide_le             = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Absence {self.candidature.etudiant} le {self.date_absence}"

    @property
    def deadline_justification(self):
        if self.cree_le:
            return self.cree_le + timedelta(days=JUSTIFY_WINDOW_DAYS)
        return None

    @property
    def delai_depasse(self):
        dl = self.deadline_justification
        return dl is not None and timezone.now() > dl
