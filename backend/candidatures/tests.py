from datetime import date
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise
from offres.models import OffreDeStage
from candidatures.models import Candidature
from conventions.models import ConventionDeStage

User = get_user_model()

# ── Shared factories ─────────────────────────────────────────────────────────

def make_user(courriel, role, password='TestPass123!', **kwargs):
    defaults = {'is_verified': True, 'is_active': True}
    defaults.update(kwargs)
    return User.objects.create_user(
        courriel=courriel, password=password, role=role, **defaults
    )

def make_dept():
    etab = Etablissement.objects.create(nom='Université Test')
    return Departement.objects.create(etablissement=etab, nom='Informatique')

def make_student(courriel='student@test.com', dept=None):
    user = make_user(courriel, 'Étudiant')
    profile = Etudiant.objects.create(
        user=user, prenom='Alice', nom='Dupont', departement=dept,
    )
    return user, profile

def make_enterprise(courriel='corp@test.com'):
    user = make_user(courriel, 'Entreprise')
    profile = Entreprise.objects.create(
        user=user, nom='TechCorp', description='A tech company', adresse='Paris',
        telephone='0600000000', nom_contact='Bob', email_contact='bob@corp.com',
    )
    return user, profile

def make_offer(entreprise, statut='Active', places=2):
    return OffreDeStage.objects.create(
        entreprise=entreprise,
        titre='Stage Dev',
        description='Développement logiciel',
        date_debut=date(2026, 6, 1),
        date_fin=date(2026, 8, 31),
        localisation='Paris',
        domaine='Informatique',
        places_disponibles=places,
        statut=statut,
    )


# ── 1. Application Submission ────────────────────────────────────────────────

