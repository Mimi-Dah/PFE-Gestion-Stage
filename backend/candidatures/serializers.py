from rest_framework import serializers
from .models import Candidature
from accounts.serializers import EtudiantSerializer
from offres.serializers import OffreDeStageSerializer
from internhub_backend.sanitizers import SanitizeMixin

class CandidatureSerializer(SanitizeMixin, serializers.ModelSerializer):
    etudiant_detail = EtudiantSerializer(source='etudiant', read_only=True)
    offre_detail = OffreDeStageSerializer(source='offre', read_only=True)

    class Meta:
        model = Candidature
        fields = '__all__'
        read_only_fields = ['etudiant', 'postule_le', 'statut']

    def _get_etudiant(self):
        """Return the Etudiant profile or raise a clear validation error."""
        user = self.context['request'].user
        profile = getattr(user, 'profil_etudiant', None)
        if profile is None:
            raise serializers.ValidationError(
                {"profil": "Votre profil étudiant est incomplet. Veuillez le finaliser avant de postuler."}
            )
        return profile

    def validate(self, data):
        etudiant = self._get_etudiant()
        offre = data.get('offre')

        # Guard: offer must be active
        if offre and offre.statut != 'Active':
            raise serializers.ValidationError(
                {"offre": "Cette offre n'est plus disponible à la candidature."}
            )

        # Guard: no duplicate application (pre-empt IntegrityError)
        if offre and Candidature.objects.filter(etudiant=etudiant, offre=offre).exists():
            raise serializers.ValidationError(
                {"non_field_errors": ["Vous avez déjà postulé à cette offre."]}
            )

        return data

    def create(self, validated_data):
        validated_data['etudiant'] = self._get_etudiant()
        return super().create(validated_data)
