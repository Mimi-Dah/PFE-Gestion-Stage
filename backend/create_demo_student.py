"""
internHub — Crée UN étudiant de démo "riche" en informations pour présenter le projet.

Ce script est idempotent (peut être relancé sans dupliquer les données) et NE
touche à aucune donnée existante : il se contente d'ajouter (ou de compléter)
un compte étudiant + son écosystème (entreprises, offres, candidatures à tous
les statuts, convention validée, absences, évaluations, auto-évaluation,
rapport de stage, favoris).

Couvre ainsi tous les écrans de démo :
    - Profil complet (photo, CV, coordonnées)
    - Dashboard (activité variée)
    - Offres & Favoris
    - Candidatures (En attente / Acceptée / Refusée / Stage actif / Terminé)
    - Mon Stage (convention validée + absences)
    - Évaluations (reçue de l'entreprise + auto-évaluation)
    - Rapports de stage

Usage:
    cd e:/React-Django-Project-master/PFE/backend
    python create_demo_student.py
"""
import os
import django
from datetime import date, timedelta, datetime, time
from io import BytesIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from django.utils import timezone
from django.core.files.base import ContentFile

from accounts.models import User, Etudiant, Entreprise, ChefDepartement
from etablissements.models import Etablissement, Departement
from offres.models import OffreDeStage, Favori
from candidatures.models import Candidature
from conventions.models import ConventionDeStage
from evaluations.models import EvaluationDeStage, AutoEvaluation
from absences.models import Absence
from rapports.models import RapportDeStage

TODAY = date.today()
NOW = timezone.now()

EMAIL_ETUDIANT = 'demo.etudiant@gmail.com'
PWD_ETUDIANT = 'Demo@1234'
EMAIL_CHEF = 'demo.chef@gmail.com'
PWD_CHEF = 'Demo@1234'


def backdate(queryset, field, dt):
    """auto_now_add fields ignore values passed to .create(); patch them after the fact."""
    queryset.update(**{field: dt})


# ─────────────────────────────────────────────────────────────────────────────
# Fichiers de démo (photo + CV) générés à la volée
# ─────────────────────────────────────────────────────────────────────────────

def make_avatar_png(initials, bg_hex="#6366F1"):
    from PIL import Image, ImageDraw, ImageFont

    size = 512
    img = Image.new("RGB", (size, size), bg_hex)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arialbd.ttf", 200)
    except Exception:
        try:
            font = ImageFont.load_default(size=200)
        except TypeError:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initials, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), initials, fill="white", font=font)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_cv_pdf(prenom, nom, telephone, email, adresse, universite, specialite, niveau):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem

    BLUE = colors.HexColor('#6366F1')
    SLATE = colors.HexColor('#0F172A')
    MUTED = colors.HexColor('#64748B')

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle('H1', fontSize=20, leading=24, textColor=SLATE, fontName='Helvetica-Bold')
    h2 = ParagraphStyle('H2', fontSize=12, leading=16, textColor=BLUE, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4)
    normal = ParagraphStyle('N', fontSize=9.5, leading=14, textColor=SLATE, fontName='Helvetica')
    sub = ParagraphStyle('Sub', fontSize=9.5, leading=14, textColor=MUTED, fontName='Helvetica')

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)

    story = [
        Paragraph(f"{prenom} {nom}", h1),
        Paragraph(f"Étudiant(e) en {specialite} — {niveau}", sub),
        Paragraph(f"{telephone} · {email} · {adresse}", sub),
        HRFlowable(width='100%', thickness=1.2, color=BLUE, spaceBefore=8, spaceAfter=4),

        Paragraph("Formation", h2),
        Paragraph(f"<b>{niveau} — {specialite}</b>, {universite} (2023 — 2026)", normal),
        Paragraph("Baccalauréat Scientifique, mention Bien (2022)", normal),

        Paragraph("Compétences techniques", h2),
        ListFlowable([
            ListItem(Paragraph("Langages : Python, JavaScript, Java, SQL", normal)),
            ListItem(Paragraph("Frameworks : Django REST Framework, React, React Native", normal)),
            ListItem(Paragraph("Outils : Git, Docker, Postman, Figma", normal)),
            ListItem(Paragraph("Bases de données : PostgreSQL, MySQL", normal)),
        ], bulletType='bullet', start='•'),

        Paragraph("Expérience & projets", h2),
        ListFlowable([
            ListItem(Paragraph("<b>internHub</b> — Plateforme de gestion de stages (projet de fin d'études), "
                                "développement full-stack Django/React.", normal)),
            ListItem(Paragraph("<b>Projet académique</b> — Application de gestion de bibliothèque, "
                                "conception de base de données et API REST.", normal)),
            ListItem(Paragraph("Participation à un hackathon universitaire (2025), 2e place.", normal)),
        ], bulletType='bullet', start='•'),

        Paragraph("Langues", h2),
        Paragraph("Arabe (langue maternelle) · Français (courant) · Anglais (professionnel)", normal),

        Paragraph("Centres d'intérêt", h2),
        Paragraph("Développement web, intelligence artificielle, veille technologique, football.", normal),
    ]

    doc.build(story)
    return buf.getvalue()


