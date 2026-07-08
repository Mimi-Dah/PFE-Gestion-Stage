"""
internHub — Données de test (Mauritanie)
Vide entièrement les tables métier puis recrée :
    1 admin, 5 chefs de département, 15 étudiants, 6 entreprises, 17 offres,
    26 candidatures, 12 conventions, 3 évaluations, 3 auto-évaluations, 4 absences.
Toutes les adresses courriel sont au format prenom.nom@gmail.com.
Génère : ../credentials_mauritanie.pdf

Usage:
    cd e:/React-Django-Project-master/PFE/backend
    python seed_mauritania.py
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from django.utils import timezone
from accounts.models import User, Etudiant, Entreprise, ChefDepartement
from etablissements.models import Etablissement, Departement
from offres.models import OffreDeStage, Favori
from candidatures.models import Candidature
from conventions.models import ConventionDeStage
from evaluations.models import EvaluationDeStage, AutoEvaluation
from absences.models import Absence
from notifications.models import Notification

TODAY = date.today()

# ─────────────────────────────────────────────────────────────────────────────
# Purge des données existantes
# ─────────────────────────────────────────────────────────────────────────────

print("=== Purge des données existantes ===")
for model in (Absence, EvaluationDeStage, AutoEvaluation, ConventionDeStage,
              Candidature, Favori, Notification, OffreDeStage,
              Etudiant, Entreprise, ChefDepartement, Departement, Etablissement, User):
    count, _ = model.objects.all().delete()
    print(f"  [del] {model.__name__}: {count}")


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
    nom="École Supérieure Polytechnique de Nouakchott",
    defaults={'adresse': 'Ilot K, Tevragh Zeina, Nouakchott, Mauritanie'},
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
EMAIL_ADMIN, PWD_ADMIN = 'admin@gmail.com', 'Admin@1234'
admin_user, _ = get_or_create_user(EMAIL_ADMIN, PWD_ADMIN, 'Admin', is_staff=True, is_superuser=True)
add_cred('Admin', 'Administrateur Système', EMAIL_ADMIN, PWD_ADMIN)


# ─────────────────────────────────────────────────────────────────────────────
# Chefs de Département
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Chefs de Département ===")
CHEFS_DATA = [
    ('chefMohamed@gmail.com',   'Chef@1234', 'Vall',          'Mohamed',   'Génie Logiciel'),
    ('chefFatimetou@gmail.com', 'Chef@1234', 'Mint Sidi',     'Fatimetou', 'Intelligence Artificielle'),
    ('chefSidiAhmed@gmail.com', 'Chef@1234', 'Taleb',         'Sidi Ahmed','Réseaux et Télécommunications'),
    ('chefMariem@gmail.com',    'Chef@1234', 'Mint Abdallahi','Mariem',    'Systèmes Embarqués'),
    ('chefAbdoulaye@gmail.com', 'Chef@1234', 'Ba',            'Abdoulaye', 'Sécurité Informatique'),
]
chefs = {}   # dept_name -> ChefDepartement instance
for email, pwd, nom, prenom, dept_name in CHEFS_DATA:
    u, created = get_or_create_user(email, pwd, 'Chef_Departement')
    dept = depts[dept_name]
    if not ChefDepartement.objects.filter(user=u).exists():
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
        'SNIM@gmail.com', 'Ent@1234', 'SNIM',
        "Société Nationale Industrielle et Minière, premier employeur privé de Mauritanie. "
        "Nous exploitons les gisements de fer de la Kediat Ijill et modernisons nos systèmes "
        "d'automatisation ferroviaire et industrielle.",
        'Zone Portuaire, Nouadhibou, Mauritanie', '+222 45 74 50 01', 'Mohamed Beibacar',
    ),
    (
        'Mauritel@gmail.com', 'Ent@1234', 'Mauritel',
        "Opérateur historique de télécommunications en Mauritanie, filiale du groupe Maroc Telecom. "
        "Notre pôle IT recrute des stagiaires pour nos projets réseaux mobiles, data et applications client.",
        'Avenue Gamal Abdel Nasser, Nouakchott, Mauritanie', '+222 45 29 10 02', 'Aminetou Diagana',
    ),
    (
        'Chinguitel@gmail.com', 'Ent@1234', 'Chinguitel',
        "Opérateur télécom mauritanien du groupe Sudatel. Nous développons des services "
        "mobiles innovants et recherchons des talents en développement et cybersécurité.",
        'Ilot V, Tevragh Zeina, Nouakchott, Mauritanie', '+222 45 29 55 03', 'Sidiya Ndiaye',
    ),
    (
        'TasiastMauritanie@gmail.com', 'Ent@1234', 'Tasiast Mauritanie',
        "Filiale de Kinross Gold exploitant la mine d'or de Tasiast à Akjoujt. "
        "Nous investissons dans l'IoT industriel et la maintenance prédictive assistée par IA.",
        'Route d\'Akjoujt, Nouakchott, Mauritanie', '+222 45 25 60 04', 'Lemrabott Jiddou',
    ),
    (
        'SMH@gmail.com', 'Ent@1234', 'SMH',
        "Société Mauritanienne des Hydrocarbures, en charge du développement des ressources "
        "pétrolières et gazières nationales. Nous cherchons des profils en data et cybersécurité.",
        'Ksar, Nouakchott, Mauritanie', '+222 45 25 70 05', 'Vatimetou Kane',
    ),
    (
        'BanqueGeneraleMauritanie@gmail.com', 'Ent@1234', 'Banque Générale de Mauritanie',
        "Banque commerciale de premier plan accompagnant la transformation digitale du secteur "
        "financier mauritanien : mobile banking, cybersécurité et conformité RGPD.",
        'Avenue Kennedy, Nouakchott, Mauritanie', '+222 45 25 80 06', 'Ahmed Salem Diop',
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
    ('MohamedLemine@gmail.com', 'Etu@1234', 'Mohamed Lemine', 'Ahmed',           'Génie Logiciel',               'Master 1'),
    ('Fatimetou@gmail.com',     'Etu@1234', 'Fatimetou',      'Mint Sidi',       'Génie Logiciel',               'Master 2'),
    ('SidiMohamed@gmail.com',   'Etu@1234', 'Sidi Mohamed',   'Taleb',           'Intelligence Artificielle',    'Master 1'),
    ('Mariem@gmail.com',        'Etu@1234', 'Mariem',         'Mint Abdallahi',  'Intelligence Artificielle',    'Master 2'),
    ('Amadou@gmail.com',        'Etu@1234', 'Amadou',         'Sow',             'Réseaux et Télécommunications','Licence 3'),
    ('CheikhAhmed@gmail.com',   'Etu@1234', 'Cheikh Ahmed',   'Baba',            'Réseaux et Télécommunications','Master 1'),
    ('Khadijetou@gmail.com',    'Etu@1234', 'Khadijetou',     'Mint Brahim',     'Systèmes Embarqués',           'Master 2'),
    ('Moctar@gmail.com',        'Etu@1234', 'Moctar',         'Ould Hamady',     'Systèmes Embarqués',           'Licence 3'),
    ('Aichetou@gmail.com',      'Etu@1234', 'Aichetou',       'Mint Mohamed',    'Sécurité Informatique',        'Master 1'),
    ('Yacoub@gmail.com',        'Etu@1234', 'Yacoub',         'Diallo',          'Sécurité Informatique',        'Master 2'),
    ('Selma@gmail.com',         'Etu@1234', 'Selma',         'Mint Ahmedou',    'Génie Logiciel',               'Licence 3'),
    ('Brahim@gmail.com',        'Etu@1234', 'Brahim',         'Ould Dah',        'Intelligence Artificielle',    'Licence 3'),
    ('Zeinabou@gmail.com',      'Etu@1234', 'Zeinabou',       'Mint Lemrabott',  'Réseaux et Télécommunications','Master 2'),
    ('Abderrahmane@gmail.com',  'Etu@1234', 'Abderrahmane',   'Fall',            'Systèmes Embarqués',           'Master 1'),
    ('Coumba@gmail.com',        'Etu@1234', 'Coumba',         'Kane',            'Sécurité Informatique',        'Licence 3'),
]
PHONES = [f'+222 {20+i} {10+i:02d} {30+i:02d} {40+i:02d}' for i in range(1, 16)]
ADRESSES = [
    'Tevragh Zeina, Nouakchott', 'Ksar, Nouakchott',
    'Sebkha, Nouakchott', 'Centre-ville, Nouadhibou',
    'Kaédi, Gorgol', 'Rosso, Trarza',
    'Atar, Adrar', 'Zouerate, Tiris Zemmour',
    'Kiffa, Assaba', 'Néma, Hodh Ech Chargui',
    'Sélibaby, Guidimaka', 'Aleg, Brakna',
    'Akjoujt, Inchiri', 'Boutilimit, Trarza',
    'Tidjikja, Tagant',
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
            universite="École Supérieure Polytechnique de Nouakchott",
            specialite=dept_name,
            matricule=f"MR{2026}{idx + 1:04d}",
        ),
    )
    if not created and (not etu.specialite or not etu.matricule):
        etu.specialite = etu.specialite or dept_name
        etu.matricule = etu.matricule or f"MR{2026}{idx + 1:04d}"
        etu.save(update_fields=['specialite', 'matricule'])
    students[email] = etu
    add_cred('Étudiant', f"{prenom} {nom}", email, pwd)
    print(f"  {'[creat]' if created else '[exist]'} Étudiant: {prenom} {nom} ({niveau})")


# ─────────────────────────────────────────────────────────────────────────────
# Offres de Stage
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Offres de Stage ===")
# (nom_entreprise, titre, domaine, localisation, semaines, gratif, places, teletravail, statut, desc, exig)
OFFERS_DATA = [
    # ── SNIM ─────────────────────────────────────────────────────────────────
    (
        'SNIM', 'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire',
        'Systèmes Embarqués', 'Nouadhibou', 16, 45000, 1, False, 'Active',
        "Stage au sein de la direction des systèmes miniers de la SNIM. Automatisation des "
        "convoyeurs et supervision SCADA du train minerai le plus long du monde.",
        "Master en Systèmes Embarqués ou Électronique. C/C++, PLC, protocoles industriels.",
    ),
    (
        'SNIM', 'Data Engineer — Exploitation Minière',
        'Intelligence Artificielle', 'Nouadhibou', 16, 40000, 1, False, 'Active',
        "Construction de pipelines de données de production minière et tableaux de bord "
        "décisionnels pour la direction de l'exploitation.",
        "Master en Data Science ou IA. SQL, Python (Pandas), Power BI apprécié.",
    ),
    (
        'SNIM', 'Développeur Full-Stack — Portail RH Interne',
        'Génie Logiciel', 'Nouadhibou', 12, 30000, 2, True, 'Active',
        "Développement du nouveau portail RH self-service pour les 5000 employés du groupe. "
        "Stack React et Django REST Framework.",
        "Master 1 ou 2 en Génie Logiciel. React, Python/Django, Git.",
    ),
    # ── Mauritel ──────────────────────────────────────────────────────────────
    (
        'Mauritel', 'Ingénieur Réseaux 4G/5G',
        'Réseaux et Télécommunications', 'Nouakchott', 16, 38000, 2, False, 'Active',
        "Participation au déploiement et à l'optimisation du réseau mobile 4G/5G de Mauritel "
        "sur l'ensemble du territoire national.",
        "Master en Réseaux et Télécoms. Protocoles LTE/5G NR, outils de simulation réseau.",
    ),
    (
        'Mauritel', 'Développeur Backend Node.js',
        'Génie Logiciel', 'Nouakchott', 12, 28000, 2, True, 'Active',
        "Développement d'APIs RESTful pour les services internes de Mauritel. "
        "Node.js, Express, MongoDB, Redis, architecture microservices.",
        "Licence 3 ou Master en Génie Logiciel. JavaScript/Node.js, REST APIs, NoSQL.",
    ),
    (
        'Mauritel', 'Analyste Big Data Télécom',
        'Intelligence Artificielle', 'Nouakchott', 16, 35000, 1, False, 'Active',
        "Analyse des données de trafic réseau pour anticiper les congestions et optimiser "
        "la qualité de service. Hadoop, Spark et visualisation de données.",
        "Master en Data Science ou Réseaux. Expérience Hadoop/Spark. Python et SQL.",
    ),
    # ── Chinguitel ────────────────────────────────────────────────────────────
    (
        'Chinguitel', 'Développeur Mobile Flutter',
        'Génie Logiciel', 'Nouakchott', 12, 26000, 2, False, 'Active',
        "Développement de l'application client cross-platform de Chinguitel avec Flutter/Dart. "
        "Nouvelles fonctionnalités de recharge mobile et service client.",
        "Licence 3 ou Master en Génie Logiciel. Notions Dart ou Flutter.",
    ),
    (
        'Chinguitel', 'Ingénieur VoIP & Réseaux',
        'Réseaux et Télécommunications', 'Nouakchott', 16, 34000, 1, False, 'Active',
        "Déploiement de solutions VoIP et supervision de l'infrastructure réseau centrale "
        "de l'opérateur.",
        "Master en Réseaux et Télécoms. VoIP, SIP, routage IP.",
    ),
    (
        'Chinguitel', 'Analyste Cybersécurité Télécom',
        'Sécurité Informatique', 'Nouakchott', 12, 30000, 1, False, 'Active',
        "Analyse de vulnérabilités et durcissement de l'infrastructure télécom face aux "
        "menaces de fraude et d'intrusion.",
        "Master en Sécurité Informatique. OWASP, hardening Linux.",
    ),
    # ── Tasiast Mauritanie ────────────────────────────────────────────────────
    (
        'Tasiast Mauritanie', 'Ingénieur IoT Industriel',
        'Systèmes Embarqués', 'Nouakchott', 16, 42000, 1, True, 'Active',
        "Déploiement de capteurs IoT sur les installations de la mine d'or de Tasiast et "
        "supervision cloud des données industrielles via MQTT.",
        "Master en SE ou Génie Logiciel. MQTT, Python, protocoles IoT.",
    ),
    (
        'Tasiast Mauritanie', 'Ingénieur Machine Learning — Maintenance Prédictive',
        'Intelligence Artificielle', 'Nouakchott', 20, 48000, 1, False, 'Active',
        "Développement de modèles ML de détection d'anomalies pour la maintenance prédictive "
        "des équipements miniers lourds.",
        "Master 2 en IA ou Data Science. Python (scikit-learn, TensorFlow ou PyTorch).",
    ),
    # ── SMH ───────────────────────────────────────────────────────────────────
    (
        'SMH', 'Analyste Cybersécurité SI',
        'Sécurité Informatique', 'Nouakchott', 12, 32000, 2, False, 'Active',
        "Analyse de vulnérabilités, durcissement des serveurs et mise en place de politiques "
        "de sécurité pour les systèmes d'information stratégiques de la SMH.",
        "Master en Sécurité Informatique. OWASP, ISO 27001. Certification un plus.",
    ),
    (
        'SMH', 'Data Analyst — Exploration Pétrolière',
        'Intelligence Artificielle', 'Nouakchott', 16, 38000, 1, False, 'Active',
        "Analyse de données géologiques et sismiques pour appuyer les décisions d'exploration "
        "offshore. Tableaux de bord et modélisation statistique.",
        "Master en Data Science ou Géosciences/IA. Python, SQL, visualisation de données.",
    ),
    (
        'SMH', 'Développeur ERP',
        'Génie Logiciel', 'Nouakchott', 12, 26000, 2, False, 'Active',
        "Développement et intégration de modules ERP pour la gestion des contrats et de "
        "la logistique pétrolière.",
        "Master en Génie Logiciel ou SI. Notions ERP appréciées.",
    ),
    # ── Banque Générale de Mauritanie ────────────────────────────────────────
    (
        'Banque Générale de Mauritanie', 'Développeur Full-Stack Fintech',
        'Génie Logiciel', 'Nouakchott', 12, 30000, 2, False, 'Active',
        "Développement de la nouvelle application mobile banking de la BGM. "
        "React Native, Django REST Framework, intégration de paiement mobile.",
        "Master 1 ou 2 en Génie Logiciel. React, Python/Django, API REST.",
    ),
    (
        'Banque Générale de Mauritanie', 'Consultant Cybersécurité Junior',
        'Sécurité Informatique', 'Nouakchott', 12, 28000, 2, False, 'Active',
        "Tests de pénétration internes, rédaction de rapports d'audit et sensibilisation "
        "des équipes aux bonnes pratiques de sécurité bancaire.",
        "Master en Sécurité Informatique. Kali Linux, Burp Suite.",
    ),
    (
        'Banque Générale de Mauritanie', 'Analyste SOC & Threat Intelligence',
        'Sécurité Informatique', 'Nouakchott', 16, 34000, 1, False, 'Active',
        "Surveillance des alertes SIEM, analyse de tentatives de fraude bancaire et "
        "rédaction d'indicateurs de compromission.",
        "Master en Sécurité Informatique. Splunk ou ELK Stack.",
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
    print(f"  {'[creat]' if created else '[exist]'} Offre: {titre[:55]}")


# ─────────────────────────────────────────────────────────────────────────────
# Candidatures
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Candidatures ===")
CANDS_DATA = [
    ('MohamedLemine@gmail.com',  'Développeur Full-Stack — Portail RH Interne',     'Stage_actif'),
    ('MohamedLemine@gmail.com',  'Développeur Full-Stack Fintech',                  'En_attente'),
    ('Fatimetou@gmail.com',       'Développeur Full-Stack Fintech',                  'Stage_actif'),
    ('Fatimetou@gmail.com',       'Développeur Full-Stack — Portail RH Interne',     'Refusée'),
    ('SidiMohamed@gmail.com',    'Ingénieur Machine Learning — Maintenance Prédictive','Stage_actif'),
    ('SidiMohamed@gmail.com',    'Data Engineer — Exploitation Minière',            'Acceptée'),
    ('Mariem@gmail.com',     'Data Engineer — Exploitation Minière',            'Terminé'),
    ('Mariem@gmail.com',     'Analyste Big Data Télécom',                       'En_attente'),
    ('Amadou@gmail.com',           'Ingénieur Réseaux 4G/5G',                         'Stage_actif'),
    ('Amadou@gmail.com',           'Analyste Big Data Télécom',                       'Refusée'),
    ('CheikhAhmed@gmail.com',     'Ingénieur Réseaux 4G/5G',                         'Convention_en_cours'),
    ('CheikhAhmed@gmail.com',     'Développeur Backend Node.js',                     'En_attente'),
    ('Khadijetou@gmail.com',    'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire', 'Terminé'),
    ('Khadijetou@gmail.com',    'Ingénieur IoT Industriel',                        'En_attente'),
    ('Moctar@gmail.com',        'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire', 'Stage_actif'),
    ('Moctar@gmail.com',        'Ingénieur IoT Industriel',                        'Refusée'),
    ('Aichetou@gmail.com',     'Consultant Cybersécurité Junior',                 'Stage_actif'),
    ('Aichetou@gmail.com',     'Analyste SOC & Threat Intelligence',              'Acceptée'),
    ('Yacoub@gmail.com',        'Analyste Cybersécurité Télécom',                  'Terminé'),
    ('Yacoub@gmail.com',        'Analyste Cybersécurité SI',                       'Convention_en_cours'),
    ('Selma@gmail.com',        'Développeur Mobile Flutter',                      'En_attente'),
    ('Selma@gmail.com',        'Développeur ERP',                                 'En_attente'),
    ('Brahim@gmail.com',           'Data Analyst — Exploration Pétrolière',           'Acceptée'),
    ('Zeinabou@gmail.com',   'Ingénieur Réseaux 4G/5G',                         'En_attente'),
    ('Abderrahmane@gmail.com',    'Ingénieur IoT Industriel',                        'Stage_actif'),
    ('Coumba@gmail.com',          'Analyste SOC & Threat Intelligence',              'En_attente'),
]

LETTRES = [
    "Motivé(e) par le développement web moderne et les défis techniques.",
    "Souhait d'élargir mes compétences dans ce domaine clé pour l'économie mauritanienne.",
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
CONVS_DATA = [
    ('MohamedLemine@gmail.com', 'Développeur Full-Stack — Portail RH Interne',      'Validée',               'CONV-MR-2026-001', 'Génie Logiciel'),
    ('Fatimetou@gmail.com',      'Développeur Full-Stack Fintech',                   'Validée',               'CONV-MR-2026-002', 'Génie Logiciel'),
    ('SidiMohamed@gmail.com',   'Ingénieur Machine Learning — Maintenance Prédictive','Validée',             'CONV-MR-2026-003', 'Intelligence Artificielle'),
    ('Mariem@gmail.com',    'Data Engineer — Exploitation Minière',             'Validée',               'CONV-MR-2026-004', 'Intelligence Artificielle'),
    ('Amadou@gmail.com',          'Ingénieur Réseaux 4G/5G',                          'Validée',               'CONV-MR-2026-005', 'Réseaux et Télécommunications'),
    ('CheikhAhmed@gmail.com',    'Ingénieur Réseaux 4G/5G',                          'En_attente_validation', 'CONV-MR-2026-006', None),
    ('Khadijetou@gmail.com',   'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire', 'Validée',      'CONV-MR-2026-007', 'Systèmes Embarqués'),
    ('Moctar@gmail.com',       'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire', 'Validée',      'CONV-MR-2026-008', 'Systèmes Embarqués'),
    ('Aichetou@gmail.com',    'Consultant Cybersécurité Junior',                  'Validée',               'CONV-MR-2026-009', 'Sécurité Informatique'),
    ('Yacoub@gmail.com',       'Analyste Cybersécurité Télécom',                   'Validée',               'CONV-MR-2026-010', 'Sécurité Informatique'),
    ('Yacoub@gmail.com',       'Analyste Cybersécurité SI',                        'En_attente_validation', 'CONV-MR-2026-011', None),
    ('Abderrahmane@gmail.com',   'Ingénieur IoT Industriel',                         'Validée',               'CONV-MR-2026-012', 'Systèmes Embarqués'),
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
    (
        'Mariem@gmail.com', 'Data Engineer — Exploitation Minière', 'SNIM',
        5, 4, 5, 4, 'Oui',
        "Étudiante très sérieuse et force de proposition. Maîtrise parfaite de Python et SQL.",
    ),
    (
        'Khadijetou@gmail.com', 'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire', 'SNIM',
        4, 5, 4, 5, 'Oui',
        "Excellente maîtrise des systèmes embarqués. A livré un module d'automatisation sans supervision.",
    ),
    (
        'Yacoub@gmail.com', 'Analyste Cybersécurité Télécom', 'Chinguitel',
        5, 5, 4, 5, 'Oui',
        "Niveau exceptionnel pour un stagiaire. A découvert 3 vulnérabilités critiques. Embauche envisagée.",
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
        'Mariem@gmail.com', 'Data Engineer — Exploitation Minière',
        4, 4, 5, 4,
        "Stage très enrichissant. J'ai pu appliquer mes connaissances en Python sur des "
        "problèmes industriels réels.",
    ),
    (
        'Khadijetou@gmail.com', 'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire',
        4, 5, 4, 5,
        "Environnement stimulant. Montée en compétences rapide sur les systèmes embarqués industriels.",
    ),
    (
        'Yacoub@gmail.com', 'Analyste Cybersécurité Télécom',
        5, 5, 4, 5,
        "Stage de haut niveau. Décortiquer des vulnérabilités réelles est une expérience irremplaçable.",
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
    ('MohamedLemine@gmail.com', 'Développeur Full-Stack — Portail RH Interne', TODAY - timedelta(days=8),  'Absence non signalée mardi matin.',      'Justifiée'),
    ('Amadou@gmail.com',          'Ingénieur Réseaux 4G/5G',                     TODAY - timedelta(days=4),  'Retard de 2h à la réunion hebdomadaire.','Signaler'),
    ('Moctar@gmail.com',       'Ingénieur Systèmes Embarqués — Automatisation Ferroviaire', TODAY - timedelta(days=12), 'Journée entière non justifiée.', 'Non_justifiée'),
    ('Abderrahmane@gmail.com',   'Ingénieur IoT Industriel',                    TODAY - timedelta(days=3),  'Demi-journée manquante sans préavis.',   'Signaler'),
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

    PDF_PATH = os.path.join(os.path.dirname(__file__), '..', 'credentials_mauritanie.pdf')
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

    BLUE    = colors.HexColor('#2563EB')
    SLATE   = colors.HexColor('#0F172A')
    MUTED   = colors.HexColor('#64748B')
    SUCCESS = colors.HexColor('#10B981')
    ORANGE  = colors.HexColor('#F59E0B')
    PURPLE  = colors.HexColor('#6366F1')

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

    def make_section(title, rows, color):
        elems = []
        elems.append(Paragraph(title, h2))
        elems.append(HRFlowable(width='100%', thickness=1, color=color, spaceAfter=6))

        col_widths = [3.5*cm, 5.5*cm, 6*cm, 3*cm]
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

    by_role = {}
    for c in CREDENTIALS:
        by_role.setdefault(c['role'], []).append(c)

    story = []
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('internHub — Mauritanie', h1))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph('Identifiants de test — Données de démonstration', sub))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(f'Généré le {TODAY.strftime("%d/%m/%Y")}  ·  {sum(len(v) for v in by_role.values())} comptes', sub))
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width='100%', thickness=2, color=BLUE, spaceAfter=12))

    story.append(Paragraph(
        '⚠ Ces identifiants sont destinés exclusivement à des environnements de développement et de test. '
        'Ne jamais utiliser en production.',
        warning_style,
    ))
    story.append(Spacer(1, 0.6*cm))

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

    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=8))
    story.append(Paragraph(
        f'Total : {len(by_role.get("Admin", []))} admin  ·  '
        f'{len(by_role.get("Chef de Département", []))} chefs  ·  '
        f'{len(by_role.get("Entreprise", []))} entreprises  ·  '
        f'{len(by_role.get("Étudiant", []))} étudiants',
        sub,
    ))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph('Plate-forme internHub — Gestion de stages universitaires (Mauritanie)', warning_style))

    doc.build(story)
    print(f"  [OK] PDF genere : {PDF_PATH}")

except Exception as e:
    print(f"  [ERR] PDF : {e}")

print("\n[OK] Seed Mauritanie termine.")
print(f"  • {len(CREDENTIALS)} comptes créés")
print(f"  • {len(offres)} offres de stage")
print(f"  • {len(cands)} candidatures")
