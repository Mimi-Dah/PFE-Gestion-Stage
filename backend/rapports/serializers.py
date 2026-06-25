from rest_framework import serializers
from .models import RapportDeStage

class RapportDeStageSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.SerializerMethodField()
    offre_titre = serializers.CharField(source='offre.titre', read_only=True)
    note_entreprise = serializers.SerializerMethodField()
    recommandation_entreprise = serializers.SerializerMethodField()

    def get_etudiant_nom(self, obj):
        return f"{obj.etudiant.prenom} {obj.etudiant.nom}"

    def get_note_entreprise(self, obj):
        from evaluations.models import EvaluationDeStage
        evaluation = EvaluationDeStage.objects.filter(etudiant=obj.etudiant, offre=obj.offre).first()
        return evaluation.note_globale if evaluation else None

    def get_recommandation_entreprise(self, obj):
        from evaluations.models import EvaluationDeStage
        evaluation = EvaluationDeStage.objects.filter(etudiant=obj.etudiant, offre=obj.offre).first()
        return evaluation.recommanderait if evaluation else None

    class Meta:
        model = RapportDeStage
        fields = '__all__'
        read_only_fields = ('id_rapport', 'soumis_le', 'note', 'commentaire', 'etudiant')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = instance.id_rapport
        return data