def make_report_pdf(title, prenom, nom, entreprise, resume):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

    BLUE = colors.HexColor('#6366F1')
    SLATE = colors.HexColor('#0F172A')
    h1 = ParagraphStyle('H1', fontSize=18, leading=22, textColor=SLATE, fontName='Helvetica-Bold')
    normal = ParagraphStyle('N', fontSize=10, leading=15, textColor=SLATE, fontName='Helvetica')

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    story = [
        Paragraph("Rapport de stage", h1),
        Paragraph(f"{title} — {entreprise}", normal),
        Paragraph(f"{prenom} {nom}", normal),
        HRFlowable(width='100%', thickness=1.2, color=BLUE, spaceBefore=8, spaceAfter=10),
        Paragraph(resume, normal),
    ]
    doc.build(story)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Établissement, départements & chef
# ─────────────────────────────────────────────────────────────────────────────

print("=== Établissement & Départements ===")
etab, _ = Etablissement.objects.get_or_create(
    nom="École Supérieure Polytechnique de Nouakchott",
    defaults={'adresse': 'Ilot K, Tevragh Zeina, Nouakchott, Mauritanie'},
)

DEPT_NAMES = ["Génie Logiciel", "Intelligence Artificielle", "Sécurité Informatique", "Réseaux et Télécommunications"]
depts = {}
for name in DEPT_NAMES:
    d, created = Departement.objects.get_or_create(nom=name, etablissement=etab)
    depts[name] = d
    print(f"  {'[creat]' if created else '[exist]'} Dept: {name}")

DEPT_ETUDIANT = depts["Génie Logiciel"]

print("\n=== Chef de Département (pour valider la convention) ===")
chef = ChefDepartement.objects.select_related('user').filter(departement=DEPT_ETUDIANT).first()
chef_created = False
if chef:
    # Clean up any orphaned demo-chef user left over from a previous partial run
    User.objects.filter(courriel=EMAIL_CHEF).exclude(pk=chef.user_id).delete()
else:
    if User.objects.filter(courriel=EMAIL_CHEF).exists():
        chef_user = User.objects.get(courriel=EMAIL_CHEF)
    else:
        chef_user = User.objects.create_user(courriel=EMAIL_CHEF, password=PWD_CHEF, role='Chef_Departement', is_verified=True)
    chef = ChefDepartement.objects.create(departement=DEPT_ETUDIANT, user=chef_user, prenom='Mohamed', nom='Ould Abdellahi')
    chef_created = True
print(f"  {'[creat]' if chef_created else '[exist]'} Chef: {chef.prenom} {chef.nom} ({chef.user.courriel}) -> {DEPT_ETUDIANT.nom}")


