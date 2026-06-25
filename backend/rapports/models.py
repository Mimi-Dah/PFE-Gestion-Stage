from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class RapportDeStage(models.Model):
    id_rapport = models.AutoField(primary_key=True)
    etudiant = models.ForeignKey('accounts.Etudiant', on_delete=models.CASCADE, related_name='rapports')
    offre = models.ForeignKey('offres.OffreDeStage', on_delete=models.CASCADE)
    fichier = models.FileField(upload_to='rapports/')
    resume = models.TextField()
    soumis_le = models.DateTimeField(auto_now_add=True)
    note = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(20)], null=True, blank=True)

    commentaire = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['etudiant', 'offre'], name='unique_rapport_etudiant_offre')
        ]

    def __str__(self):
        return f"Rapport de {self.etudiant} - {self.offre}"