class CandidatureSubmissionTests(TestCase):
    """
    CandidatureViewSet.create: POST /api/v1/candidatures/
    Only authenticated students may apply; business-rule guards checked here.
    create_notification is mocked to avoid Celery dependency.
    """

    URL = '/api/v1/candidatures/'

    def setUp(self):
        self.client = APIClient()
        self.dept = make_dept()
        self.student_user, self.student = make_student(dept=self.dept)
        self.corp_user, self.entreprise = make_enterprise()
        self.offer = make_offer(self.entreprise)

    @patch('candidatures.views.create_notification')
    def test_student_can_submit_to_active_offer(self, _notify):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {'offre': self.offer.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cand = Candidature.objects.get()
        self.assertEqual(cand.etudiant, self.student)
        self.assertEqual(cand.statut, 'En_attente')

    @patch('candidatures.views.create_notification')
    def test_enterprise_user_cannot_submit_application(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, {'offre': self.offer.pk}, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST,
        ])
        self.assertEqual(Candidature.objects.count(), 0)

    def test_unauthenticated_user_cannot_submit(self):
        response = self.client.post(self.URL, {'offre': self.offer.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('candidatures.views.create_notification')
    def test_duplicate_application_is_rejected(self, _notify):
        self.client.force_authenticate(self.student_user)
        self.client.post(self.URL, {'offre': self.offer.pk}, format='json')
        # Second identical submission must fail
        response = self.client.post(self.URL, {'offre': self.offer.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Candidature.objects.count(), 1)

    @patch('candidatures.views.create_notification')
    def test_applying_to_closed_offer_is_rejected(self, _notify):
        closed = make_offer(self.entreprise, statut='Fermée')
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {'offre': closed.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Candidature.objects.count(), 0)

    @patch('candidatures.views.create_notification')
    def test_applying_to_archived_offer_is_rejected(self, _notify):
        archived = make_offer(self.entreprise, statut='Archivée')
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {'offre': archived.pk}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── 2. Application Status Workflow ───────────────────────────────────────────

class CandidatureWorkflowTests(TestCase):
    """
    CandidatureViewSet.statut: PATCH /api/v1/candidatures/{pk}/statut/
    Driven by the enterprise; tests cover the full lifecycle state machine.
    """

    def setUp(self):
        self.client = APIClient()
        self.dept = make_dept()
        self.student_user, self.student = make_student(dept=self.dept)
        self.corp_user, self.entreprise = make_enterprise()
        self.offer = make_offer(self.entreprise, places=2)
        self.cand = Candidature.objects.create(
            etudiant=self.student, offre=self.offer, statut='En_attente',
        )
        self.statut_url = f'/api/v1/candidatures/{self.cand.pk}/statut/'

    @patch('candidatures.views.create_notification')
    def test_enterprise_can_accept_a_pending_application(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(self.statut_url, {'statut': 'Acceptée'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cand.refresh_from_db()
        self.assertEqual(self.cand.statut, 'Acceptée')

    @patch('candidatures.views.create_notification')
    def test_accepting_creates_a_convention_de_stage(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(self.statut_url, {'statut': 'Acceptée'}, format='json')
        self.assertTrue(ConventionDeStage.objects.filter(candidature=self.cand).exists())

    @patch('candidatures.views.create_notification')
    def test_accepting_creates_convention_with_correct_number(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(self.statut_url, {'statut': 'Acceptée'}, format='json')
        conv = ConventionDeStage.objects.get(candidature=self.cand)
        from django.utils import timezone
        year = timezone.now().year
        self.assertRegex(conv.numero_convention, rf'^Conv-{year}-\d{{3}}$')

    @patch('candidatures.views.create_notification')
    def test_accepting_decrements_available_places(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(self.statut_url, {'statut': 'Acceptée'}, format='json')
        self.offer.refresh_from_db()
        self.assertEqual(self.offer.places_disponibles, 1)

    @patch('candidatures.views.create_notification')
    def test_accepting_the_last_place_closes_the_offer(self, _notify):
        single_offer = make_offer(self.entreprise, places=1)
        student2_user, student2 = make_student('s2@test.com', dept=self.dept)
        cand2 = Candidature.objects.create(
            etudiant=student2, offre=single_offer, statut='En_attente',
        )
        self.client.force_authenticate(self.corp_user)
        self.client.patch(
            f'/api/v1/candidatures/{cand2.pk}/statut/', {'statut': 'Acceptée'}, format='json',
        )
        single_offer.refresh_from_db()
        self.assertEqual(single_offer.statut, 'Fermée')
        self.assertEqual(single_offer.places_disponibles, 0)

    @patch('candidatures.views.create_notification')
    def test_enterprise_can_reject_an_application(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(self.statut_url, {'statut': 'Refusée'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cand.refresh_from_db()
        self.assertEqual(self.cand.statut, 'Refusée')

    @patch('candidatures.views.create_notification')
    def test_enterprise_can_mark_internship_as_terminated(self, _notify):
        self.cand.statut = 'Stage_actif'
        self.cand.save()
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(self.statut_url, {'statut': 'Terminé'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cand.refresh_from_db()
        self.assertEqual(self.cand.statut, 'Terminé')

    @patch('candidatures.views.create_notification')
    def test_setting_invalid_status_via_statut_endpoint_is_rejected(self, _notify):
        # The statut action only allows Acceptée, Refusée, Terminé
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(self.statut_url, {'statut': 'Stage_actif'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.cand.refresh_from_db()
        self.assertEqual(self.cand.statut, 'En_attente')

    @patch('candidatures.views.create_notification')
    def test_accepting_with_no_available_places_returns_400(self, _notify):
        full_offer = make_offer(self.entreprise, places=0, statut='Fermée')
        dept2 = Departement.objects.create(
            etablissement=self.dept.etablissement, nom='Maths',
        )
        s2_user, s2 = make_student('s2@test.com', dept=dept2)
        cand = Candidature.objects.create(
            etudiant=s2, offre=full_offer, statut='En_attente',
        )
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(
            f'/api/v1/candidatures/{cand.pk}/statut/', {'statut': 'Acceptée'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('candidatures.views.create_notification')
    def test_student_can_withdraw_a_pending_application(self, _notify):
        self.client.force_authenticate(self.student_user)
        response = self.client.delete(f'/api/v1/candidatures/{self.cand.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.cand.refresh_from_db()
        self.assertEqual(self.cand.statut, 'Retirée')

    @patch('candidatures.views.create_notification')
    def test_student_cannot_withdraw_an_accepted_application(self, _notify):
        self.cand.statut = 'Acceptée'
        self.cand.save()
        self.client.force_authenticate(self.student_user)
        response = self.client.delete(f'/api/v1/candidatures/{self.cand.pk}/')
        # Must fail — only En_attente candidatures are withdrawable
        self.assertNotEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.cand.refresh_from_db()
        self.assertNotEqual(self.cand.statut, 'Retirée')

    @patch('candidatures.views.create_notification')
    def test_accepting_twice_does_not_create_duplicate_convention(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(self.statut_url, {'statut': 'Acceptée'}, format='json')
        # Reduce places so the second call doesn't fail on places
        self.offer.places_disponibles = 1
        self.offer.save()
        self.client.patch(self.statut_url, {'statut': 'Acceptée'}, format='json')
        self.assertEqual(
            ConventionDeStage.objects.filter(candidature=self.cand).count(), 1,
        )


# ── 3. Queryset Scoping (Access Control) ─────────────────────────────────────

class CandidatureAccessControlTests(TestCase):
    """
    Users must only see candidatures that belong to them, not the entire dataset.
    """

    def setUp(self):
        self.client = APIClient()
        self.dept = make_dept()
        self.s1_user, self.s1 = make_student('s1@test.com', dept=self.dept)
        self.s2_user, self.s2 = make_student('s2@test.com', dept=self.dept)
        self.corp_user, self.entreprise = make_enterprise()
        self.corp2_user, self.entreprise2 = make_enterprise('corp2@test.com')
        self.offer = make_offer(self.entreprise)
        self.offer2 = make_offer(self.entreprise2)
        # s1 applied to offer (corp), s2 applied to offer2 (corp2)
        self.cand_s1 = Candidature.objects.create(
            etudiant=self.s1, offre=self.offer, statut='En_attente',
        )
        self.cand_s2 = Candidature.objects.create(
            etudiant=self.s2, offre=self.offer2, statut='En_attente',
        )

    def test_student_only_sees_their_own_candidatures(self):
        self.client.force_authenticate(self.s1_user)
        response = self.client.get('/api/v1/candidatures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [c['id_candidature'] for c in results]
        self.assertIn(self.cand_s1.pk, ids)
        self.assertNotIn(self.cand_s2.pk, ids)

    def test_enterprise_only_sees_candidatures_for_its_own_offers(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.get('/api/v1/candidatures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        offer_ids = {c['offre'] for c in results}
        # corp only owns self.offer; corp2's candidature must not appear
        self.assertNotIn(self.offer2.pk, offer_ids)

    def test_admin_sees_all_candidatures(self):
        admin = make_user('admin@test.com', 'Admin')
        self.client.force_authenticate(admin)
        response = self.client.get('/api/v1/candidatures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [c['id_candidature'] for c in results]
        self.assertIn(self.cand_s1.pk, ids)
        self.assertIn(self.cand_s2.pk, ids)
