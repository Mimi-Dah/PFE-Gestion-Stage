from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

_CRITERIA = dict(validators=[MinValueValidator(1), MaxValueValidator(5)])


class EvaluationDeStage(models.Model):
    RECO_CHOICES = (
        ('Oui', 'Oui'),
        ('Non', 'Non'),
        ('Peut-être', 'Peut-être'),
    )

    id_evaluation = models.AutoField(primary_key=True)
    entreprise = models.ForeignKey('accounts.Entreprise', on_delete=models.CASCADE)
    etudiant = models.ForeignKey('accounts.Etudiant', on_delete=models.CASCADE, related_name='evaluations')
    offre = models.ForeignKey('offres.OffreDeStage', on_delete=models.CASCADE)

    comportement    = models.IntegerField(**_CRITERIA)
    adaptabilite    = models.IntegerField(**_CRITERIA)
    travail_equipe  = models.IntegerField(**_CRITERIA)
    qualite_travail = models.IntegerField(**_CRITERIA)

    note_globale  = models.FloatField(editable=False)
    commentaires  = models.TextField(null=True, blank=True)
    recommanderait = models.CharField(max_length=20, choices=RECO_CHOICES)
    cree_le       = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.note_globale = float(
            self.comportement + self.adaptabilite + self.travail_equipe + self.qualite_travail
        )
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['entreprise', 'etudiant', 'offre'],
                name='unique_eval_entreprise_etudiant_offre',
            )
        ]

    def __str__(self):
        return f"Eval de {self.etudiant} par {self.entreprise}"


class AutoEvaluation(models.Model):
    """Student self-assessment using the same four 1–5 criteria as the enterprise evaluation."""

    id_auto_eval = models.AutoField(primary_key=True)
    etudiant = models.ForeignKey(
        'accounts.Etudiant', on_delete=models.CASCADE, related_name='auto_evaluations'
    )
    offre = models.ForeignKey(
        'offres.OffreDeStage', on_delete=models.CASCADE, related_name='auto_evaluations'
    )

    comportement    = models.IntegerField(**_CRITERIA)
    adaptabilite    = models.IntegerField(**_CRITERIA)
    travail_equipe  = models.IntegerField(**_CRITERIA)
    qualite_travail = models.IntegerField(**_CRITERIA)

    note_globale = models.FloatField(editable=False)
    commentaires = models.TextField(null=True, blank=True)
    cree_le      = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.note_globale = float(
            self.comportement + self.adaptabilite + self.travail_equipe + self.qualite_travail
        )
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['etudiant', 'offre'],
                name='unique_auto_eval_etudiant_offre',
            )
        ]

    def __str__(self):
        return f"Auto-éval de {self.etudiant} — {self.offre}"
