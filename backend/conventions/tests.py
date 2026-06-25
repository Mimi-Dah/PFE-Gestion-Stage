from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise, ChefDepartement
from offres.models import OffreDeStage
from candidatures.models import Candidature
from conventions.models import ConventionDeStage
from conventions.tasks import auto_reject_expired_conventions

User = get_user_model()

# ── Shared factories ─────────────────────────────────────────────────────────

def make_user(courriel, role, password='TestPass123!', **kwargs):
    defaults = {'is_verified': True, 'is_active': True}
    defaults.update(kwargs)
    return User.objects.create_user(
        courriel=courriel, password=password, role=role, **defaults
    )

def make_dept(suffix=''):
    etab = Etablissement.objects.create(nom=f'Université{suffix}')
    return Departement.objects.create(etablissement=etab, nom=f'Informatique{suffix}')

def make_offer(entreprise, places=2):
    return OffreDeStage.objects.create(
        entreprise=entreprise,
        titre='Stage Dev',
        description='Dev',
        date_debut=date(2026, 6, 1),
        date_fin=date(2026, 8, 31),
        localisation='Paris',
        domaine='Informatique',
        places_disponibles=places,
    )

def make_full_chain(tag='a'):
    """
    Build the complete object graph needed for convention tests:
    Etablissement → Departement → Etudiant + ChefDepartement + Entreprise → Offre → Candidature
    Returns a plain dict for easy unpacking in setUp.
    """
    dept = make_dept(tag)

    student_user = make_user(f'{tag}_student@test.com', 'Étudiant')
    student = Etudiant.objects.create(
        user=student_user, prenom='Alice', nom='Dupont', departement=dept,
    )

    corp_user = make_user(f'{tag}_corp@test.com', 'Entreprise')
    entreprise = Entreprise.objects.create(
        user=corp_user, nom='TechCorp', description='Tech company', adresse='Paris',
        telephone='0600000000', nom_contact='Bob', email_contact='bob@corp.com',
    )

    chef_user = make_user(f'{tag}_chef@test.com', 'Chef_Departement')
    chef = ChefDepartement.objects.create(
        user=chef_user, departement=dept, nom='Martin', prenom='Jean',
    )

    offer = make_offer(entreprise)
    candidature = Candidature.objects.create(
        etudiant=student, offre=offer, statut='En_attente',
    )
    convention = ConventionDeStage.objects.create(
        candidature=candidature,
        numero_convention=f'CONV-{candidature.pk}',
        statut='En_attente_validation',
    )

    return {
        'dept': dept,
        'student_user': student_user, 'student': student,
        'corp_user': corp_user, 'entreprise': entreprise,
        'chef_user': chef_user, 'chef': chef,
        'offer': offer, 'candidature': candidature, 'convention': convention,
    }


# ── 1. Convention Creation (via candidature acceptance) ──────────────────────

