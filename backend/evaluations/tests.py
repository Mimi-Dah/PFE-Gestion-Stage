from datetime import date
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise, ChefDepartement
from offres.models import OffreDeStage
from candidatures.models import Candidature
from evaluations.models import EvaluationDeStage, AutoEvaluation

User = get_user_model()

# ── Factories ─────────────────────────────────────────────────────────────────

def make_user(courriel, role, **kwargs):
    defaults = {'is_verified': True, 'is_active': True}
    defaults.update(kwargs)
    return User.objects.create_user(courriel=courriel, password='TestPass123!', role=role, **defaults)


def make_dept():
    etab = Etablissement.objects.create(nom='Université Test')
    return Departement.objects.create(etablissement=etab, nom='Informatique')


def make_offer(entreprise, statut='Active'):
    return OffreDeStage.objects.create(
        entreprise=entreprise,
        titre='Stage Dev',
        description='Dev logiciel',
        date_debut=date(2026, 6, 1),
        date_fin=date(2026, 8, 31),
        localisation='Paris',
        domaine='Informatique',
        places_disponibles=2,
        statut=statut,
    )


def make_full_chain(tag='a'):
    """
    Returns student, entreprise, chef, offer, and a Stage_actif candidature.
    """
    dept = make_dept()

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

    offer = make_offer(entreprise)
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


EVAL_PAYLOAD = {
    'comportement': 4,
    'adaptabilite': 3,
    'travail_equipe': 5,
    'qualite_travail': 4,
    'recommanderait': 'Oui',
    'commentaires': 'Bon stagiaire.',
}


# ── 1. EvaluationDeStage Model ────────────────────────────────────────────────

class EvaluationModelTests(TestCase):
    """Unit tests for EvaluationDeStage — note_globale is auto-computed."""

    def setUp(self):
        dept = make_dept()
        corp_user = make_user('corp@test.com', 'Entreprise')
        self.entreprise = Entreprise.objects.create(
            user=corp_user, nom='Corp', description='d', adresse='a',
            telephone='00', nom_contact='c', email_contact='c@c.com',
        )
        student_user = make_user('stu@test.com', 'Étudiant')
        self.student = Etudiant.objects.create(
            user=student_user, prenom='X', nom='Y', departement=dept,
        )
        self.offer = make_offer(self.entreprise)

    def test_note_globale_is_sum_of_four_criteria(self):
        ev = EvaluationDeStage.objects.create(
            entreprise=self.entreprise,
            etudiant=self.student,
            offre=self.offer,
            comportement=4,
            adaptabilite=3,
            travail_equipe=5,
            qualite_travail=4,
            recommanderait='Oui',
        )
        self.assertEqual(ev.note_globale, 16.0)

    def test_auto_evaluation_note_globale_is_sum_of_four_criteria(self):
        ae = AutoEvaluation.objects.create(
            etudiant=self.student,
            offre=self.offer,
            comportement=5,
            adaptabilite=5,
            travail_equipe=5,
            qualite_travail=5,
        )
        self.assertEqual(ae.note_globale, 20.0)


# ── 2. Enterprise Evaluation Creation ────────────────────────────────────────

class EvaluationCreateTests(TestCase):
    """
    EvaluationDeStageViewSet.create: POST /api/v1/evaluations/
    Only the enterprise that hosted the intern can evaluate.
    """

    URL = '/api/v1/evaluations/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('ev')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.entreprise = chain['entreprise']
        self.chef_user = chain['chef_user']
        self.offer = chain['offer']

    def _payload(self):
        return {**EVAL_PAYLOAD, 'etudiant': self.student.pk, 'offre': self.offer.pk}

    @patch('evaluations.views.create_notification')
    def test_enterprise_can_evaluate_their_active_intern(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EvaluationDeStage.objects.count(), 1)

    @patch('evaluations.views.create_notification')
    def test_note_globale_is_returned_in_response(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 4 + 3 + 5 + 4 = 16
        self.assertEqual(float(response.data['note_globale']), 16.0)

    @patch('evaluations.views.create_notification')
    def test_enterprise_cannot_evaluate_an_intern_not_in_their_offer(self, _notify):
        other_corp_user = make_user('other_corp@test.com', 'Entreprise')
        other_entreprise = Entreprise.objects.create(
            user=other_corp_user, nom='OtherCorp', description='d', adresse='a',
            telephone='00', nom_contact='c', email_contact='c@other.com',
        )
        self.client.force_authenticate(other_corp_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST,
        ])
        self.assertEqual(EvaluationDeStage.objects.count(), 0)

    @patch('evaluations.views.create_notification')
    def test_enterprise_cannot_evaluate_twice(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.post(self.URL, self._payload(), format='json')
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])
        self.assertEqual(EvaluationDeStage.objects.count(), 1)

    def test_student_cannot_create_an_enterprise_evaluation(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST,
        ])
        self.assertEqual(EvaluationDeStage.objects.count(), 0)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── 3. Evaluation Queryset Scoping ────────────────────────────────────────────

