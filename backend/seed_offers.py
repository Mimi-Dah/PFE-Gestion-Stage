# -*- coding: utf-8 -*-
"""
Run with: python seed_offers.py
Seeds 3 demo internship offers for TechCorp DZ.
"""
import os, django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from accounts.models import Entreprise
from offres.models import OffreDeStage

try:
    entreprise = Entreprise.objects.get(user__courriel='rh@techcorp.dz')
except Entreprise.DoesNotExist:
    print("Entreprise not found. Run seed_data.py first.")
    exit(1)

today = date.today()
end = today + timedelta(weeks=16)

offers = [
    dict(
        titre="Développeur Full-Stack (Stage)",
        description=(
            "Rejoignez TechCorp DZ pour un stage en développement Full-Stack. "
            "Vous travaillerez sur des projets React et Django en collaboration "
            "directe avec nos équipes produit et design."
        ),
        exigences=(
            "Master 1 ou Master 2 en Génie Logiciel. "
            "Maîtrise de Python, JavaScript, React. Autonomie et esprit d'équipe requis."
        ),
        domaine="Génie Logiciel",
        localisation="Alger Centre",
        duree_semaines=12,
        gratification=25000,
        places_disponibles=2,
        teletravail=False,
        date_debut=today,
        date_fin=end,
        statut='Active',
    ),
    dict(
        titre="Data Scientist Junior (Stage)",
        description=(
            "Stage en Data Science au sein de l'équipe analytics de TechCorp. "
            "Vous analyserez des données réelles et construirez des modèles de Machine Learning "
            "pour des problèmes métiers concrets."
        ),
        exigences=(
            "Master 1 ou Master 2 en Intelligence Artificielle ou Data Science. "
            "Connaissances en Python, Pandas, Scikit-learn et visualisation de données."
        ),
        domaine="Intelligence Artificielle",
        localisation="Alger",
        duree_semaines=16,
        gratification=30000,
        places_disponibles=1,
        teletravail=True,
        date_debut=today,
        date_fin=end,
        statut='Active',
    ),
    dict(
        titre="Ingénieur Cybersécurité (Stage)",
        description=(
            "Stage en sécurité informatique chez TechCorp DZ. "
            "Missions : audit de sécurité, tests de pénétration, et mise en œuvre "
            "des meilleures pratiques de sécurité sur nos infrastructures."
        ),
        exigences=(
            "Licence 3 ou Master en Sécurité Informatique ou Réseaux. "
            "Connaissances en Linux, réseaux TCP/IP, bases de cryptographie."
        ),
        domaine="Sécurité Informatique",
        localisation="Alger",
        duree_semaines=8,
        gratification=20000,
        places_disponibles=3,
        teletravail=False,
        date_debut=today,
        date_fin=end,
        statut='Active',
    ),
]

for o in offers:
    offre, created = OffreDeStage.objects.get_or_create(
        titre=o['titre'],
        entreprise=entreprise,
        defaults=o,
    )
    print(f"  {'Created' if created else 'Exists'}: {offre.titre} (id={offre.id_offre})")

print("\nOffers seeded.")
