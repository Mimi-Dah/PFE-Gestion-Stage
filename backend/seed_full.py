"""
internHub — Données de test complètes
Crée : admin, 5 chefs, 15 étudiants, 6 entreprises, 17 offres,
       26 candidatures, 12 conventions, 3 évaluations, 3 auto-évaluations,
       4 absences.
Génère : ../credentials_test.pdf

Usage:
    cd e:/React-Django-Project-master/PFE/backend
    python seed_full.py
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from django.utils import timezone
from accounts.models import User, Etudiant, Entreprise, ChefDepartement
from etablissements.models import Etablissement, Departement
from offres.models import OffreDeStage
from candidatures.models import Candidature
from conventions.models import ConventionDeStage
from evaluations.models import EvaluationDeStage, AutoEvaluation
from absences.models import Absence

TODAY = date.today()

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_user(email, password, role, is_staff=False, is_superuser=False):
    if User.objects.filter(courriel=email).exists():
        u = User.objects.get(courriel=email)
        print(f"  [exist] {email}")
        return u, False
    u = User.objects.create_user(
        courriel=email, password=password, role=role,
        is_verified=True, is_staff=is_staff, is_superuser=is_superuser,
    )
    print(f"  [creat] {email}")
    return u, True


CREDENTIALS = []   # collected for PDF

def add_cred(role, name, email, password):
    CREDENTIALS.append({'role': role, 'name': name, 'email': email, 'password': password})


# ─────────────────────────────────────────────────────────────────────────────
# Établissement & Départements
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Établissement & Départements ===")
etab, _ = Etablissement.objects.get_or_create(
    nom="École Nationale Supérieure d'Informatique",
    defaults={'adresse': '16 Avenue de Maktar Zerrouki, El-Harrach, Alger'},
)

DEPT_NAMES = [
    "Génie Logiciel",
    "Intelligence Artificielle",
    "Réseaux et Télécommunications",
    "Systèmes Embarqués",
    "Sécurité Informatique",
]
depts = {}
for name in DEPT_NAMES:
    d, created = Departement.objects.get_or_create(nom=name, etablissement=etab)
    depts[name] = d
    print(f"  {'[creat]' if created else '[exist]'} Dept: {name}")


# ─────────────────────────────────────────────────────────────────────────────
# Admin
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Admin ===")
EMAIL_ADMIN, PWD_ADMIN = 'admin@internhub.dz', 'Admin@1234'
admin_user, _ = get_or_create_user(EMAIL_ADMIN, PWD_ADMIN, 'Admin', is_staff=True, is_superuser=True)
add_cred('Admin', 'Administrateur Système', EMAIL_ADMIN, PWD_ADMIN)


# ─────────────────────────────────────────────────────────────────────────────
# Chefs de Département
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Chefs de Département ===")
CHEFS_DATA = [
    ('chef.gl@internhub.dz',  'Chef@1234', 'Benali',   'Karim',   'Génie Logiciel'),
    ('chef.ia@internhub.dz',  'Chef@1234', 'Mansouri', 'Fatima',  'Intelligence Artificielle'),
    ('chef.rt@internhub.dz',  'Chef@1234', 'Hadji',    'Omar',    'Réseaux et Télécommunications'),
    ('chef.se@internhub.dz',  'Chef@1234', 'Bouzid',   'Nadia',   'Systèmes Embarqués'),
    ('chef.si@internhub.dz',  'Chef@1234', 'Ammari',   'Youssef', 'Sécurité Informatique'),
]
chefs = {}   # dept_name -> ChefDepartement instance
for email, pwd, nom, prenom, dept_name in CHEFS_DATA:
    u, created = get_or_create_user(email, pwd, 'Chef_Departement')
    dept = depts[dept_name]
    # ChefDepartement.departement is OneToOne — check both sides
    if not ChefDepartement.objects.filter(user=u).exists():
        # Remove stale chef on this dept if exists (idempotency)
        ChefDepartement.objects.filter(departement=dept).delete()
        chef = ChefDepartement.objects.create(user=u, departement=dept, nom=nom, prenom=prenom)
    else:
        chef = ChefDepartement.objects.get(user=u)
    chefs[dept_name] = chef
    add_cred('Chef de Département', f"{prenom} {nom}", email, pwd)
    print(f"  Chef: {prenom} {nom} -> {dept_name}")


# ─────────────────────────────────────────────────────────────────────────────
# Entreprises
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Entreprises ===")
ENTREPRISES_DATA = [
    (
        'rh@techcorp.dz', 'Ent@1234', 'TechCorp DZ',
        'Leader algérien en développement logiciel et solutions cloud. '
        'Nous accompagnons les entreprises dans leur transformation numérique '
        'avec des équipes expertes en React, Django et DevOps.',
        '42 Boulevard Mohamed V, Alger Centre', '0213 21 55 00 01', 'Sara Hamdi',
    ),
    (
        'rh@sonatrach-digital.dz', 'Ent@1234', 'Sonatrach Digital',
        "Division digitale du groupe Sonatrach dédiée à la modernisation des systèmes "
        "informatiques, à la cybersécurité industrielle et à l'IA appliquée à l'énergie.",
        'Tour Headquarters, Hydra, Alger', '0213 21 55 00 02', 'Mehdi Khaled',
    ),
    (
        'rh@ooredoo.dz', 'Ent@1234', 'Ooredoo Algérie',
        'Opérateur télécom de premier plan en Algérie. Notre pôle IT recrute des '
        'stagiaires talentueux pour travailler sur les réseaux 5G, la data analysis '
        'et le développement mobile.',
        'Immeuble Ooredoo, Chéraga, Alger', '0213 21 55 00 03', 'Lynda Oussama',
    ),
    (
        'rh@cevital.dz', 'Ent@1234', 'Cevital Agro',
        "Groupe industriel privé leader en agroalimentaire et grande distribution "
        "en Algérie. Notre DSI modernise ses systèmes ERP et cherche des profils "
        "en génie logiciel et data engineering.",
        'Zone Industrielle, Béjaïa', '0213 34 55 00 04', 'Rachid Aït Kaci',
    ),
    (
        'rh@serval.dz', 'Ent@1234', 'Serval Systems',
        "Start-up algérienne spécialisée dans les systèmes embarqués, l'IoT industriel "
        "et la robotique. Environnement agile et innovant avec des projets à fort "
        "impact technologique.",
        'Cyber Parc Sidi Abdallah, Alger', '0213 21 55 00 05', 'Imane Ferhat',
    ),
    (
        'rh@nsi.dz', 'Ent@1234', 'NSI Solutions',
        'Cabinet de conseil en cybersécurité et transformation numérique. '
        'Missions : pen-testing, audit de sécurité et mise en conformité RGPD '
        'pour des clients grands comptes.',
        '10 Rue Pasteur, Oran', '0213 41 55 00 06', 'Hamza Bensaid',
    ),
]
entreprises = {}   # nom -> Entreprise instance
for email, pwd, nom, desc, adresse, tel, contact in ENTREPRISES_DATA:
    u, _ = get_or_create_user(email, pwd, 'Entreprise')
    ent, created = Entreprise.objects.get_or_create(
        user=u,
        defaults=dict(nom=nom, description=desc, adresse=adresse,
                      telephone=tel, nom_contact=contact, email_contact=email),
    )
    entreprises[nom] = ent
    add_cred('Entreprise', nom, email, pwd)
    print(f"  {'[creat]' if created else '[exist]'} Entreprise: {nom}")


# ─────────────────────────────────────────────────────────────────────────────
# Étudiants
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Étudiants ===")
STUDENTS_DATA = [
    ('amina.djouder@esi.dz',   'Etu@1234', 'Amina',   'Djouder',   'Génie Logiciel',              'Master 1'),
    ('karim.meziane@esi.dz',   'Etu@1234', 'Karim',   'Meziane',   'Génie Logiciel',              'Master 2'),
    ('sarah.khaldi@esi.dz',    'Etu@1234', 'Sarah',   'Khaldi',    'Intelligence Artificielle',   'Master 1'),
    ('youssef.hamidi@esi.dz',  'Etu@1234', 'Youssef', 'Hamidi',    'Intelligence Artificielle',   'Master 2'),
    ('nadia.cherif@esi.dz',    'Etu@1234', 'Nadia',   'Cherif',    'Réseaux et Télécommunications','Licence 3'),
    ('riad.bouzidi@esi.dz',    'Etu@1234', 'Riad',    'Bouzidi',   'Réseaux et Télécommunications','Master 1'),
    ('leila.morsli@esi.dz',    'Etu@1234', 'Leila',   'Morsli',    'Systèmes Embarqués',          'Master 2'),
    ('tarek.saadi@esi.dz',     'Etu@1234', 'Tarek',   'Saadi',     'Systèmes Embarqués',          'Licence 3'),
    ('hana.tlemcani@esi.dz',   'Etu@1234', 'Hana',    'Tlemcani',  'Sécurité Informatique',       'Master 1'),
    ('bilal.hadjadj@esi.dz',   'Etu@1234', 'Bilal',   'Hadjadj',   'Sécurité Informatique',       'Master 2'),
    ('meryem.benaissa@esi.dz', 'Etu@1234', 'Meryem',  'Benaissa',  'Génie Logiciel',              'Licence 3'),
    ('sofiane.amroun@esi.dz',  'Etu@1234', 'Sofiane', 'Amroun',    'Intelligence Artificielle',   'Licence 3'),
    ('zineb.ziani@esi.dz',     'Etu@1234', 'Zineb',   'Ziani',     'Réseaux et Télécommunications','Master 2'),
    ('omar.fergani@esi.dz',    'Etu@1234', 'Omar',    'Fergani',   'Systèmes Embarqués',          'Master 1'),
    ('asma.boudiaf@esi.dz',    'Etu@1234', 'Asma',    'Boudiaf',   'Sécurité Informatique',       'Licence 3'),
]
PHONES = [f'055500{str(i).zfill(4)}' for i in range(1, 16)]
ADRESSES = [
    '12 Rue des Jasmins, Alger', '8 Cité Universitaire, Alger',
    '5 Avenue Pasteur, Oran', '22 Rue Ibn Badis, Constantine',
    '3 Résidence El Baraka, Annaba', '17 Cité AADL, Sétif',
    '9 Rue Didouche Mourad, Blida', '14 Lotissement Ettafakoul, Tizi Ouzou',
    '6 Boulevard Zighout Youcef, Oran', "2 Rue Larbi Ben M'Hidi, Béjaïa",
    '25 Cité des Pins, Alger', "11 Avenue de l'ALN, Guelma",
    '4 Rue des Martyrs, Skikda', '18 Cité Nouvelle, Tlemcen',
    '7 Rue Ben Boulaid, Batna',
]
students = {}   # email -> Etudiant instance
for idx, (email, pwd, prenom, nom, dept_name, niveau) in enumerate(STUDENTS_DATA):
    u, _ = get_or_create_user(email, pwd, 'Étudiant')
    etu, created = Etudiant.objects.get_or_create(
        user=u,
        defaults=dict(
            prenom=prenom, nom=nom,
            telephone=PHONES[idx], adresse=ADRESSES[idx],
            departement=depts[dept_name], niveau_academique=niveau,
        ),
    )
    students[email] = etu
    add_cred('Étudiant', f"{prenom} {nom}", email, pwd)
    print(f"  {'[creat]' if created else '[exist]'} Étudiant: {prenom} {nom} ({niveau})")


# ─────────────────────────────────────────────────────────────────────────────
# Offres de Stage
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Offres de Stage ===")
# (nom_entreprise, titre, domaine, localisation, semaines, gratif, places, teletravail, statut, desc, exig)
OFFERS_DATA = [
    # ── TechCorp DZ ──────────────────────────────────────────────────────────
    (
        'TechCorp DZ', 'Développeur Full-Stack React/Django',
        'Génie Logiciel', 'Alger Centre', 12, 25000, 2, False, 'Active',
        'Rejoignez TechCorp DZ pour un stage immersif en développement Full-Stack. '
        'Vous travaillerez directement avec nos équipes produit sur des applications '
        'web à fort trafic utilisant React 19, Django REST Framework et PostgreSQL.',
        'Master 1 ou Master 2 en Génie Logiciel. Maîtrise Python, JavaScript, React. '
        'Expérience Git et méthodes agiles souhaitée.',
    ),
    (
        'TechCorp DZ', 'DevOps & Cloud Engineer',
        'Génie Logiciel', 'Alger', 16, 30000, 1, True, 'Active',
        'Stage en ingénierie DevOps au sein de notre équipe infrastructure. '
        'Missions : automatisation CI/CD, containers Docker/Kubernetes, '
        'monitoring avec Prometheus et déploiement AWS.',
        'Master en Génie Logiciel ou Systèmes. Connaissances Linux avancées, Docker, Git.',
    ),
    (
        'TechCorp DZ', 'Développeur Mobile Flutter',
        'Génie Logiciel', 'Alger', 12, 22000, 2, False, 'Active',
        'Développement d\'applications mobiles cross-platform avec Flutter/Dart. '
        'Contribution à notre nouvelle application SaaS B2B destinée aux PME algériennes.',
        'Licence 3 ou Master en Génie Logiciel. Notions Dart ou Flutter. '
        'Portfolio GitHub apprécié.',
    ),
    # ── Sonatrach Digital ────────────────────────────────────────────────────
    (
        'Sonatrach Digital', 'Data Engineer',
        'Intelligence Artificielle', 'Alger', 16, 35000, 1, False, 'Active',
        'Stage en ingénierie de données au sein de la DSI de Sonatrach. '
        'Construction de pipelines ETL, modélisation de data warehouse et '
        'reporting BI pour les opérations pétrolières.',
        'Master en Data Science ou IA. Maîtrise SQL, Python (Pandas, PySpark). '
        'Connaissance Power BI appréciée.',
    ),
    (
        'Sonatrach Digital', 'Ingénieur Machine Learning',
        'Intelligence Artificielle', 'Alger', 20, 40000, 1, False, 'Active',
        'Développement de modèles ML pour la maintenance prédictive des équipements '
        'industriels. Données réelles de capteurs, algorithmes de détection d\'anomalies.',
        'Master 2 en IA ou Data Science. Expertise Python (scikit-learn, TensorFlow ou PyTorch).',
    ),
    (
        'Sonatrach Digital', 'Analyste Cybersécurité SI',
        'Sécurité Informatique', 'Alger', 12, 28000, 2, False, 'Active',
        'Analyse de vulnérabilités, hardening des serveurs Linux, mise en place de '
        'politiques de sécurité et formation des équipes.',
        'Master en Sécurité Informatique. Connaissances OWASP, ISO 27001. '
        'Certification CEH ou OSCP un plus.',
    ),
    # ── Ooredoo Algérie ──────────────────────────────────────────────────────
    (
        'Ooredoo Algérie', 'Ingénieur Réseaux 5G',
        'Réseaux et Télécommunications', 'Chéraga, Alger', 16, 32000, 2, False, 'Active',
        'Participation active à la planification, au déploiement et à '
        "l'optimisation du réseau mobile 5G d'Ooredoo Algérie.",
        'Master en Réseaux et Télécoms. Protocoles LTE/5G NR. Outils de simulation réseau.',
    ),
    (
        'Ooredoo Algérie', 'Développeur Backend Node.js',
        'Génie Logiciel', 'Chéraga, Alger', 12, 24000, 2, True, 'Active',
        'Développement d\'APIs RESTful pour les services internes d\'Ooredoo. '
        'Technologies : Node.js, Express, MongoDB, Redis. Environnement microservices.',
        'Licence 3 ou Master en Génie Logiciel. JavaScript/Node.js, REST APIs, NoSQL.',
    ),
    (
        'Ooredoo Algérie', 'Analyste Big Data Télécom',
        'Intelligence Artificielle', 'Chéraga, Alger', 16, 30000, 1, False, 'Active',
        'Analyse des données de trafic réseau pour optimiser la qualité de service '
        'et anticiper les congestions. Hadoop, Spark et outils de visualisation.',
        'Master en Data Science ou Réseaux. Expérience Hadoop/Spark. Python et SQL.',
    ),
    # ── Cevital Agro ─────────────────────────────────────────────────────────
    (
        'Cevital Agro', 'Développeur ERP SAP',
        'Génie Logiciel', 'Béjaïa', 12, 20000, 2, False, 'Active',
        'Développement de modules SAP et intégration de systèmes ERP. '
        'Participation à la migration vers SAP S/4HANA.',
        'Master en Génie Logiciel ou SI. Notions SAP ABAP appréciées.',
    ),
    (
        'Cevital Agro', 'Data Analyst Supply Chain',
        'Intelligence Artificielle', 'Béjaïa', 16, 25000, 1, False, 'Active',
        'Analyse et optimisation de la chaîne d\'approvisionnement par la data. '
        'Création de tableaux de bord, modélisation prédictive des stocks.',
        'Master en Data Science ou Logistique/IA. Python, Excel avancé, Power BI.',
    ),
    # ── Serval Systems ───────────────────────────────────────────────────────
    (
        'Serval Systems', 'Ingénieur Systèmes Embarqués STM32',
        'Systèmes Embarqués', 'Sidi Abdallah, Alger', 12, 22000, 2, False, 'Active',
        'Développement firmware C/C++ sur microcontrôleurs STM32, intégration '
        'capteurs et communication sans fil BLE/LoRa pour applications IoT industrielles.',
        'Licence 3 ou Master en SE ou Électronique. Maîtrise C/C++ embarqué, STM32CubeIDE.',
    ),
    (
        'Serval Systems', 'Développeur IoT & Cloud',
        'Systèmes Embarqués', 'Sidi Abdallah, Alger', 16, 26000, 1, True, 'Active',
        'Développement de la plateforme cloud de supervision IoT de Serval. '
        'Intégration données capteurs via MQTT, dashboard React, backend Python/FastAPI.',
        'Master en SE ou Génie Logiciel. Connaissances MQTT, Python, protocoles IoT.',
    ),
    (
        'Serval Systems', 'Ingénieur FPGA & Traitement Signal',
        'Systèmes Embarqués', 'Sidi Abdallah, Alger', 20, 35000, 1, False, 'Active',
        'Conception FPGA pour traitement du signal temps réel. '
        'VHDL/Verilog sur cartes Xilinx, implémentation de filtres numériques.',
        'Master 2 en SE ou Electronique. Maîtrise VHDL/Verilog, Vivado. DSP.',
    ),
    # ── NSI Solutions ────────────────────────────────────────────────────────
    (
        'NSI Solutions', 'Consultant Cybersécurité Junior',
        'Sécurité Informatique', 'Oran', 12, 22000, 2, False, 'Active',
        'Tests de pénétration web et réseau, rédaction de rapports d\'audit, '
        'sensibilisation des clients aux bonnes pratiques RGPD.',
        'Master en Sécurité Informatique. Kali Linux, Burp Suite, Metasploit.',
    ),
    (
        'NSI Solutions', 'Pentester Web & API',
        'Sécurité Informatique', 'Oran', 8, 18000, 3, False, 'Active',
        'Stage intensif en tests d\'intrusion web et APIs REST. '
        'Intégration équipe red team, audits dans un cadre légal et contractuel.',
        'Licence 3 ou Master en Sécurité Informatique. OWASP Top 10, HTTP, fuzzing.',
    ),
    (
        'NSI Solutions', 'Analyste SOC & Threat Intelligence',
        'Sécurité Informatique', 'Oran', 16, 27000, 1, False, 'Active',
        'Surveillance des alertes SIEM, analyse de malwares, threat hunting et '
        'rédaction d\'indicateurs de compromission (IOC).',
        'Master en Sécurité Informatique. Splunk ou ELK Stack. Forensique basique.',
    ),
]

offres = {}   # titre -> OffreDeStage instance
for nom_ent, titre, domaine, loc, semaines, grat, places, teletravail, statut, desc, exig in OFFERS_DATA:
    ent = entreprises[nom_ent]
    start = TODAY - timedelta(weeks=semaines // 2)
    end   = start + timedelta(weeks=semaines + 4)
    offre, created = OffreDeStage.objects.get_or_create(
        titre=titre,
        entreprise=ent,
        defaults=dict(
            description=desc, exigences=exig, domaine=domaine,
            localisation=loc, gratification=grat,
            places_disponibles=places, teletravail=teletravail,
            date_debut=start, date_fin=end, statut=statut,
        ),
    )
    offres[titre] = offre
    print(f"  {'[creat]' if created else '[exist]'} Offre: {titre[:50]}")


# ─────────────────────────────────────────────────────────────────────────────
# Candidatures
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Candidatures ===")
# (email_etudiant, titre_offre, statut)
CANDS_DATA = [
    ('amina.djouder@esi.dz',   'Développeur Full-Stack React/Django',  'Stage_actif'),
    ('amina.djouder@esi.dz',   'Développeur Mobile Flutter',           'En_attente'),
    ('karim.meziane@esi.dz',   'DevOps & Cloud Engineer',              'Stage_actif'),
    ('karim.meziane@esi.dz',   'Développeur Full-Stack React/Django',  'Refusée'),
    ('sarah.khaldi@esi.dz',    'Ingénieur Machine Learning',           'Stage_actif'),
    ('sarah.khaldi@esi.dz',    'Data Engineer',                        'Acceptée'),
    ('youssef.hamidi@esi.dz',  'Data Engineer',                        'Terminé'),
    ('youssef.hamidi@esi.dz',  'Analyste Big Data Télécom',            'En_attente'),
    ('nadia.cherif@esi.dz',    'Ingénieur Réseaux 5G',                 'Stage_actif'),
    ('nadia.cherif@esi.dz',    'Analyste Big Data Télécom',            'Refusée'),
    ('riad.bouzidi@esi.dz',    'Ingénieur Réseaux 5G',                 'Convention_en_cours'),
    ('riad.bouzidi@esi.dz',    'Développeur Backend Node.js',          'En_attente'),
    ('leila.morsli@esi.dz',    'Ingénieur Systèmes Embarqués STM32',   'Terminé'),
    ('leila.morsli@esi.dz',    'Développeur IoT & Cloud',              'En_attente'),
    ('tarek.saadi@esi.dz',     'Ingénieur Systèmes Embarqués STM32',   'Stage_actif'),
    ('tarek.saadi@esi.dz',     'Ingénieur FPGA & Traitement Signal',   'Refusée'),
    ('hana.tlemcani@esi.dz',   'Consultant Cybersécurité Junior',      'Stage_actif'),
    ('hana.tlemcani@esi.dz',   'Analyste SOC & Threat Intelligence',   'Acceptée'),
    ('bilal.hadjadj@esi.dz',   'Pentester Web & API',                  'Terminé'),
    ('bilal.hadjadj@esi.dz',   'Analyste Cybersécurité SI',            'Convention_en_cours'),
    ('meryem.benaissa@esi.dz', 'Développeur Mobile Flutter',           'En_attente'),
    ('meryem.benaissa@esi.dz', 'Développeur ERP SAP',                  'En_attente'),
    ('sofiane.amroun@esi.dz',  'Data Analyst Supply Chain',            'Acceptée'),
    ('zineb.ziani@esi.dz',     'Ingénieur Réseaux 5G',                 'En_attente'),
    ('omar.fergani@esi.dz',    'Développeur IoT & Cloud',              'Stage_actif'),
    ('asma.boudiaf@esi.dz',    'Pentester Web & API',                  'En_attente'),
]

LETTRES = [
    "Motivé(e) par le développement web moderne et les défis techniques.",
    "Souhait d'élargir mes compétences dans ce domaine clé.",
    "Passionné(e) par l'automatisation et les nouvelles technologies.",
    "Candidature dans le cadre de mon projet de fin d'études.",
    "Désir d'appliquer mes connaissances théoriques en situation réelle.",
    "Fort intérêt pour l'écosystème open-source et les méthodologies agiles.",
    "Expérience personnelle de projets similaires sur GitHub.",
    "Attrait pour le travail en équipe et la résolution de problèmes complexes.",
]

cands = {}   # (email, titre) -> Candidature instance
for i, (email, titre, statut) in enumerate(CANDS_DATA):
    etu = students[email]
    offre = offres[titre]
    lettre = LETTRES[i % len(LETTRES)]
    cand, created = Candidature.objects.get_or_create(
        etudiant=etu, offre=offre,
        defaults=dict(statut=statut, texte_lettre_motivation=lettre),
    )
    if not created and cand.statut != statut:
        cand.statut = statut
        cand.save()
    cands[(email, titre)] = cand
    print(f"  {'[creat]' if created else '[exist]'} {email.split('@')[0]} -> {titre[:35]} ({statut})")


# ─────────────────────────────────────────────────────────────────────────────
# Conventions
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Conventions ===")
# (email, titre, statut_conv, numero, chef_dept_name_or_None)
CONVS_DATA = [
    ('amina.djouder@esi.dz',  'Développeur Full-Stack React/Django',  'Validée',               'CONV-2026-001', 'Génie Logiciel'),
    ('karim.meziane@esi.dz',  'DevOps & Cloud Engineer',              'Validée',               'CONV-2026-002', 'Génie Logiciel'),
    ('sarah.khaldi@esi.dz',   'Ingénieur Machine Learning',           'Validée',               'CONV-2026-003', 'Intelligence Artificielle'),
    ('youssef.hamidi@esi.dz', 'Data Engineer',                        'Validée',               'CONV-2026-004', 'Intelligence Artificielle'),
    ('nadia.cherif@esi.dz',   'Ingénieur Réseaux 5G',                 'Validée',               'CONV-2026-005', 'Réseaux et Télécommunications'),
    ('riad.bouzidi@esi.dz',   'Ingénieur Réseaux 5G',                 'En_attente_validation', 'CONV-2026-006', None),
    ('leila.morsli@esi.dz',   'Ingénieur Systèmes Embarqués STM32',   'Validée',               'CONV-2026-007', 'Systèmes Embarqués'),
    ('tarek.saadi@esi.dz',    'Ingénieur Systèmes Embarqués STM32',   'Validée',               'CONV-2026-008', 'Systèmes Embarqués'),
    ('hana.tlemcani@esi.dz',  'Consultant Cybersécurité Junior',      'Validée',               'CONV-2026-009', 'Sécurité Informatique'),
    ('bilal.hadjadj@esi.dz',  'Pentester Web & API',                  'Validée',               'CONV-2026-010', 'Sécurité Informatique'),
    ('bilal.hadjadj@esi.dz',  'Analyste Cybersécurité SI',            'En_attente_validation', 'CONV-2026-011', None),
    ('omar.fergani@esi.dz',   'Développeur IoT & Cloud',              'Validée',               'CONV-2026-012', 'Systèmes Embarqués'),
]
for email, titre, statut_conv, numero, chef_dept in CONVS_DATA:
    cand = cands.get((email, titre))
    if not cand:
        print(f"  [skip] Convention {numero} — candidature introuvable")
        continue
    chef_obj = chefs.get(chef_dept) if chef_dept else None
    valide_at = timezone.now() if statut_conv == 'Validée' else None
    conv, created = ConventionDeStage.objects.get_or_create(
        numero_convention=numero,
        defaults=dict(
            candidature=cand,
            statut=statut_conv,
            valide_par_chef_departement=chef_obj,
            date_validation=valide_at,
            signe_par_etudiant_le=valide_at,
            signe_par_entreprise_le=valide_at,
        ),
    )
    print(f"  {'[creat]' if created else '[exist]'} {numero}: {statut_conv}")


# ─────────────────────────────────────────────────────────────────────────────
# Évaluations d'entreprise
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Évaluations ===")
EVALS_DATA = [
    # (email, titre, nom_ent, c, a, e, q, reco, commentaire)
    (
        'youssef.hamidi@esi.dz', 'Data Engineer', 'Sonatrach Digital',
        5, 4, 5, 4, 'Oui',
        'Étudiant très sérieux et force de proposition. Maîtrise parfaite de Python et SQL.',
    ),
    (
        'leila.morsli@esi.dz', 'Ingénieur Systèmes Embarqués STM32', 'Serval Systems',
        4, 5, 4, 5, 'Oui',
        'Excellente maîtrise du C embarqué. A livré un firmware complet sans supervision.',
    ),
    (
        'bilal.hadjadj@esi.dz', 'Pentester Web & API', 'NSI Solutions',
        5, 5, 4, 5, 'Oui',
        'Niveau exceptionnel pour un stagiaire. A découvert 3 vulnérabilités critiques. Embauche envisagée.',
    ),
]
for email, titre, nom_ent, c, a, e, q, reco, comm in EVALS_DATA:
    etu = students[email]
    offre = offres[titre]
    ent = entreprises[nom_ent]
    eval_obj, created = EvaluationDeStage.objects.get_or_create(
        entreprise=ent, etudiant=etu, offre=offre,
        defaults=dict(comportement=c, adaptabilite=a, travail_equipe=e,
                      qualite_travail=q, recommanderait=reco, commentaires=comm),
    )
    print(f"  {'[creat]' if created else '[exist]'} Eval: {email.split('@')[0]} par {nom_ent} -> note {eval_obj.note_globale}/20")


# ─────────────────────────────────────────────────────────────────────────────
# Auto-Évaluations
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Auto-Évaluations ===")
AUTO_EVALS_DATA = [
    (
        'youssef.hamidi@esi.dz', 'Data Engineer',
        4, 4, 5, 4,
        'Stage très enrichissant. J\'ai pu appliquer mes connaissances en Python '
        'sur des problèmes industriels réels.',
    ),
    (
        'leila.morsli@esi.dz', 'Ingénieur Systèmes Embarqués STM32',
        4, 5, 4, 5,
        'Environnement stimulant. Montée en compétences rapide sur STM32 et BLE.',
    ),
    (
        'bilal.hadjadj@esi.dz', 'Pentester Web & API',
        5, 5, 4, 5,
        'Stage de haut niveau. Décortiquer des vulnérabilités réelles est une '
        'expérience irremplaçable.',
    ),
]
for email, titre, c, a, e, q, comm in AUTO_EVALS_DATA:
    etu = students[email]
    offre = offres[titre]
    ae, created = AutoEvaluation.objects.get_or_create(
        etudiant=etu, offre=offre,
        defaults=dict(comportement=c, adaptabilite=a, travail_equipe=e,
                      qualite_travail=q, commentaires=comm),
    )
    print(f"  {'[creat]' if created else '[exist]'} Auto-eval: {email.split('@')[0]} -> note {ae.note_globale}/20")


# ─────────────────────────────────────────────────────────────────────────────
# Absences
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Absences ===")
ABSENCES_DATA = [
    ('amina.djouder@esi.dz',  'Développeur Full-Stack React/Django',  TODAY - timedelta(days=8),  'Absence non signalée mardi matin.',    'Justifiée'),
    ('nadia.cherif@esi.dz',   'Ingénieur Réseaux 5G',                 TODAY - timedelta(days=4),  'Retard de 2h à la réunion hebdomadaire.','Signaler'),
    ('tarek.saadi@esi.dz',    'Ingénieur Systèmes Embarqués STM32',   TODAY - timedelta(days=12), 'Journée entière non justifiée.',        'Non_justifiée'),
    ('omar.fergani@esi.dz',   'Développeur IoT & Cloud',              TODAY - timedelta(days=3),  'Demi-journée manquante sans préavis.',  'Signaler'),
]
for email, titre, date_abs, motif, statut_abs in ABSENCES_DATA:
    cand = cands.get((email, titre))
    if not cand:
        print(f"  [skip] Absence — candidature introuvable")
        continue
    absence, created = Absence.objects.get_or_create(
        candidature=cand, date_absence=date_abs,
        defaults=dict(motif_signalement=motif, statut=statut_abs),
    )
    print(f"  {'[creat]' if created else '[exist]'} Absence: {email.split('@')[0]} le {date_abs} ({statut_abs})")


# ─────────────────────────────────────────────────────────────────────────────
# Génération PDF des identifiants
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Génération du PDF ===")

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, KeepTogether,
    )
    from reportlab.lib.enums import TA_CENTER

    PDF_PATH = os.path.join(os.path.dirname(__file__), '..', 'credentials_test.pdf')
    PDF_PATH = os.path.abspath(PDF_PATH)

    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # ── Custom styles ──────────────────────────────────────────────────────
    BLUE    = colors.HexColor('#2563EB')
    BLUE_LT = colors.HexColor('#EFF6FF')
    SLATE   = colors.HexColor('#0F172A')
    MUTED   = colors.HexColor('#64748B')
    SUCCESS = colors.HexColor('#10B981')
    ORANGE  = colors.HexColor('#F59E0B')
    PURPLE  = colors.HexColor('#6366F1')
    RED     = colors.HexColor('#EF4444')

    h1 = ParagraphStyle('H1', fontSize=22, leading=28, textColor=SLATE,
                         fontName='Helvetica-Bold', alignment=TA_CENTER)
    h2 = ParagraphStyle('H2', fontSize=13, leading=18, textColor=BLUE,
                         fontName='Helvetica-Bold', spaceAfter=4)
    sub = ParagraphStyle('Sub', fontSize=10, leading=14, textColor=MUTED,
                          fontName='Helvetica', alignment=TA_CENTER)
    normal = ParagraphStyle('N', fontSize=9, leading=13, textColor=SLATE,
                              fontName='Helvetica')
    warning_style = ParagraphStyle('Warn', fontSize=9, leading=13, textColor=MUTED,
                                    fontName='Helvetica-Oblique', alignment=TA_CENTER)

    ROLE_COLOR = {
        'Admin':              BLUE,
        'Chef de Département': PURPLE,
        'Entreprise':         ORANGE,
        'Étudiant':           SUCCESS,
    }

    def role_pill_color(role):
        return ROLE_COLOR.get(role, MUTED)

    # ── Table helper ───────────────────────────────────────────────────────
    def make_section(title, rows, color):
        elems = []
        elems.append(Paragraph(title, h2))
        elems.append(HRFlowable(width='100%', thickness=1, color=color, spaceAfter=6))

        col_widths = [3.5*cm, 5*cm, 6.5*cm, 3*cm]
        header = [
            Paragraph('<b>Nom complet</b>', normal),
            Paragraph('<b>Courriel</b>', normal),
            Paragraph('<b>Mot de passe</b>', normal),
            Paragraph('<b>Rôle</b>', normal),
        ]
        table_data = [header]
        for r in rows:
            table_data.append([
                Paragraph(r['name'], normal),
                Paragraph(r['email'], normal),
                Paragraph(f"<font name='Courier'>{r['password']}</font>", normal),
                Paragraph(r['role'], normal),
            ])

        tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(TableStyle([
            ('BACKGROUND',  (0, 0), (-1, 0),  color),
            ('TEXTCOLOR',   (0, 0), (-1, 0),  colors.white),
            ('FONTNAME',    (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('FONTSIZE',    (0, 0), (-1, -1), 8.5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID',        (0, 0), (-1, -1), 0.4, colors.HexColor('#E2E8F0')),
            ('LEFTPADDING',  (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING',   (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING',(0, 0), (-1, -1), 5),
            ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elems.append(tbl)
        elems.append(Spacer(1, 0.5*cm))
        return KeepTogether(elems)

    # ── Collect by role ────────────────────────────────────────────────────
    by_role = {}
    for c in CREDENTIALS:
        by_role.setdefault(c['role'], []).append(c)

    # ── Build document ─────────────────────────────────────────────────────
    story = []

    # Cover header
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('internHub', h1))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph('Identifiants de test — Données de démonstration', sub))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(f'Généré le {TODAY.strftime("%d/%m/%Y")}  ·  {sum(len(v) for v in by_role.values())} comptes', sub))
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width='100%', thickness=2, color=BLUE, spaceAfter=12))

    # Warning
    story.append(Paragraph(
        '⚠ Ces identifiants sont destinés exclusivement à des environnements de développement et de test. '
        'Ne jamais utiliser en production.',
        warning_style,
    ))
    story.append(Spacer(1, 0.6*cm))

    # Sections in order
    SECTION_ORDER = [
        ('Admin',              'Administrateur Système',     BLUE),
        ('Chef de Département','Chefs de Département',       PURPLE),
        ('Entreprise',         'Entreprises partenaires',    ORANGE),
        ('Étudiant',           'Étudiants',                  SUCCESS),
    ]
    for role_key, section_title, color in SECTION_ORDER:
        rows = by_role.get(role_key, [])
        if rows:
            story.append(make_section(section_title, rows, color))

    # Summary footer
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=8))
    story.append(Paragraph(
        f'Total : {len(by_role.get("Admin", []))} admin  ·  '
        f'{len(by_role.get("Chef de Département", []))} chefs  ·  '
        f'{len(by_role.get("Entreprise", []))} entreprises  ·  '
        f'{len(by_role.get("Étudiant", []))} étudiants',
        sub,
    ))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph('Plate-forme internHub — Gestion de stages universitaires', warning_style))

    doc.build(story)
    print(f"  [OK] PDF genere : {PDF_PATH}")

except Exception as e:
    print(f"  [ERR] PDF : {e}")

print("\n[OK] Seed complet termine.")
print(f"  • {len(CREDENTIALS)} comptes créés")
print(f"  • {len(offres)} offres de stage")
print(f"  • {len(cands)} candidatures")
