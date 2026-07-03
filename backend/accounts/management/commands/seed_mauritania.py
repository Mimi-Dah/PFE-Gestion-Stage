import datetime

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User, Etudiant, Entreprise, ChefDepartement
from etablissements.models import Etablissement, Departement
from offres.models import OffreDeStage

PASSWORDS = {
    'Étudiant': 'Etudiant@123',
    'Entreprise': 'Entreprise@123',
    'Chef_Departement': 'Chef@123',
    'Admin': 'Admin@123',
}

ETABLISSEMENTS = [
    {
        'nom': "École Supérieure Polytechnique (ESP)",
        'adresse': "Nouakchott, Mauritanie",
        'departements': [
            "Génie Informatique",
            "Génie Civil",
            "Génie Électrique",
            "Génie Mécanique",
            "Génie Des Procédés",
            "Statistique et Science des Données",
        ],
    },
    {
        'nom': "École Nationale Supérieure d'Informatique",
        'adresse': "Nouakchott, Mauritanie",
        'departements': [
            "Génie Logiciel",
            "Intelligence Artificielle",
            "Réseaux et Télécommunications",
            "Systèmes Embarqués",
            "Sécurité Informatique",
        ],
    },
]

ENTREPRISES = [
    {
        'nom': "SNIM - Société Nationale Industrielle et Minière",
        'description': "Leader mauritanien de l'extraction et de l'exportation de minerai de fer, basé à Nouadhibou.",
        'adresse': "Nouadhibou, Mauritanie",
        'telephone': "+222 45 74 51 51",
        'site_web': "https://www.snim.com",
        'nom_contact': "Mohamed Lemine Ould Ahmed",
        'email_contact': "rh@snim-demo.mr",
        'departements': ["Génie Civil", "Génie Mécanique"],
    },
    {
        'nom': "Mauritel",
        'description': "Premier opérateur de télécommunications de Mauritanie, filiale du groupe Maroc Telecom.",
        'adresse': "Nouakchott, Mauritanie",
        'telephone': "+222 45 25 25 25",
        'site_web': "https://www.mauritel.mr",
        'nom_contact': "Aminetou Mint Sidi",
        'email_contact': "recrutement@mauritel-demo.mr",
        'departements': ["Génie Informatique", "Réseaux et Télécommunications"],
    },
    {
        'nom': "Chinguitel",
        'description': "Opérateur de téléphonie mobile et de services internet en Mauritanie.",
        'adresse': "Nouakchott, Mauritanie",
        'telephone': "+222 46 30 00 00",
        'site_web': "https://www.chinguitel.mr",
        'nom_contact': "Sidi Mohamed Ould Cheikh",
        'email_contact': "stages@chinguitel-demo.mr",
        'departements': ["Sécurité Informatique", "Réseaux et Télécommunications"],
    },
    {
        'nom': "SOMELEC - Société Mauritanienne d'Électricité",
        'description': "Société nationale de production, transport et distribution d'électricité en Mauritanie.",
        'adresse': "Nouakchott, Mauritanie",
        'telephone': "+222 45 25 10 10",
        'site_web': "https://www.somelec.mr",
        'nom_contact': "Yahya Ould Mohamed",
        'email_contact': "contact@somelec-demo.mr",
        'departements': ["Génie Électrique"],
    },
    {
        'nom': "SNDE - Société Nationale Des Eaux",
        'description': "Société nationale en charge de la production et de la distribution d'eau potable.",
        'adresse': "Nouakchott, Mauritanie",
        'telephone': "+222 45 29 29 29",
        'site_web': "https://www.snde.mr",
        'nom_contact': "Khadijetou Mint Ahmed",
        'email_contact': "rh@snde-demo.mr",
        'departements': ["Génie Des Procédés", "Génie Civil"],
    },
    {
        'nom': "Mauripost",
        'description': "Opérateur postal national offrant des services financiers et logistiques numériques.",
        'adresse': "Nouakchott, Mauritanie",
        'telephone': "+222 45 25 30 30",
        'site_web': "https://www.mauripost.mr",
        'nom_contact': "Mariem Mint Beyah",
        'email_contact': "stages@mauripost-demo.mr",
        'departements': ["Génie Logiciel"],
    },
    {
        'nom': "BAMIS - Banque Al Wava Mauritanienne Islamique",
        'description': "Banque commerciale mauritanienne spécialisée dans la finance islamique.",
        'adresse': "Nouakchott, Mauritanie",
        'telephone': "+222 45 29 88 88",
        'site_web': "https://www.bamis.mr",
        'nom_contact': "Cheikh Ould Boubacar",
        'email_contact': "recrutement@bamis-demo.mr",
        'departements': ["Statistique et Science des Données", "Intelligence Artificielle"],
    },
    {
        'nom': "Tasiast Mauritanie Limited",
        'description': "Exploitant minier aurifère, l'une des plus grandes mines d'or d'Afrique de l'Ouest.",
        'adresse': "Tasiast, Mauritanie",
        'telephone': "+222 45 29 55 55",
        'site_web': "https://www.tasiast.mr",
        'nom_contact': "Aicha Mint Taleb",
        'email_contact': "hr@tasiast-demo.mr",
        'departements': ["Systèmes Embarqués", "Génie Mécanique"],
    },
]

