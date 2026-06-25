from datetime import date

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise, ChefDepartement
from offres.models import OffreDeStage
from candidatures.models import Candidature
from absences.models import Absence

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


# ── 1. Absence Signalling (Enterprise) ───────────────────────────────────────

class AbsenceSignalTests(TestCase):
    """
    AbsenceViewSet.create: POST /api/v1/absences/
    Only an enterprise may signal an absence, and only for Stage_actif candidatures.
    """

    URL = '/api/v1/absences/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('sig')
        self.student_user = chain['student_user']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.candidature = chain['candidature']

    def _payload(self):
        return {
            'candidature': self.candidature.pk,
            'date_absence': '2026-07-10',
            'motif_signalement': 'Absent sans préavis.',
        }

    def test_enterprise_can_signal_absence_for_active_intern(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Absence.objects.count(), 1)
        self.assertEqual(Absence.objects.first().statut, 'Signaler')

    def test_enterprise_cannot_signal_absence_for_pending_candidature(self):
        self.candidature.statut = 'En_attente'
        self.candidature.save()
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])
        self.assertEqual(Absence.objects.count(), 0)

    def test_student_cannot_signal_an_absence(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Absence.objects.count(), 0)

    def test_chef_cannot_signal_an_absence(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Absence.objects.count(), 0)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(self.URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── 2. Absence Justification (Student) ───────────────────────────────────────

class AbsenceJustifyTests(TestCase):
    """
    AbsenceViewSet.justifier: POST /api/v1/absences/{pk}/justifier/
    The student submits a justification text (and optional file).
    """

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('jus')
        self.student_user = chain['student_user']
        self.student = chain['student']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.candidature = chain['candidature']
        self.absence = Absence.objects.create(
            candidature=self.candidature,
            date_absence=date(2026, 7, 10),
            motif_signalement='Absent.',
            statut='Signaler',
        )
        self.url = f'/api/v1/absences/{self.absence.pk}/justifier/'

    def test_student_can_justify_their_own_absence(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            self.url, {'justification': 'Rendez-vous médical.'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.absence.refresh_from_db()
        self.assertEqual(self.absence.statut, 'Justifiée')
        self.assertEqual(self.absence.justification, 'Rendez-vous médical.')

    def test_justification_without_text_returns_400(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.absence.refresh_from_db()
        self.assertEqual(self.absence.statut, 'Signaler')

    def test_enterprise_cannot_justify_a_student_absence(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(
            self.url, {'justification': 'Essai.'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.absence.refresh_from_db()
        self.assertEqual(self.absence.statut, 'Signaler')


# ── 3. Absence Validation (Chef de Département) ───────────────────────────────

class AbsenceValidateTests(TestCase):
    """
    AbsenceViewSet.valider: POST /api/v1/absences/{pk}/valider/
    Chef closes the loop by marking the absence as Justifiée or Non_justifiée.
    """

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('val')
        self.student_user = chain['student_user']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.candidature = chain['candidature']
        self.absence = Absence.objects.create(
            candidature=self.candidature,
            date_absence=date(2026, 7, 11),
            motif_signalement='Absent.',
            justification='Raison valide.',
            statut='Justifiée',
        )
        self.url = f'/api/v1/absences/{self.absence.pk}/valider/'

    def test_chef_can_confirm_as_justified(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(self.url, {'statut': 'Justifiée'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.absence.refresh_from_db()
        self.assertEqual(self.absence.statut, 'Justifiée')

    def test_chef_can_mark_as_non_justified(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(self.url, {'statut': 'Non_justifiée'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.absence.refresh_from_db()
        self.assertEqual(self.absence.statut, 'Non_justifiée')

    def test_invalid_statut_value_returns_400(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(self.url, {'statut': 'Inventé'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_validate_an_absence(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.url, {'statut': 'Justifiée'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_enterprise_cannot_validate_an_absence(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.url, {'statut': 'Non_justifiée'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ── 4. Absence Queryset Scoping ───────────────────────────────────────────────

class AbsenceAccessControlTests(TestCase):
    """Users must only see absences relevant to their role."""

    URL = '/api/v1/absences/'

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('ac')
        self.student_user = chain['student_user']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.candidature = chain['candidature']
        self.absence = Absence.objects.create(
            candidature=self.candidature,
            date_absence=date(2026, 7, 12),
            motif_signalement='Absent.',
            statut='Signaler',
        )

    def test_student_sees_only_their_own_absences(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_enterprise_sees_absences_from_their_interns(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [a['id_absence'] for a in response.data['results']]
        self.assertIn(self.absence.pk, ids)

    def test_chef_sees_absences_from_their_department(self):
        self.client.force_authenticate(self.chef_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [a['id_absence'] for a in response.data['results']]
        self.assertIn(self.absence.pk, ids)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── 5. Three-Unjustified-Absences Business Rule ───────────────────────────────

class ThreeAbsencesRuleTests(TestCase):
    """
    Business rule: when a candidature accumulates 3 (or more) Non_justifiée
    absences, its statut is automatically set to 'Abandonné' via the
    post_save signal on Absence.
    """

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('rule')
        self.candidature = chain['candidature']   # statut='Stage_actif'
        self.chef_user = chain['chef_user']

    # ── Helpers ──────────────────────────────────────────────

    def _create_absence(self, statut='Signaler'):
        return Absence.objects.create(
            candidature=self.candidature,
            date_absence=date(2026, 7, 1),
            motif_signalement='Absent sans préavis.',
            statut=statut,
        )

    def _validate_via_api(self, absence, statut):
        self.client.force_authenticate(self.chef_user)
        url = f'/api/v1/absences/{absence.pk}/valider/'
        return self.client.post(url, {'statut': statut}, format='json')

    # ── Core rule ────────────────────────────────────────────

    def test_two_unjustified_absences_do_not_abandon_internship(self):
        a1 = self._create_absence()
        a2 = self._create_absence()
        self._validate_via_api(a1, 'Non_justifiée')
        self._validate_via_api(a2, 'Non_justifiée')
        self.candidature.refresh_from_db()
        self.assertNotEqual(self.candidature.statut, 'Abandonné')

    def test_third_unjustified_absence_triggers_abandonment(self):
        for _ in range(3):
            a = self._create_absence()
            self._validate_via_api(a, 'Non_justifiée')
        self.candidature.refresh_from_db()
        self.assertEqual(self.candidature.statut, 'Abandonné')

    def test_fourth_unjustified_absence_on_already_abandoned_stays_abandoned(self):
        for _ in range(4):
            a = self._create_absence()
            self._validate_via_api(a, 'Non_justifiée')
        self.candidature.refresh_from_db()
        self.assertEqual(self.candidature.statut, 'Abandonné')

    def test_justified_absences_do_not_count_toward_limit(self):
        for _ in range(3):
            a = self._create_absence()
            self._validate_via_api(a, 'Justifiée')
        self.candidature.refresh_from_db()
        self.assertNotEqual(self.candidature.statut, 'Abandonné')

    def test_mix_only_counts_unjustified(self):
        # 2 justified + 2 unjustified → rule must NOT fire (need 3 unjustified)
        for _ in range(2):
            a = self._create_absence()
            self._validate_via_api(a, 'Justifiée')
        for _ in range(2):
            a = self._create_absence()
            self._validate_via_api(a, 'Non_justifiée')
        self.candidature.refresh_from_db()
        self.assertNotEqual(self.candidature.statut, 'Abandonné')

    def test_signal_fires_on_direct_model_save(self):
        """Rule applies even when the absence is written directly (not via API)."""
        for _ in range(3):
            Absence.objects.create(
                candidature=self.candidature,
                date_absence=date(2026, 7, 1),
                motif_signalement='Direct.',
                statut='Non_justifiée',
            )
        self.candidature.refresh_from_db()
        self.assertEqual(self.candidature.statut, 'Abandonné')

    # ── Nested endpoint ──────────────────────────────────────

    def test_nested_get_absences_returns_correct_list(self):
        Absence.objects.create(
            candidature=self.candidature,
            date_absence=date(2026, 7, 5),
            motif_signalement='Absent.',
            statut='Signaler',
        )
        # Authenticate as the enterprise that owns this internship
        self.client.force_authenticate(self.candidature.offre.entreprise.user)
        url = f'/api/v1/candidatures/{self.candidature.pk}/absences/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_nested_post_creates_absence_for_active_intern(self):
        self.client.force_authenticate(self.candidature.offre.entreprise.user)
        url = f'/api/v1/candidatures/{self.candidature.pk}/absences/'
        payload = {'date_absence': '2026-07-15', 'motif_signalement': 'Absent.'}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Absence.objects.count(), 1)

    def test_nested_post_rejected_for_non_active_candidature(self):
        self.candidature.statut = 'Terminé'
        self.candidature.save()
        self.client.force_authenticate(self.candidature.offre.entreprise.user)
        url = f'/api/v1/candidatures/{self.candidature.pk}/absences/'
        payload = {'date_absence': '2026-07-15', 'motif_signalement': 'Absent.'}
        response = self.client.post(url, payload, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN,
        ])

    def test_student_cannot_post_absence_via_nested_endpoint(self):
        self.client.force_authenticate(self.candidature.etudiant.user)
        url = f'/api/v1/candidatures/{self.candidature.pk}/absences/'
        payload = {'date_absence': '2026-07-15', 'motif_signalement': 'Tentative.'}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
