from datetime import date
from io import BytesIO
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise, ChefDepartement
from offres.models import OffreDeStage
from candidatures.models import Candidature
from rapports.models import RapportDeStage

User = get_user_model()

# ── Factories ─────────────────────────────────────────────────────────────────

def make_user(courriel, role, **kwargs):
    defaults = {'is_verified': True, 'is_active': True}
    defaults.update(kwargs)
    return User.objects.create_user(courriel=courriel, password='TestPass123!', role=role, **defaults)


def make_full_chain(tag='a'):
    etab = Etablissement.objects.create(nom=f'Univ{tag}')
    dept = Departement.objects.create(etablissement=etab, nom=f'Info{tag}')

    student_user = make_user(f'{tag}_student@test.com', 'Étudiant')
    student = Etudiant.objects.create(
        user=student_user, prenom='Alice', nom='Dupont', departement=dept,
    )

    corp_user = make_user(f'{tag}_corp@test.com', 'Entreprise')
    entreprise = Entreprise.objects.create(
        user=corp_user, nom='TechCorp', description='Tech', adresse='Paris',
        telephone='0600000000', nom_contact='Bob', email_contact='bob@corp.com',
    )

    chef_user = make_user(f'{tag}_chef@test.com', 'Chef_Departement')
    chef = ChefDepartement.objects.create(
        user=chef_user, departement=dept, nom='Martin', prenom='Jean',
    )

    offer = OffreDeStage.objects.create(
        entreprise=entreprise, titre='Stage Dev', description='Dev',
        date_debut=date(2026, 6, 1), date_fin=date(2026, 8, 31),
        localisation='Paris', domaine='Informatique', places_disponibles=2,
    )
    candidature = Candidature.objects.create(
        etudiant=student, offre=offer, statut='Stage_actif',
    )

    return {
        'dept': dept,
        'student_user': student_user, 'student': student,
        'corp_user': corp_user, 'entreprise': entreprise,
        'chef_user': chef_user, 'chef': chef,
        'offer': offer, 'candidature': candidature,
    }


def fake_pdf():
    return SimpleUploadedFile('rapport.pdf', b'%PDF-1.4 fake content', content_type='application/pdf')


# ── 1. Report Submission ──────────────────────────────────────────────────────

class RapportSubmitTests(TestCase):
    """
    RapportDeStageViewSet.create: POST /api/v1/rapports/
    Only students with an active or terminated stage may submit.
    """

    URL = '/api/v1/rapports/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('sub')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.offer = chain['offer']
        self.candidature = chain['candidature']

    @patch('rapports.views.create_notification')
    def test_student_can_submit_report_for_active_stage(self, _notify):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {
            'offre': self.offer.pk,
            'fichier': fake_pdf(),
            'resume': 'Résumé du stage.',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RapportDeStage.objects.count(), 1)
        rapport = RapportDeStage.objects.first()
        self.assertEqual(rapport.etudiant, self.student)

    @patch('rapports.views.create_notification')
    def test_student_can_submit_report_for_terminated_stage(self, _notify):
        self.candidature.statut = 'Terminé'
        self.candidature.save()
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {
            'offre': self.offer.pk,
            'fichier': fake_pdf(),
            'resume': 'Résumé du stage terminé.',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_submit_report_without_active_candidature(self):
        self.candidature.statut = 'En_attente'
        self.candidature.save()
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {
            'offre': self.offer.pk,
            'fichier': fake_pdf(),
            'resume': 'Résumé.',
        }, format='multipart')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])
        self.assertEqual(RapportDeStage.objects.count(), 0)

    def test_student_cannot_submit_without_any_candidature(self):
        # Create a brand-new offer with no candidature
        other_corp_user = make_user('other@test.com', 'Entreprise')
        other_ent = Entreprise.objects.create(
            user=other_corp_user, nom='OtherCorp', description='d', adresse='a',
            telephone='00', nom_contact='c', email_contact='c@other.com',
        )
        other_offer = OffreDeStage.objects.create(
            entreprise=other_ent, titre='Other Stage', description='d',
            date_debut=date(2026, 6, 1), date_fin=date(2026, 8, 31),
            localisation='Lyon', domaine='Finance', places_disponibles=1,
        )
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {
            'offre': other_offer.pk,
            'fichier': fake_pdf(),
            'resume': 'Aucune candidature.',
        }, format='multipart')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])

    def test_enterprise_cannot_submit_a_report(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, {
            'offre': self.offer.pk,
            'fichier': fake_pdf(),
            'resume': 'Essai.',
        }, format='multipart')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])
        self.assertEqual(RapportDeStage.objects.count(), 0)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(self.URL, {
            'offre': self.offer.pk, 'fichier': fake_pdf(), 'resume': 'r',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('rapports.views.create_notification')
    def test_submitting_report_triggers_notification_to_chef(self, mock_notify):
        self.client.force_authenticate(self.student_user)
        self.client.post(self.URL, {
            'offre': self.offer.pk,
            'fichier': fake_pdf(),
            'resume': 'Résumé.',
        }, format='multipart')
        mock_notify.assert_called_once()


# ── 2. Report Grading by Chef ─────────────────────────────────────────────────

class RapportGradingTests(TestCase):
    """
    RapportDeStageViewSet.noter: PATCH /api/v1/rapports/{pk}/noter/
    Only the Chef de Département may grade a submitted report.
    """

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('grade')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.offer = chain['offer']
        self.rapport = RapportDeStage.objects.create(
            etudiant=self.student,
            offre=self.offer,
            fichier=fake_pdf(),
            resume='Résumé du stage.',
        )
        self.url = f'/api/v1/rapports/{self.rapport.pk}/noter/'

    @patch('rapports.views.create_notification')
    def test_chef_can_grade_a_submitted_report(self, _notify):
        self.client.force_authenticate(self.chef_user)
        response = self.client.patch(
            self.url, {'note': 15, 'commentaires': 'Bon travail.'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rapport.refresh_from_db()
        self.assertEqual(self.rapport.note, 15.0)

    @patch('rapports.views.create_notification')
    def test_grading_notifies_the_student(self, mock_notify):
        self.client.force_authenticate(self.chef_user)
        self.client.patch(self.url, {'note': 14}, format='json')
        mock_notify.assert_called_once()

    def test_grading_without_note_returns_400(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.patch(
            self.url, {'commentaires': 'Commentaire sans note.'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_grade_their_own_report(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.patch(self.url, {'note': 20}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_enterprise_cannot_grade_a_report(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(self.url, {'note': 18}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ── 3. Report Queryset Scoping ────────────────────────────────────────────────

class RapportAccessControlTests(TestCase):
    """Each role sees only the reports relevant to them."""

    URL = '/api/v1/rapports/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('ac')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.offer = chain['offer']
        self.rapport = RapportDeStage.objects.create(
            etudiant=self.student,
            offre=self.offer,
            fichier=fake_pdf(),
            resume='Mon stage.',
        )

    def test_student_sees_only_their_own_reports(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [r['id_rapport'] for r in response.data['results']]
        self.assertIn(self.rapport.pk, ids)

    def test_enterprise_sees_reports_for_their_offers(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [r['id_rapport'] for r in response.data['results']]
        self.assertIn(self.rapport.pk, ids)

    def test_chef_can_see_department_reports(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [r['id_rapport'] for r in response.data['results']]
        self.assertIn(self.rapport.pk, ids)