ETUDIANTS = [
    ("Mohamed Vall", "Ould Sidi Mohamed", "Génie Informatique", "Master 2"),
    ("Fatimetou", "Mint Abdellahi", "Génie Civil", "Licence 3"),
    ("Mohamed Lemine", "Ould Brahim", "Génie Électrique", "Master 1"),
    ("Mariem", "Mint Beyah", "Génie Mécanique", "Licence 3"),
    ("Cheikh", "Ould Boubacar", "Génie Des Procédés", "Master 1"),
    ("Aicha", "Mint Taleb", "Statistique et Science des Données", "Master 2"),
    ("Abdoulaye", "Diallo", "Génie Logiciel", "Master 1"),
    ("Aissata", "Ba", "Intelligence Artificielle", "Master 2"),
    ("Mamadou", "Sy", "Réseaux et Télécommunications", "Licence 3"),
    ("Coumba", "Sow", "Systèmes Embarqués", "Master 1"),
    ("Ousmane", "Kane", "Sécurité Informatique", "Master 2"),
    ("Sidi Mohamed", "Ould Cheikh", "Génie Informatique", "Licence 3"),
    ("Khadijetou", "Mint Ahmed", "Intelligence Artificielle", "Licence 3"),
    ("Yahya", "Ould Mohamed", "Réseaux et Télécommunications", "Master 2"),
    ("Aminetou", "Mint Sidi", "Génie Logiciel", "Master 1"),
]

CHEFS = [
    ("Mohamed", "Ould Abdellahi", "Génie Informatique"),
    ("Zeinabou", "Mint El Waely", "Génie Logiciel"),
]

OFFRE_TITRES = {
    "Génie Informatique": ["Développeur Full-Stack Junior", "Administrateur Systèmes et Bases de Données"],
    "Génie Civil": ["Assistant Ingénieur Génie Civil", "Contrôleur de Travaux BTP"],
    "Génie Électrique": ["Technicien en Distribution Électrique", "Ingénieur Junior Automatismes"],
    "Génie Mécanique": ["Ingénieur Junior Maintenance Mécanique", "Technicien Bureau d'Études Mécanique"],
    "Génie Des Procédés": ["Assistant Ingénieur Procédés Industriels", "Technicien Contrôle Qualité"],
    "Statistique et Science des Données": ["Data Analyst Junior", "Assistant Data Scientist"],
    "Génie Logiciel": ["Développeur Backend Django", "Ingénieur QA / Tests Logiciels"],
    "Intelligence Artificielle": ["Stagiaire Machine Learning", "Assistant Chercheur en IA"],
    "Réseaux et Télécommunications": ["Technicien Réseaux Télécoms", "Administrateur Réseaux Junior"],
    "Systèmes Embarqués": ["Développeur Systèmes Embarqués", "Ingénieur Junior IoT"],
    "Sécurité Informatique": ["Analyste SOC Junior", "Auditeur Sécurité des Systèmes d'Information"],
}

LOCALISATIONS = ["Nouakchott, Mauritanie", "Nouadhibou, Mauritanie", "Rosso, Mauritanie", "Atar, Mauritanie"]