# ─────────────────────────────────────────────────────────────────────────────
# Entreprises & offres
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Entreprises & Offres ===")
ENTREPRISES_DATA = [
    ('TechNova Solutions', "Génie Logiciel", "TechNovaDemo@gmail.com",
     "Éditeur de logiciels métiers pour les administrations et grandes entreprises mauritaniennes.",
     "Tevragh Zeina, Nouakchott, Mauritanie", "+222 45 25 11 01", "Sidi Mohamed Ould Cheikh"),
    ('DataWave Analytics', "Intelligence Artificielle", "DataWaveDemo@gmail.com",
     "Cabinet de conseil en data science et intelligence artificielle appliquée.",
     "Ksar, Nouakchott, Mauritanie", "+222 45 25 22 02", "Khadijetou Mint Ahmed"),
    ('SecureNet Consulting', "Sécurité Informatique", "SecureNetDemo@gmail.com",
     "Cabinet spécialisé en cybersécurité et audit de systèmes d'information.",
     "Sebkha, Nouakchott, Mauritanie", "+222 45 25 33 03", "Yahya Ould Mohamed"),
    ('CloudScale Systems', "Réseaux et Télécommunications", "CloudScaleDemo@gmail.com",
     "Intégrateur réseaux et infrastructures cloud pour opérateurs télécoms.",
     "Ksar, Nouakchott, Mauritanie", "+222 45 25 44 04", "Aminetou Mint Sidi"),
]
entreprises = {}
for nom, dep_nom, email, desc, adresse, tel, contact in ENTREPRISES_DATA:
    u, _ = (User.objects.get(courriel=email), False) if User.objects.filter(courriel=email).exists() \
        else (User.objects.create_user(courriel=email, password='Ent@1234', role='Entreprise', is_verified=True), True)
    ent, created = Entreprise.objects.get_or_create(
        user=u,
        defaults=dict(nom=nom, description=desc, adresse=adresse, telephone=tel, nom_contact=contact, email_contact=email),
    )
    entreprises[nom] = ent
    print(f"  {'[creat]' if created else '[exist]'} Entreprise: {nom}")

OFFERS_DATA = [
    # (clé interne, entreprise, titre, dept, localisation, semaines, gratif, statut)
    ('stage_actif', 'TechNova Solutions',  "Développeur Full-Stack — Plateforme Interne", "Génie Logiciel", "Nouakchott", 16, 35000, 'Active'),
    ('termine',     'TechNova Solutions',  "Ingénieur DevOps — Infrastructure Cloud",      "Génie Logiciel", "Nouakchott", 16, 32000, 'Active'),
    ('acceptee',    'DataWave Analytics',  "Data Analyst — Tableaux de Bord Clients",      "Intelligence Artificielle", "Nouakchott", 12, 30000, 'Active'),
    ('en_attente',  'SecureNet Consulting',"Analyste Sécurité Junior",                     "Sécurité Informatique", "Nouakchott", 12, 28000, 'Active'),
    ('refusee',     'CloudScale Systems',  "Ingénieur Réseaux Junior",                     "Réseaux et Télécommunications", "Nouakchott", 12, 26000, 'Active'),
    ('favori_1',    'TechNova Solutions',  "Développeur Mobile React Native",              "Génie Logiciel", "Nouakchott", 12, 30000, 'Active'),
    ('favori_2',    'DataWave Analytics',  "Ingénieur Machine Learning",                    "Intelligence Artificielle", "Nouakchott", 16, 38000, 'Active'),
]

