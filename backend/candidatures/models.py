from django.db import models

class Candidature(models.Model):
    STATUT_CHOICES = (
        ('En_attente', 'En attente'),
        ('Acceptée', 'Acceptée'),
        ('Refusée', 'Refusée'),
        ('Convention_en_cours', 'Convention en cours'),
        ('Stage_actif', 'Stage actif (En cours)'),
        ('Terminé', 'Stage terminé'),
        ('Retirée', 'Retirée'),
        ('Abandonné', 'Stage abandonné'),
    )

    id_candidature = models.AutoField(primary_key=True)
    etudiant = models.ForeignKey('accounts.Etudiant', on_delete=models.CASCADE, related_name='candidatures')
    offre = models.ForeignKey('offres.OffreDeStage', on_delete=models.CASCADE, related_name='candidatures')
    postule_le = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='En_attente')
    texte_lettre_motivation = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['etudiant', 'offre'], name='unique_candidature_etudiant_offre')
        ]

    def __str__(self):
        return f"Candidature {self.etudiant} -> {self.offre.titre}"