class Command(BaseCommand):
    help = "Wipe the database and reseed it with demo Mauritanian students, companies and internship offers."

    def add_arguments(self, parser):
        parser.add_argument('--no-flush', action='store_true', help="Skip wiping existing data before seeding")

    def handle(self, *args, **options):
        if not options['no_flush']:
            self.stdout.write("Flushing existing data...")
            call_command('flush', interactive=False)

        with transaction.atomic():
            created_users = []

            # --- Établissements & départements ---
            departements_by_nom = {}
            for etab_data in ETABLISSEMENTS:
                etab = Etablissement.objects.create(nom=etab_data['nom'], adresse=etab_data['adresse'])
                for dep_nom in etab_data['departements']:
                    dep = Departement.objects.create(nom=dep_nom, etablissement=etab)
                    departements_by_nom[dep_nom] = dep

            # --- Admin ---
            admin = User.objects.create_superuser(
                courriel='admin@stagepro.mr',
                password=PASSWORDS['Admin'],
                is_verified=True,
            )
            created_users.append(('Admin', 'Admin Système', admin.courriel, PASSWORDS['Admin'], '-'))

            # --- Chefs de département ---
            for i, (prenom, nom, dep_nom) in enumerate(CHEFS, start=1):
                courriel = f"chef{i}@stagepro.mr"
                user = User.objects.create_user(
                    courriel=courriel, password=PASSWORDS['Chef_Departement'],
                    role='Chef_Departement', is_verified=True,
                )
                ChefDepartement.objects.create(
                    user=user, departement=departements_by_nom[dep_nom], nom=nom, prenom=prenom,
                )
                created_users.append(('Chef de Département', f"{prenom} {nom}", courriel, PASSWORDS['Chef_Departement'], dep_nom))

            # --- Entreprises ---
            entreprises_by_dep = {}
            for i, ent_data in enumerate(ENTREPRISES, start=1):
                courriel = f"entreprise{i}@stagepro.mr"
                user = User.objects.create_user(
                    courriel=courriel, password=PASSWORDS['Entreprise'],
                    role='Entreprise', is_verified=True,
                )
                entreprise = Entreprise.objects.create(
                    user=user,
                    nom=ent_data['nom'],
                    description=ent_data['description'],
                    adresse=ent_data['adresse'],
                    telephone=ent_data['telephone'],
                    site_web=ent_data['site_web'],
                    nom_contact=ent_data['nom_contact'],
                    email_contact=ent_data['email_contact'],
                )
                created_users.append(('Entreprise', ent_data['nom'], courriel, PASSWORDS['Entreprise'], ent_data['nom_contact']))
                for dep_nom in ent_data['departements']:
                    entreprises_by_dep.setdefault(dep_nom, []).append(entreprise)

            # --- Étudiants ---
            for i, (prenom, nom, dep_nom, niveau) in enumerate(ETUDIANTS, start=1):
                courriel = f"etudiant{i}@stagepro.mr"
                user = User.objects.create_user(
                    courriel=courriel, password=PASSWORDS['Étudiant'],
                    role='Étudiant', is_verified=True,
                )
                dep = departements_by_nom[dep_nom]
                Etudiant.objects.create(
                    user=user, prenom=prenom, nom=nom,
                    telephone=f"+222 {20000000 + i * 111}",
                    adresse="Nouakchott, Mauritanie",
                    departement=dep,
                    universite=dep.etablissement.nom,
                    specialite=dep_nom,
                    matricule=f"MR{2026}{i:04d}",
                    date_de_naissance=datetime.date(2001, (i % 12) + 1, (i % 27) + 1),
                    niveau_academique=niveau,
                )
                created_users.append(('Étudiant', f"{prenom} {nom}", courriel, PASSWORDS['Étudiant'], f"{dep_nom} ({niveau})"))

            # --- Offres de stage (au moins 2 par département) ---
            today = datetime.date.today()
            offres_count = 0
            for dep_nom, titres in OFFRE_TITRES.items():
                dep = departements_by_nom[dep_nom]
                entreprises = entreprises_by_dep.get(dep_nom)
                if not entreprises:
                    continue
                for idx, titre in enumerate(titres):
                    entreprise = entreprises[idx % len(entreprises)]
                    date_debut = today + datetime.timedelta(days=30 * (idx + 1))
                    date_fin = date_debut + datetime.timedelta(weeks=12)
                    OffreDeStage.objects.create(
                        entreprise=entreprise,
                        departement=dep,
                        titre=titre,
                        description=f"Stage en {dep_nom} au sein de {entreprise.nom}, portant sur des missions concrètes "
                                     f"encadrées par une équipe expérimentée à {LOCALISATIONS[offres_count % len(LOCALISATIONS)]}.",
                        exigences="Étudiant motivé, esprit d'équipe, bonnes bases théoriques dans le domaine.",
                        date_debut=date_debut,
                        date_fin=date_fin,
                        localisation=LOCALISATIONS[offres_count % len(LOCALISATIONS)],
                        teletravail=(offres_count % 3 == 0),
                        domaine=dep_nom,
                        gratification=1500 + (offres_count % 5) * 500,
                        places_disponibles=1 + (offres_count % 3),
                        statut='Active',
                    )
                    offres_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Terminé : {len(ETABLISSEMENTS)} établissements, {len(departements_by_nom)} départements, "
            f"1 admin, {len(CHEFS)} chefs, {len(ENTREPRISES)} entreprises, {len(ETUDIANTS)} étudiants, "
            f"{offres_count} offres créées."
        ))
