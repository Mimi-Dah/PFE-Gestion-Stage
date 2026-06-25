from django.db import models

class Etablissement(models.Model):
    nom = models.CharField(max_length=255)
    adresse = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.nom

class Departement(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='departements')
    nom = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.nom} - {self.etablissement.nom}"
