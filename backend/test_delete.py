import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from offres.models import OffreDeStage
from accounts.models import Entreprise, User

def test_deletion():
    # Find a user with role Entreprise
    user = User.objects.filter(role='Entreprise').first()
    if not user:
        print("No entreprise user found")
        return
    
    entreprise = user.profil_entreprise
    print(f"Testing deletion for enterprise: {entreprise.nom}")
    
    # Create a dummy offer
    offre = OffreDeStage.objects.create(
        entreprise=entreprise,
        titre="Test Offer for Deletion",
        description="Temp",
        date_debut="2026-05-01",
        date_fin="2026-06-01",
        localisation="Test",
        domaine="IT",
        statut='Active'
    )
    print(f"Created offer ID: {offre.id_offre}")
    
    # Try to delete it via DRF-like logic if possible, or just ORM
    try:
        offre_id = offre.id_offre
        offre.delete()
        print(f"Deleted offer {offre_id} successfully via ORM")
    except Exception as e:
        print(f"Deletion failed: {e}")

if __name__ == "__main__":
    test_deletion()