offres = {}
for key, nom_ent, titre, dep_nom, loc, semaines, grat, statut in OFFERS_DATA:
    ent = entreprises[nom_ent]
    if key == 'termine':
        start = TODAY - timedelta(weeks=semaines + 8)
        end = TODAY - timedelta(weeks=4)
    else:
        start = TODAY - timedelta(weeks=semaines // 2)
        end = TODAY + timedelta(weeks=semaines)
    offre, created = OffreDeStage.objects.get_or_create(
        titre=titre, entreprise=ent,
        defaults=dict(
            departement=depts[dep_nom],
            description=f"Stage chez {nom_ent} portant sur des missions concrètes en {dep_nom}, "
                        f"encadré par une équipe expérimentée à {loc}.",
            exigences="Étudiant motivé, bonnes bases théoriques, esprit d'équipe.",
            date_debut=start, date_fin=end, localisation=loc,
            gratification=grat, places_disponibles=2, statut=statut, domaine=dep_nom,
        ),
    )
    offres[key] = offre
    print(f"  {'[creat]' if created else '[exist]'} Offre: {titre}")


# ─────────────────────────────────────────────────────────────────────────────
# Étudiant démo — profil complet
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Étudiant démo ===")
if User.objects.filter(courriel=EMAIL_ETUDIANT).exists():
    etu_user = User.objects.get(courriel=EMAIL_ETUDIANT)
    print("  [exist] user")
else:
    etu_user = User.objects.create_user(courriel=EMAIL_ETUDIANT, password=PWD_ETUDIANT, role='Étudiant', is_verified=True)
    print("  [creat] user")

etu, created = Etudiant.objects.get_or_create(
    user=etu_user,
    defaults=dict(
        prenom="Amina", nom="Diallo",
        telephone="+222 45 12 34 56",
        adresse="Tevragh Zeina, Nouakchott, Mauritanie",
        departement=DEPT_ETUDIANT,
        universite=etab.nom,
        specialite="Génie Logiciel",
        matricule="MR20260099",
        date_de_naissance=date(2002, 4, 17),
        niveau_academique="Master 2",
    ),
)
print(f"  {'[creat]' if created else '[exist]'} Etudiant: {etu.prenom} {etu.nom}")

if not etu.photo:
    etu.photo.save('amina_diallo.png', ContentFile(make_avatar_png("AD")), save=False)
if not etu.cv:
    cv_bytes = make_cv_pdf(etu.prenom, etu.nom, etu.telephone, EMAIL_ETUDIANT, etu.adresse, etu.universite, etu.specialite, etu.niveau_academique)
    etu.cv.save('cv_amina_diallo.pdf', ContentFile(cv_bytes), save=False)
etu.save()
print(f"  Profil complet : {etu.is_profile_complete()}")


# ─────────────────────────────────────────────────────────────────────────────
# Candidatures — un statut de chaque
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Candidatures ===")

def get_or_create_cand(offre_key, statut, lettre):
    cand, created = Candidature.objects.get_or_create(
        etudiant=etu, offre=offres[offre_key],
        defaults=dict(statut=statut, texte_lettre_motivation=lettre),
    )
    if not created and cand.statut != statut:
        cand.statut = statut
        cand.save()
    print(f"  {'[creat]' if created else '[exist]'} {offre_key} -> {statut}")
    return cand

cand_actif = get_or_create_cand(
    'stage_actif', 'Stage_actif',
    "Très motivée par le développement full-stack et l'écosystème Django/React de TechNova.")
backdate(Candidature.objects.filter(pk=cand_actif.pk), 'postule_le', NOW - timedelta(weeks=9))

cand_termine = get_or_create_cand(
    'termine', 'Terminé',
    "Je souhaite acquérir une expérience concrète en DevOps et infrastructures cloud.")
backdate(Candidature.objects.filter(pk=cand_termine.pk), 'postule_le', NOW - timedelta(weeks=24))

cand_acceptee = get_or_create_cand(
    'acceptee', 'Acceptée',
    "Passionnée de data et de visualisation, je souhaite rejoindre DataWave Analytics.")
backdate(Candidature.objects.filter(pk=cand_acceptee.pk), 'postule_le', NOW - timedelta(days=3))

cand_attente = get_or_create_cand(
    'en_attente', 'En_attente',
    "Intéressée par la cybersécurité, je souhaite mettre en pratique mes connaissances OWASP.")

cand_refusee = get_or_create_cand(
    'refusee', 'Refusée',
    "Candidature motivée par mon intérêt pour les réseaux et télécommunications.")


# ─────────────────────────────────────────────────────────────────────────────
# Favoris
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Favoris ===")
for key in ('favori_1', 'favori_2'):
    fav, created = Favori.objects.get_or_create(etudiant=etu, offre=offres[key])
    print(f"  {'[creat]' if created else '[exist]'} Favori: {key}")


# ─────────────────────────────────────────────────────────────────────────────
# Convention — Stage actif (validée, en cours)
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Convention (stage actif) ===")
conv_actif, created = ConventionDeStage.objects.get_or_create(
    candidature=cand_actif,
    defaults=dict(
        numero_convention=f"Conv-DEMO-{cand_actif.pk:04d}",
        statut='Validée',
        valide_par_chef_departement=chef,
        date_validation=NOW - timedelta(weeks=8),
        signe_par_etudiant_le=NOW - timedelta(weeks=8, days=1),
        signe_par_entreprise_le=NOW - timedelta(weeks=8, days=1),
    ),
)
if created:
    year = (NOW - timedelta(weeks=8)).year
    conv_actif.numero_convention = f"Conv-{year}-{conv_actif.id_convention:03d}"
    conv_actif.save(update_fields=['numero_convention'])
    backdate(ConventionDeStage.objects.filter(pk=conv_actif.pk), 'cree_le', NOW - timedelta(weeks=9))
    try:
        from conventions.utils import generate_convention_pdf
        generate_convention_pdf(conv_actif.id_convention)
        print("  [creat] convention + PDF généré")
    except Exception as e:
        print(f"  [creat] convention (PDF non généré : {e})")
else:
    print("  [exist] convention")


# ─────────────────────────────────────────────────────────────────────────────
# Convention — Acceptée, en attente de validation par le chef
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Convention (en attente de validation) ===")
conv_attente, created = ConventionDeStage.objects.get_or_create(
    candidature=cand_acceptee,
    defaults=dict(numero_convention=f"Conv-DEMO-{cand_acceptee.pk:04d}", statut='En_attente_validation'),
)
if created:
    year = NOW.year
    conv_attente.numero_convention = f"Conv-{year}-{conv_attente.id_convention:03d}"
    conv_attente.save(update_fields=['numero_convention'])
print(f"  {'[creat]' if created else '[exist]'} convention en attente")


# ─────────────────────────────────────────────────────────────────────────────
# Convention — Terminée (stage passé)
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Convention (stage terminé) ===")
conv_termine, created = ConventionDeStage.objects.get_or_create(
    candidature=cand_termine,
    defaults=dict(
        numero_convention=f"Conv-DEMO-T{cand_termine.pk:04d}",
        statut='Validée',
        valide_par_chef_departement=chef,
        date_validation=NOW - timedelta(weeks=23),
        signe_par_etudiant_le=NOW - timedelta(weeks=23, days=1),
        signe_par_entreprise_le=NOW - timedelta(weeks=23, days=1),
    ),
)
if created:
    year = (NOW - timedelta(weeks=23)).year
    conv_termine.numero_convention = f"Conv-{year}-{conv_termine.id_convention:03d}"
    conv_termine.save(update_fields=['numero_convention'])
    backdate(ConventionDeStage.objects.filter(pk=conv_termine.pk), 'cree_le', NOW - timedelta(weeks=24))
print(f"  {'[creat]' if created else '[exist]'} convention terminée")


# ─────────────────────────────────────────────────────────────────────────────
# Absences (liées au stage actif)
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Absences ===")
abs1, c1 = Absence.objects.get_or_create(
    candidature=cand_actif, date_absence=TODAY - timedelta(days=10),
    defaults=dict(
        motif_signalement="Rendez-vous médical imprévu.",
        justification="Certificat médical fourni à l'entreprise.",
        statut='Justifiée',
        valide_le=NOW - timedelta(days=8),
    ),
)
print(f"  {'[creat]' if c1 else '[exist]'} Absence justifiée ({abs1.date_absence})")

abs2, c2 = Absence.objects.get_or_create(
    candidature=cand_actif, date_absence=TODAY - timedelta(days=2),
    defaults=dict(
        motif_signalement="Retard de plus de deux heures non prévenu.",
        statut='En_attente_approbation',
    ),
)
print(f"  {'[creat]' if c2 else '[exist]'} Absence en attente ({abs2.date_absence})")


# ─────────────────────────────────────────────────────────────────────────────
# Évaluation (entreprise) + Auto-évaluation + Rapport (stage terminé)
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Évaluation & Rapport (stage terminé) ===")
ent_technova = entreprises['TechNova Solutions']

eval_obj, c = EvaluationDeStage.objects.get_or_create(
    entreprise=ent_technova, etudiant=etu, offre=offres['termine'],
    defaults=dict(
        comportement=5, adaptabilite=5, travail_equipe=4, qualite_travail=5,
        recommanderait='Oui',
        commentaires="Amina a fait preuve d'une grande autonomie sur nos pipelines CI/CD. "
                     "Excellente communication avec l'équipe. Embauche envisagée dès l'obtention du diplôme.",
    ),
)
print(f"  {'[creat]' if c else '[exist]'} Évaluation entreprise -> {eval_obj.note_globale}/20")

auto_eval, c = AutoEvaluation.objects.get_or_create(
    etudiant=etu, offre=offres['termine'],
    defaults=dict(
        comportement=4, adaptabilite=5, travail_equipe=4, qualite_travail=4,
        commentaires="Stage très formateur : j'ai pu monter en compétences sur Docker, Kubernetes "
                     "et les pipelines d'intégration continue, en autonomie sur des projets réels.",
    ),
)
print(f"  {'[creat]' if c else '[exist]'} Auto-évaluation -> {auto_eval.note_globale}/20")

rapport, c = RapportDeStage.objects.get_or_create(
    etudiant=etu, offre=offres['termine'],
    defaults=dict(
        resume="Stage de 16 semaines chez TechNova Solutions portant sur la mise en place d'une "
               "infrastructure cloud (Docker, Kubernetes, CI/CD GitLab). Automatisation du "
               "déploiement de la plateforme interne et réduction de 40% du temps de mise en production.",
        note=17.0,
        commentaire="Rapport clair et bien structuré, mission menée avec sérieux. Bravo.",
    ),
)
if c:
    rapport.fichier.save(
        'rapport_stage_amina_diallo.pdf',
        ContentFile(make_report_pdf(offres['termine'].titre, etu.prenom, etu.nom, ent_technova.nom, rapport.resume)),
        save=True,
    )
    backdate(RapportDeStage.objects.filter(pk=rapport.pk), 'soumis_le', NOW - timedelta(weeks=4))
print(f"  {'[creat]' if c else '[exist]'} Rapport de stage (note {rapport.note}/20)")


# ─────────────────────────────────────────────────────────────────────────────
# Résumé
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("[OK] Étudiant de démo prêt à l'emploi")
print("=" * 60)
print(f"  Email     : {EMAIL_ETUDIANT}")
print(f"  Mot de passe : {PWD_ETUDIANT}")
print(f"  Nom       : {etu.prenom} {etu.nom}")
print(f"  Profil complet : {etu.is_profile_complete()}")
print("\n  Couvre : profil complet (photo+CV), 5 candidatures (tous statuts),")
print("  2 favoris, 1 stage actif (convention validée + 2 absences),")
print("  1 stage terminé (évaluation + auto-évaluation + rapport noté),")
print("  1 convention en attente de validation.")
print(f"\n  Chef de département associé : {EMAIL_CHEF} / {PWD_CHEF}")
