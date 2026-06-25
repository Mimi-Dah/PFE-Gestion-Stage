"""
Run with: python seed_data.py
Seeds: établissement, départements, admin user, chef de département, demo users.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from etablissements.models import Etablissement, Departement
from accounts.models import ChefDepartement

User = get_user_model()

# ── Établissement ────────────────────────────────────────────────────────────
etab, _ = Etablissement.objects.get_or_create(
    nom="École Nationale Supérieure d'Informatique",
    defaults={'adresse': '1 Rue de l\'Université, Alger'}
)

# ── Départements ─────────────────────────────────────────────────────────────
dept_names = [
    "Génie Logiciel",
    "Intelligence Artificielle",
    "Réseaux et Télécommunications",
    "Systèmes Embarqués",
    "Sécurité Informatique",
]
depts = {}
for name in dept_names:
    d, _ = Departement.objects.get_or_create(nom=name, etablissement=etab)
    depts[name] = d
    print(f"  Dept: {name}")

# ── Admin ─────────────────────────────────────────────────────────────────────
if not User.objects.filter(courriel='admin@internhub.dz').exists():
    User.objects.create_user(
        courriel='admin@internhub.dz',
        password='Admin@1234',
        role='Admin',
        is_verified=True,
        is_staff=True,
        is_superuser=True,
    )
    print("  Admin: admin@internhub.dz / Admin@1234")
else:
    print("  Admin already exists")

# ── Chef de Département ───────────────────────────────────────────────────────
if not User.objects.filter(courriel='chef.gl@internhub.dz').exists():
    chef_user = User.objects.create_user(
        courriel='chef.gl@internhub.dz',
        password='Chef@1234',
        role='Chef_Departement',
        is_verified=True,
    )
    ChefDepartement.objects.create(
        user=chef_user,
        departement=depts["Génie Logiciel"],
        nom='Benali',
        prenom='Karim',
    )
    print("  Chef: chef.gl@internhub.dz / Chef@1234  (Génie Logiciel)")
else:
    print("  Chef already exists")

# ── Demo Étudiant ─────────────────────────────────────────────────────────────
from accounts.models import Etudiant
if not User.objects.filter(courriel='etudiant@internhub.dz').exists():
    etu_user = User.objects.create_user(
        courriel='etudiant@internhub.dz',
        password='Etu@1234',
        role='Étudiant',
        is_verified=True,
    )
    Etudiant.objects.create(
        user=etu_user,
        prenom='Amina',
        nom='Djouder',
        telephone='0555000001',
        adresse='12 Rue des Jasmins, Alger',
        departement=depts["Génie Logiciel"],
        niveau_academique='Master 1',
    )
    print("  Étudiant: etudiant@internhub.dz / Etu@1234")
else:
    print("  Étudiant already exists")

# ── Demo Entreprise ────────────────────────────────────────────────────────────
from accounts.models import Entreprise
if not User.objects.filter(courriel='rh@techcorp.dz').exists():
    ent_user = User.objects.create_user(
        courriel='rh@techcorp.dz',
        password='Ent@1234',
        role='Entreprise',
        is_verified=True,
    )
    Entreprise.objects.create(
        user=ent_user,
        nom='TechCorp DZ',
        description='Société spécialisée en développement logiciel et solutions numériques. '
                    'Nous offrons des stages de qualité à nos jeunes talents.',
        adresse='42 Boulevard Mohamed V, Alger',
        telephone='0213000000',
        nom_contact='Sara Hamdi',
        email_contact='rh@techcorp.dz',
    )
    print("  Entreprise: rh@techcorp.dz / Ent@1234")
else:
    print("  Entreprise already exists")

print("\nSeed complete.")
