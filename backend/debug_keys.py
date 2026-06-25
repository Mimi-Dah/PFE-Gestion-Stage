import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from offres.models import OffreDeStage
from offres.serializers import OffreDeStageSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def debug_serializer():
    offre = OffreDeStage.objects.first()
    if not offre:
        print("No offers found to debug")
        return
    
    serializer = OffreDeStageSerializer(offre)
    print("Serialized data keys:")
    print(json.dumps(list(serializer.data.keys()), indent=2))
    print("Full serialized data sample:")
    # Print only first few fields for brevity but include PK
    data = serializer.data
    print(json.dumps({k: data[k] for k in list(data.keys())[:5]}, indent=2))
    if 'id' in data:
        print(f"'id' value: {data['id']}")
    if 'id_offre' in data:
        print(f"'id_offre' value: {data['id_offre']}")

if __name__ == "__main__":
    debug_serializer()
