from django.db import models

class ConventionDeStage(models.Model):
    STATUT_CHOICES = (
        ('En_attente_validation', 'En attente de validation'),
        ('Validée', 'Validée'),
        ('Refusée', 'Refusée'),
    )

    id_convention = models.AutoField(primary_key=True)
    candidature = models.OneToOneField('candidatures.Candidature', on_delete=models.CASCADE, related_name='convention')
    fichier_convention = models.FileField(upload_to='conventions/templates/', null=True, blank=True)
    fichier_signe = models.FileField(upload_to='conventions/signees/', null=True, blank=True)
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default='En_attente_validation')
    valide_par_chef_departement = models.ForeignKey('accounts.ChefDepartement', on_delete=models.SET_NULL, null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    signe_par_etudiant_le = models.DateTimeField(null=True, blank=True)
    signe_par_entreprise_le = models.DateTimeField(null=True, blank=True)
    motif_refus = models.TextField(null=True, blank=True)
    numero_convention = models.CharField(max_length=50, unique=True)
    cree_le = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return self.numero_convention
