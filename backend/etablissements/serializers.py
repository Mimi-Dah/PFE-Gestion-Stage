from rest_framework import serializers
from .models import Etablissement, Departement

class EtablissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etablissement
        fields = '__all__'

class DepartementSerializer(serializers.ModelSerializer):
    etablissement_nom = serializers.CharField(source='etablissement.nom', read_only=True, default="N/A")
    
    class Meta:
        model = Departement
        fields = ('id', 'nom', 'etablissement', 'etablissement_nom')
