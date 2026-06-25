from rest_framework import serializers
from django.utils import timezone
from .models import Absence


class AbsenceSerializer(serializers.ModelSerializer):
    etudiant_nom         = serializers.CharField(source='candidature.etudiant.nom',            read_only=True)
    etudiant_prenom      = serializers.CharField(source='candidature.etudiant.prenom',          read_only=True)
    etudiant_courriel    = serializers.CharField(source='candidature.etudiant.user.courriel',   read_only=True)
    offre_titre          = serializers.CharField(source='candidature.offre.titre',              read_only=True)
    entreprise_nom       = serializers.CharField(source='candidature.offre.entreprise.nom',     read_only=True)
    etudiant_departement = serializers.SerializerMethodField()
    deadline_justification = serializers.SerializerMethodField()
    jours_restants       = serializers.SerializerMethodField()
    delai_depasse        = serializers.SerializerMethodField()

    class Meta:
        model  = Absence
        fields = '__all__'

    def get_etudiant_departement(self, obj):
        dept = getattr(obj.candidature.etudiant, 'departement', None)
        return dept.nom if dept else None

    def get_deadline_justification(self, obj):
        dl = obj.deadline_justification
        return dl.isoformat() if dl else None

    def get_jours_restants(self, obj):
        dl = obj.deadline_justification
        if not dl:
            return None
        return (dl - timezone.now()).days

    def get_delai_depasse(self, obj):
        return obj.delai_depasse

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = instance.id_absence
        return data


class AbsenceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Absence
        fields = ('candidature', 'date_absence', 'motif_signalement')