class ConventionCreationTests(TestCase):
    """
    A ConventionDeStage is auto-created when an enterprise accepts a candidature
    (CandidatureViewSet.statut action). Tests here verify that contract.
    """

    def setUp(self):
        self.client = APIClient()
        self.dept = make_dept()
        student_user = make_user('student@test.com', 'Étudiant')
        self.student = Etudiant.objects.create(
            user=student_user, prenom='Alice', nom='Dupont', departement=self.dept,
        )
        corp_user = make_user('corp@test.com', 'Entreprise')
        self.entreprise = Entreprise.objects.create(
            user=corp_user, nom='TechCorp', description='Tech', adresse='Paris',
            telephone='0600000000', nom_contact='Bob', email_contact='bob@corp.com',
        )
        self.corp_user = corp_user
        self.offer = make_offer(self.entreprise)
        self.cand = Candidature.objects.create(
            etudiant=self.student, offre=self.offer, statut='En_attente',
        )

    @patch('candidatures.views.create_notification')
    def test_convention_is_created_upon_acceptance(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(
            f'/api/v1/candidatures/{self.cand.pk}/statut/',
            {'statut': 'Acceptée'}, format='json',
        )
        self.assertTrue(ConventionDeStage.objects.filter(candidature=self.cand).exists())

    @patch('candidatures.views.create_notification')
    def test_convention_number_follows_conv_pk_format(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(
            f'/api/v1/candidatures/{self.cand.pk}/statut/',
            {'statut': 'Acceptée'}, format='json',
        )
        conv = ConventionDeStage.objects.get(candidature=self.cand)
        from django.utils import timezone
        year = timezone.now().year
        self.assertRegex(conv.numero_convention, rf'^Conv-{year}-\d{{3}}$')

    @patch('candidatures.views.create_notification')
    def test_initial_convention_status_is_en_attente_validation(self, _notify):
        self.client.force_authenticate(self.corp_user)
        self.client.patch(
            f'/api/v1/candidatures/{self.cand.pk}/statut/',
            {'statut': 'Acceptée'}, format='json',
        )
        conv = ConventionDeStage.objects.get(candidature=self.cand)
        self.assertEqual(conv.statut, 'En_attente_validation')

    @patch('candidatures.views.create_notification')
    def test_accepting_twice_does_not_create_duplicate_convention(self, _notify):
        self.client.force_authenticate(self.corp_user)
        url = f'/api/v1/candidatures/{self.cand.pk}/statut/'
        self.client.patch(url, {'statut': 'Acceptée'}, format='json')
        # Re-accept: get_or_create must not produce a second row
        self.offer.places_disponibles = 5
        self.offer.save()
        self.client.patch(url, {'statut': 'Acceptée'}, format='json')
        self.assertEqual(
            ConventionDeStage.objects.filter(candidature=self.cand).count(), 1,
        )


# ── 2. Convention Validation & Refusal (Chef de Département) ─────────────────

class ConventionValidationTests(TestCase):
    """
    ConventionDeStageViewSet.valider / .refuser:
      POST /api/v1/conventions/{pk}/valider/
      POST /api/v1/conventions/{pk}/refuser/
    Only Chef_Departement may act; students and enterprises are blocked.
    """

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('v')
        self.student_user = chain['student_user']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.candidature = chain['candidature']
        self.convention = chain['convention']

    @patch('conventions.views.create_notification')
    def test_chef_can_validate_a_pending_convention(self, _notify):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/valider/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.convention.refresh_from_db()
        self.assertEqual(self.convention.statut, 'Validée')

    @patch('conventions.views.create_notification')
    def test_validation_advances_candidature_to_stage_actif(self, _notify):
        self.client.force_authenticate(self.chef_user)
        self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/valider/', format='json',
        )
        self.candidature.refresh_from_db()
        self.assertEqual(self.candidature.statut, 'Stage_actif')

    @patch('conventions.views.create_notification')
    def test_validation_records_the_date_validation_timestamp(self, _notify):
        self.client.force_authenticate(self.chef_user)
        self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/valider/', format='json',
        )
        self.convention.refresh_from_db()
        self.assertIsNotNone(self.convention.date_validation)

    @patch('conventions.views.create_notification')
    def test_chef_can_refuse_a_convention_with_a_motif(self, _notify):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/refuser/',
            {'motif_refus': 'Documents manquants.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.convention.refresh_from_db()
        self.assertEqual(self.convention.statut, 'Refusée')
        self.assertEqual(self.convention.motif_refus, 'Documents manquants.')

    @patch('conventions.views.create_notification')
    def test_refusing_without_motif_returns_400_and_leaves_status_unchanged(self, _notify):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/refuser/', {}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.convention.refresh_from_db()
        self.assertEqual(self.convention.statut, 'En_attente_validation')

    @patch('conventions.views.create_notification')
    def test_student_cannot_validate_a_convention(self, _notify):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/valider/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.convention.refresh_from_db()
        self.assertEqual(self.convention.statut, 'En_attente_validation')

    @patch('conventions.views.create_notification')
    def test_enterprise_cannot_validate_a_convention(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/valider/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_validate(self):
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/valider/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── 3. Convention Signature ───────────────────────────────────────────────────

class ConventionSignatureTests(TestCase):
    """
    signer-etudiant: POST /api/v1/conventions/{pk}/signer-etudiant/  [IsStudent]
    signer-entreprise: POST /api/v1/conventions/{pk}/signer-entreprise/  [IsEnterprise]
    Cross-role signing attempts must be blocked.
    """

    def setUp(self):
        self.client = APIClient()
        chain = make_full_chain('s')
        self.student_user = chain['student_user']
        self.corp_user = chain['corp_user']
        self.chef_user = chain['chef_user']
        self.convention = chain['convention']
        # Validate the convention so it's in a sensible state for signing
        self.convention.statut = 'Validée'
        self.convention.save()

    @patch('conventions.views.create_notification')
    def test_student_can_sign_their_convention(self, _notify):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/signer-etudiant/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.convention.refresh_from_db()
        self.assertIsNotNone(self.convention.signe_par_etudiant_le)

    @patch('conventions.views.create_notification')
    def test_enterprise_can_sign_the_convention(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/signer-entreprise/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.convention.refresh_from_db()
        self.assertIsNotNone(self.convention.signe_par_entreprise_le)

    @patch('conventions.views.create_notification')
    def test_student_cannot_use_the_enterprise_signature_endpoint(self, _notify):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/signer-entreprise/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.convention.refresh_from_db()
        self.assertIsNone(self.convention.signe_par_entreprise_le)

    @patch('conventions.views.create_notification')
    def test_enterprise_cannot_use_the_student_signature_endpoint(self, _notify):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/signer-etudiant/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.convention.refresh_from_db()
        self.assertIsNone(self.convention.signe_par_etudiant_le)

    @patch('conventions.views.create_notification')
    def test_chef_cannot_sign_as_a_student(self, _notify):
        self.client.force_authenticate(self.chef_user)
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/signer-etudiant/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_sign(self):
        response = self.client.post(
            f'/api/v1/conventions/{self.convention.pk}/signer-etudiant/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── 4. Auto-Rejection of Expired Conventions ─────────────────────────────────

class AutoRejectionTaskTests(TestCase):
    """
    auto_reject_expired_conventions() (conventions/tasks.py):
    - Conventions pending for > 3 days are automatically refused.
    - Fresh, already-validated, and already-refused conventions are untouched.
    - Two notifications are sent per rejection (student + enterprise).
    The task is called directly (synchronously) — no Celery broker required.
    """

    def setUp(self):
        dept = make_dept('ar')
        student_user = make_user('ar_student@test.com', 'Étudiant')
        self.student = Etudiant.objects.create(
            user=student_user, prenom='Alice', nom='Dupont', departement=dept,
        )
        corp_user = make_user('ar_corp@test.com', 'Entreprise')
        self.entreprise = Entreprise.objects.create(
            user=corp_user, nom='TechCorp', description='Tech', adresse='Paris',
            telephone='0600000000', nom_contact='Bob', email_contact='bob@corp.com',
        )

    def _make_convention(self, numero, days_old=0, statut='En_attente_validation'):
        """
        Create an offer + candidature + convention.
        Each call uses a distinct offer so the (etudiant, offre) unique constraint
        is never violated when a single test creates several conventions.
        """
        offer = OffreDeStage.objects.create(
            entreprise=self.entreprise,
            titre=f'Offre pour {numero}',
            description='Test',
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 8, 31),
            localisation='Paris',
            domaine='Informatique',
            places_disponibles=1,
        )
        candidature = Candidature.objects.create(
            etudiant=self.student, offre=offer, statut='En_attente',
        )
        conv = ConventionDeStage.objects.create(
            candidature=candidature,
            numero_convention=numero,
            statut=statut,
        )
        if days_old:
            old_time = timezone.now() - timedelta(days=days_old)
            ConventionDeStage.objects.filter(pk=conv.pk).update(cree_le=old_time)
            conv.refresh_from_db()
        return conv

    # ── Rejection logic ─────────────────────────────────────

    @patch('conventions.tasks.create_notification')
    def test_convention_older_than_3_days_is_rejected(self, _notify):
        conv = self._make_convention('CONV-OLD', days_old=4)
        auto_reject_expired_conventions()
        conv.refresh_from_db()
        self.assertEqual(conv.statut, 'Refusée')

    @patch('conventions.tasks.create_notification')
    def test_rejected_convention_has_a_system_motif(self, _notify):
        conv = self._make_convention('CONV-MOTIF', days_old=4)
        auto_reject_expired_conventions()
        conv.refresh_from_db()
        self.assertIsNotNone(conv.motif_refus)
        self.assertGreater(len(conv.motif_refus), 0)

    @patch('conventions.tasks.create_notification')
    def test_fresh_convention_is_not_rejected(self, _notify):
        conv = self._make_convention('CONV-FRESH', days_old=0)
        auto_reject_expired_conventions()
        conv.refresh_from_db()
        self.assertEqual(conv.statut, 'En_attente_validation')

    @patch('conventions.tasks.create_notification')
    def test_convention_at_boundary_under_3_days_is_not_rejected(self, _notify):
        # 2 days 23 hours old — still within the 3-day window
        almost_expired = timezone.now() - timedelta(days=2, hours=23)
        conv = self._make_convention('CONV-BOUNDARY', days_old=0)
        ConventionDeStage.objects.filter(pk=conv.pk).update(cree_le=almost_expired)
        auto_reject_expired_conventions()
        conv.refresh_from_db()
        self.assertEqual(conv.statut, 'En_attente_validation')

    # ── Already-processed conventions are untouched ─────────

    @patch('conventions.tasks.create_notification')
    def test_already_validated_convention_is_not_affected(self, _notify):
        conv = self._make_convention('CONV-VALID', days_old=5, statut='Validée')
        auto_reject_expired_conventions()
        conv.refresh_from_db()
        self.assertEqual(conv.statut, 'Validée')

    @patch('conventions.tasks.create_notification')
    def test_already_refused_convention_is_not_affected(self, _notify):
        conv = self._make_convention('CONV-REFUSED', days_old=5, statut='Refusée')
        auto_reject_expired_conventions()
        conv.refresh_from_db()
        self.assertEqual(conv.statut, 'Refusée')

    # ── Batch correctness ───────────────────────────────────

    @patch('conventions.tasks.create_notification')
    def test_only_expired_conventions_are_rejected_in_a_mixed_batch(self, _notify):
        expired = self._make_convention('CONV-EXPIRE', days_old=4)
        fresh = self._make_convention('CONV-NEW', days_old=0)
        auto_reject_expired_conventions()
        expired.refresh_from_db()
        fresh.refresh_from_db()
        self.assertEqual(expired.statut, 'Refusée')
        self.assertEqual(fresh.statut, 'En_attente_validation')

    @patch('conventions.tasks.create_notification')
    def test_two_notifications_are_sent_per_rejected_convention(self, mock_notify):
        # Each rejection triggers one notification to the student and one to the enterprise
        self._make_convention('CONV-N1', days_old=4)
        self._make_convention('CONV-N2', days_old=5)
        auto_reject_expired_conventions()
        # 2 rejected conventions × 2 notifications = 4 calls
        self.assertEqual(mock_notify.call_count, 4)

    @patch('conventions.tasks.create_notification')
    def test_task_returns_count_of_rejected_conventions(self, _notify):
        self._make_convention('CONV-R1', days_old=4)
        self._make_convention('CONV-R2', days_old=6)
        result = auto_reject_expired_conventions()
        self.assertIn('2', result)

    @patch('conventions.tasks.create_notification')
    def test_task_with_no_expired_conventions_returns_early(self, mock_notify):
        self._make_convention('CONV-FRESH2', days_old=0)
        result = auto_reject_expired_conventions()
        mock_notify.assert_not_called()
        self.assertIn('No expired', result)
