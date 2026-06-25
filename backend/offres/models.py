from django.db import models

class OffreDeStage(models.Model):
    STATUT_CHOICES = (
        ('Active', 'Active'),
        ('Fermée', 'Fermée'),
        ('Archivée', 'Archivée'),
    )

    id_offre = models.AutoField(primary_key=True)
    entreprise = models.ForeignKey('accounts.Entreprise', on_delete=models.CASCADE, related_name='offres')
    departement = models.ForeignKey('etablissements.Departement', on_delete=models.SET_NULL, null=True, blank=True, related_name='offres')
    titre = models.CharField(max_length=255)
    description = models.TextField()
    exigences = models.TextField(null=True, blank=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    duree_semaines = models.IntegerField(editable=False, null=True)
    localisation = models.CharField(max_length=255)
    teletravail = models.BooleanField(default=False)
    domaine = models.CharField(max_length=100, blank=True, default='')
    gratification = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    places_disponibles = models.PositiveIntegerField(default=1)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='Active')
    publie_le = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.date_fin and self.date_debut:
            delta = self.date_fin - self.date_debut
            self.duree_semaines = delta.days // 7
        if self.departement and not self.domaine:
            self.domaine = self.departement.nom
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} - {self.entreprise.nom}"

class Favori(models.Model):
    etudiant = models.ForeignKey('accounts.Etudiant', on_delete=models.CASCADE, related_name='favoris')
    offre = models.ForeignKey(OffreDeStage, on_delete=models.CASCADE, related_name='favorise_par')
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['etudiant', 'offre'], name='unique_favori')
        ]

    def __str__(self):
        return f"{self.etudiant} aime {self.offre}"
