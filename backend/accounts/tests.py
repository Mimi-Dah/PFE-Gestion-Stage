from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise

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


# ── 1. User Registration ─────────────────────────────────────────────────────

class UserRegistrationTests(TestCase):
    """
    RegisterView: POST /api/v1/auth/register/
    Uses MultiPartParser. Email sending is wrapped in try/except — no mock needed.
    """

    URL = '/api/v1/auth/register/'

    def setUp(self):
        self.client = APIClient()

    def test_student_registration_creates_user_and_etudiant_profile(self):
        dept = make_dept()
        response = self.client.post(self.URL, {
            'courriel': 'new_student@test.com',
            'password': 'TestPass123!',
            'role': 'Étudiant',
            'prenom': 'Alice',
            'nom': 'Dupont',
            'departement_id': dept.pk,
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(courriel='new_student@test.com')
        self.assertEqual(user.role, 'Étudiant')
        self.assertTrue(hasattr(user, 'profil_etudiant'))
        self.assertEqual(user.profil_etudiant.prenom, 'Alice')

    def test_enterprise_registration_creates_user_and_entreprise_profile(self):
        response = self.client.post(self.URL, {
            'courriel': 'corp@test.com',
            'password': 'TestPass123!',
            'role': 'Entreprise',
            'nom_entreprise': 'CorpX',
            'description': 'A great company',
            'adresse_entreprise': 'Lyon',
            'telephone_entreprise': '0600000001',
            'nom_contact': 'Jean',
            'email_contact': 'jean@corp.com',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Entreprise.objects.filter(nom='CorpX').exists())

    def test_chef_departement_registration_via_public_endpoint_is_blocked(self):
        # Chef accounts must be created by an admin — public self-registration is forbidden.
        response = self.client.post(self.URL, {
            'courriel': 'chef@test.com',
            'password': 'TestPass123!',
            'role': 'Chef_Departement',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(courriel='chef@test.com').exists())

    def test_duplicate_email_is_rejected(self):
        make_user('existing@test.com', 'Étudiant')
        response = self.client.post(self.URL, {
            'courriel': 'existing@test.com',
            'password': 'TestPass123!',
            'role': 'Étudiant',
        }, format='multipart')
        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(courriel='existing@test.com').count(), 1)

    @override_settings(DEBUG=True)
    def test_new_user_is_auto_verified_in_debug(self):
        self.client.post(self.URL, {
            'courriel': 'debug_user@test.com',
            'password': 'TestPass123!',
            'role': 'Étudiant',
        }, format='multipart')
        user = User.objects.get(courriel='debug_user@test.com')
        self.assertTrue(user.is_verified)
        self.assertIsNone(user.verification_token)

    @override_settings(DEBUG=False, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_new_user_is_unverified_in_production(self):
        self.client.post(self.URL, {
            'courriel': 'prod_user@test.com',
            'password': 'TestPass123!',
            'role': 'Étudiant',
        }, format='multipart')
        user = User.objects.get(courriel='prod_user@test.com')
        self.assertFalse(user.is_verified)
        self.assertIsNotNone(user.verification_token)


# ── 2. Email Verification ────────────────────────────────────────────────────

class EmailVerificationTests(TestCase):
    """VerifyEmailView: POST /api/v1/auth/verify/"""

    URL = '/api/v1/auth/verify/'

    def setUp(self):
        self.client = APIClient()

    def test_valid_token_marks_user_as_verified_and_clears_token(self):
        user = User.objects.create_user(
            courriel='unverified@test.com', password='TestPass123!',
            role='Étudiant', is_verified=False, verification_token='valid-tok-abc',
        )
        response = self.client.post(self.URL, {'token': 'valid-tok-abc'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        self.assertIsNone(user.verification_token)

    def test_invalid_token_returns_400(self):
        response = self.client.post(self.URL, {'token': 'not-a-real-token'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_token_returns_400(self):
        response = self.client.post(self.URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_from_already_verified_user_is_rejected(self):
        # Verified users have verification_token=None; no unverified user matches.
        User.objects.create_user(
            courriel='verified@test.com', password='TestPass123!',
            role='Étudiant', is_verified=True, verification_token=None,
        )
        response = self.client.post(self.URL, {'token': 'any-old-token'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── 3. JWT Authentication ────────────────────────────────────────────────────

class JWTAuthTests(TestCase):
    """TokenObtainPairView: POST /api/v1/auth/login/"""

    URL = '/api/v1/auth/login/'

    def setUp(self):
        self.client = APIClient()

    def test_correct_credentials_return_jwt_token_pair(self):
        make_user('ok@test.com', 'Étudiant', password='TestPass123!')
        response = self.client.post(
            self.URL, {'courriel': 'ok@test.com', 'password': 'TestPass123!'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_wrong_password_is_rejected(self):
        make_user('bad@test.com', 'Étudiant', password='TestPass123!')
        response = self.client.post(
            self.URL, {'courriel': 'bad@test.com', 'password': 'WrongPass!'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_user_cannot_obtain_token(self):
        make_user('inactive@test.com', 'Étudiant', password='TestPass123!', is_active=False)
        response = self.client.post(
            self.URL, {'courriel': 'inactive@test.com', 'password': 'TestPass123!'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_email_is_rejected(self):
        response = self.client.post(
            self.URL, {'courriel': 'ghost@test.com', 'password': 'TestPass123!'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── 4. Role-Based Access: Admin User Management ──────────────────────────────

class AdminUserManagementTests(TestCase):
    """
    UserManagementView: GET/PATCH /api/v1/admin/utilisateurs/
    Paginated response shape: { count, next, previous, results: [...] }
    """

    LIST_URL = '/api/v1/admin/utilisateurs/'

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('admin@test.com', 'Admin')
        self.student = make_user('student@test.com', 'Étudiant')

    # ── Listing & filtering ─────────────────────────────────

    def test_admin_receives_paginated_response(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        self.assertGreaterEqual(response.data['count'], 2)

    def test_search_param_filters_by_email_substring(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.LIST_URL, {'search': 'student@test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u['courriel'] for u in response.data['results']]
        self.assertIn('student@test.com', emails)
        self.assertNotIn('admin@test.com', emails)

    def test_role_param_returns_only_users_with_that_role(self):
        make_user('corp@test.com', 'Entreprise')
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.LIST_URL, {'role': 'Étudiant'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for user_data in response.data['results']:
            self.assertEqual(user_data['role'], 'Étudiant')

    def test_non_admin_is_forbidden(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get(self.LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Toggling active status ──────────────────────────────

    def test_admin_can_deactivate_a_user(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}{self.student.pk}/', {'is_active': False}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)

    def test_admin_can_reactivate_a_deactivated_user(self):
        self.student.is_active = False
        self.student.save()
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}{self.student.pk}/', {'is_active': True}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_active)

    # ── Role management ─────────────────────────────────────

    def test_admin_can_change_another_users_role(self):
        target = make_user('target@test.com', 'Étudiant')
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}{target.pk}/', {'role': 'Entreprise'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        target.refresh_from_db()
        self.assertEqual(target.role, 'Entreprise')

    def test_admin_cannot_change_their_own_role(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}{self.admin.pk}/', {'role': 'Étudiant'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, 'Admin')

    def test_invalid_role_value_is_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}{self.student.pk}/', {'role': 'Supervillain'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'Étudiant')

    def test_patch_nonexistent_user_returns_404(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}99999/', {'is_active': False}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_with_no_fields_returns_400(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'{self.LIST_URL}{self.student.pk}/', {}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
