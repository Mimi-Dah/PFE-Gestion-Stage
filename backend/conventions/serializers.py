from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import ConventionDeStage

SLA_DAYS = 3


class ConventionDeStageSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.SerializerMethodField()

    def get_etudiant_nom(self, obj):
        etudiant = obj.candidature.etudiant
        return f"{etudiant.prenom} {etudiant.nom}"

    entreprise_nom = serializers.CharField(source='candidature.offre.entreprise.nom', read_only=True)
    offre_titre = serializers.CharField(source='candidature.offre.titre', read_only=True)
    offre_id = serializers.IntegerField(source='candidature.offre.id_offre', read_only=True)
    offre_date_debut = serializers.DateField(source='candidature.offre.date_debut', read_only=True)
    offre_date_fin = serializers.DateField(source='candidature.offre.date_fin', read_only=True)
    candidature_statut = serializers.CharField(source='candidature.statut', read_only=True)
    deadline = serializers.SerializerMethodField()
    jours_restants = serializers.SerializerMethodField()

    def get_deadline(self, obj):
        if obj.cree_le:
            return obj.cree_le + timedelta(days=SLA_DAYS)
        return None

    def get_jours_restants(self, obj):
        if not obj.cree_le:
            return None
        delta = (obj.cree_le + timedelta(days=SLA_DAYS)) - timezone.now()
        return delta.days  # negative when overdue

    class Meta:
        model = ConventionDeStage
        fields = '__all__'
        read_only_fields = ('id_convention', 'numero_convention', 'date_validation', 'valide_par_chef_departement', 'cree_le')

