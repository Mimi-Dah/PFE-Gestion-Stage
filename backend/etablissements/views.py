from rest_framework import viewsets, permissions
from .models import Etablissement, Departement
from .serializers import EtablissementSerializer, DepartementSerializer

class EtablissementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Etablissement.objects.all()
    serializer_class = EtablissementSerializer
    permission_classes = [permissions.AllowAny]

class DepartementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Departement.objects.select_related('etablissement').all()
    serializer_class = DepartementSerializer
    permission_classes = [permissions.AllowAny]
