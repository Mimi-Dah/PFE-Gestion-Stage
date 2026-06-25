from rest_framework import serializers
from .models import EvaluationDeStage, AutoEvaluation


class EvaluationDeStageSerializer(serializers.ModelSerializer):
    # Virtual fields expected by the frontend
    entreprise_nom   = serializers.SerializerMethodField()
    etudiant_nom     = serializers.SerializerMethodField()
    date_evaluation  = serializers.SerializerMethodField()
    type_evaluation  = serializers.SerializerMethodField()

    class Meta:
        model = EvaluationDeStage
        fields = '__all__'
        read_only_fields = ('id_evaluation', 'note_globale', 'cree_le', 'entreprise')

    def get_entreprise_nom(self, obj):
        return obj.entreprise.nom

    def get_etudiant_nom(self, obj):
        return f"{obj.etudiant.prenom} {obj.etudiant.nom}"

    def get_date_evaluation(self, obj):
        return obj.cree_le

    def get_type_evaluation(self, obj):
        return 'Entreprise'


class AutoEvaluationSerializer(serializers.ModelSerializer):
    # Mirror the id field name the frontend uses for enterprise evals
    id_evaluation   = serializers.ReadOnlyField(source='id_auto_eval')
    entreprise_nom  = serializers.SerializerMethodField()
    date_evaluation = serializers.SerializerMethodField()
    type_evaluation = serializers.SerializerMethodField()

    class Meta:
        model = AutoEvaluation
        fields = '__all__'
        read_only_fields = ('id_auto_eval', 'id_evaluation', 'note_globale', 'cree_le', 'etudiant')

    def get_entreprise_nom(self, obj):
        return obj.offre.entreprise.nom

    def get_date_evaluation(self, obj):
        return obj.cree_le

    def get_type_evaluation(self, obj):
        return 'Auto'
