from rest_framework import serializers
from .models import OffreDeStage, Favori
from accounts.serializers import EntrepriseSerializer

class OffreDeStageSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='id_offre')
    entreprise = EntrepriseSerializer(read_only=True)
    entreprise_id = serializers.IntegerField(write_only=True, required=False)
    departement_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    departement_nom = serializers.SerializerMethodField()
    candidatures_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    is_favori = serializers.SerializerMethodField()
    is_applied = serializers.SerializerMethodField()

    class Meta:
        model = OffreDeStage
        fields = '__all__'

    def get_departement_nom(self, obj):
        return obj.departement.nom if obj.departement else None

    def get_candidatures_count(self, obj):
        return obj.candidatures.count()
        
    def get_pending_count(self, obj):
        return obj.candidatures.filter(statut='En_attente').count()

    def get_is_favori(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'Étudiant':
            try:
                return Favori.objects.filter(etudiant=request.user.profil_etudiant, offre=obj).exists()
            except:
                return False
        return False

    def get_is_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'Étudiant':
            try:
                return obj.candidatures.filter(etudiant=request.user.profil_etudiant).exists()
            except:
                return False
        return False

    def create(self, validated_data):
        # By default, link to the requesting user's Enterprise if accessed via endpoint
        return super().create(validated_data)

class FavoriSerializer(serializers.ModelSerializer):
    offre_details = OffreDeStageSerializer(source='offre', read_only=True)
    
    class Meta:
        model = Favori
        fields = ('id', 'offre', 'offre_details', 'cree_le')
