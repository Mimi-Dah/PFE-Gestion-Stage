from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from accounts.models import User
from accounts.management.commands.seed_mauritania import PASSWORDS

ROLE_ORDER = ['Admin', 'Chef_Departement', 'Entreprise', 'Étudiant']
ROLE_LABELS = {
    'Admin': 'Administrateurs',
    'Chef_Departement': 'Chefs de Département',
    'Entreprise': 'Entreprises',
    'Étudiant': 'Étudiants',
}


class Command(BaseCommand):
    help = "Export all current users (with demo passwords) to a PDF file."

    def add_arguments(self, parser):
        parser.add_argument('--output', default=None, help="Output PDF path")

    def handle(self, *args, **options):
        output_path = options['output'] or str(Path(settings.BASE_DIR).parent / 'nouveaux_utilisateurs.pdf')

        styles = getSampleStyleSheet()
        story = [
            Paragraph("Liste des utilisateurs - InternHub Mauritanie", styles['Title']),
            Spacer(1, 0.5 * cm),
        ]

        users = User.objects.all().select_related(
            'profil_etudiant', 'profil_entreprise', 'profil_chef', 'profil_chef__departement',
        ).order_by('role', 'courriel')

        by_role = {role: [] for role in ROLE_ORDER}
        for user in users:
            by_role.setdefault(user.role, []).append(user)

        for role in ROLE_ORDER:
            role_users = by_role.get(role, [])
            if not role_users:
                continue
            story.append(Paragraph(ROLE_LABELS[role], styles['Heading2']))
            story.append(Spacer(1, 0.2 * cm))

            data = [["Nom", "Email", "Mot de passe", "Détail"]]
            for user in role_users:
                nom = user.courriel
                detail = "-"
                if role == 'Étudiant' and hasattr(user, 'profil_etudiant'):
                    p = user.profil_etudiant
                    nom = f"{p.prenom} {p.nom}"
                    detail = f"{p.specialite or '-'} ({p.niveau_academique or '-'})"
                elif role == 'Entreprise' and hasattr(user, 'profil_entreprise'):
                    p = user.profil_entreprise
                    nom = p.nom
                    detail = p.nom_contact
                elif role == 'Chef_Departement' and hasattr(user, 'profil_chef'):
                    p = user.profil_chef
                    nom = f"{p.prenom} {p.nom}"
                    detail = p.departement.nom if p.departement else '-'

                data.append([nom, user.courriel, PASSWORDS.get(role, '-'), detail])

            table = Table(data, colWidths=[5 * cm, 6 * cm, 3.5 * cm, 5 * cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B6EF3')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTSIZE', (0, 0), (-1, -1), 8.5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F2F6FC')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(table)
            story.append(Spacer(1, 0.6 * cm))

        doc = SimpleDocTemplate(output_path, pagesize=A4, title="Utilisateurs InternHub Mauritanie")
        doc.build(story)

        self.stdout.write(self.style.SUCCESS(f"PDF généré : {output_path}"))