class EvaluationQuerysetTests(TestCase):
    """Each role must see only the evaluations relevant to them."""

    URL = '/api/v1/evaluations/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('qs')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.entreprise = chain['entreprise']
        self.chef_user = chain['chef_user']
        self.offer = chain['offer']
        self.eval = EvaluationDeStage.objects.create(
            entreprise=self.entreprise,
            etudiant=self.student,
            offre=self.offer,
            **EVAL_PAYLOAD,
        )

    def test_student_sees_their_own_evaluations(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [e['id_evaluation'] for e in response.data['results']]
        self.assertIn(self.eval.pk, ids)

    def test_enterprise_sees_evaluations_they_created(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [e['id_evaluation'] for e in response.data['results']]
        self.assertIn(self.eval.pk, ids)

    def test_chef_sees_evaluations_for_their_department(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [e['id_evaluation'] for e in response.data['results']]
        self.assertIn(self.eval.pk, ids)


# ── 4. AutoEvaluation (Student Self-Assessment) ───────────────────────────────

class AutoEvaluationTests(TestCase):
    """
    AutoEvaluationViewSet: POST/GET /api/v1/evaluations/auto/
    Students self-assess for stages they are in or have completed.
    PUT/PATCH/DELETE are disabled — submitted auto-evaluations are final.
    """

    URL = '/api/v1/evaluations/auto/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('ae')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.offer = chain['offer']

    def _payload(self):
        return {
            'offre': self.offer.pk,
            'comportement': 4,
            'adaptabilite': 4,
            'travail_equipe': 3,
            'qualite_travail': 5,
        }

    def test_student_can_submit_auto_evaluation_for_active_stage(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AutoEvaluation.objects.count(), 1)

    def test_auto_eval_note_globale_is_sum_of_four_criteria(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 4 + 4 + 3 + 5 = 16
        self.assertEqual(float(response.data['note_globale']), 16.0)

    def test_student_cannot_submit_auto_evaluation_twice(self):
        self.client.force_authenticate(self.student_user)
        self.client.post(self.URL, self._payload(), format='json')
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])
        self.assertEqual(AutoEvaluation.objects.count(), 1)

    def test_enterprise_cannot_submit_auto_evaluation(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(AutoEvaluation.objects.count(), 0)

    def test_student_sees_only_their_own_auto_evaluations(self):
        # Create an auto-eval for this student
        AutoEvaluation.objects.create(
            etudiant=self.student, offre=self.offer,
            comportement=3, adaptabilite=3, travail_equipe=3, qualite_travail=3,
        )
        # Create a second student with their own auto-eval
        dept2 = make_dept()
        s2_user = make_user('s2@test.com', 'Étudiant')
        s2 = Etudiant.objects.create(user=s2_user, prenom='Bob', nom='Martin', departement=dept2)
        corp2_user = make_user('corp2@test.com', 'Entreprise')
        ent2 = Entreprise.objects.create(
            user=corp2_user, nom='Corp2', description='d', adresse='a',
            telephone='00', nom_contact='c', email_contact='c2@c.com',
        )
        offer2 = make_offer(ent2)
        Candidature.objects.create(etudiant=s2, offre=offer2, statut='Stage_actif')
        AutoEvaluation.objects.create(
            etudiant=s2, offre=offer2,
            comportement=5, adaptabilite=5, travail_equipe=5, qualite_travail=5,
        )

        self.client.force_authenticate(self.student_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Student should only see their own auto-eval
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['etudiant'], self.student.pk)
