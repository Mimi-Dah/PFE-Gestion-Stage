from datetime import date
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from etablissements.models import Etablissement, Departement
from accounts.models import Etudiant, Entreprise
from offres.models import OffreDeStage, Favori
from offres.views import _level_score, _domain_score, _score_offer

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

def make_student(courriel='student@test.com', dept=None, niveau='Master 2'):
    user = make_user(courriel, 'Étudiant')
    profile = Etudiant.objects.create(
        user=user, prenom='Alice', nom='Dupont',
        departement=dept, niveau_academique=niveau,
    )
    return user, profile

def make_enterprise(courriel='corp@test.com'):
    user = make_user(courriel, 'Entreprise')
    profile = Entreprise.objects.create(
        user=user, nom='TechCorp', description='A tech company', adresse='Paris',
        telephone='0600000000', nom_contact='Bob', email_contact='bob@corp.com',
    )
    return user, profile

def make_offer(entreprise, statut='Active', domaine='Informatique', exigences=''):
    return OffreDeStage.objects.create(
        entreprise=entreprise,
        titre='Stage Dev',
        description='Développement logiciel',
        exigences=exigences,
        date_debut=date(2026, 6, 1),
        date_fin=date(2026, 8, 31),
        localisation='Paris',
        domaine=domaine,
        places_disponibles=2,
        statut=statut,
    )


# ── 1. Offer Model Behaviour ──────────────────────────────────────────────────

class OffreModelTests(TestCase):
    """Unit-level tests for OffreDeStage model logic."""

    def setUp(self):
        _, self.entreprise = make_enterprise()

    def test_duree_semaines_is_computed_on_save(self):
        # 91 days → 13 complete weeks
        offer = OffreDeStage.objects.create(
            entreprise=self.entreprise,
            titre='Stage',
            description='Desc',
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 8, 31),
            localisation='Paris',
            domaine='Info',
            places_disponibles=1,
        )
        self.assertEqual(offer.duree_semaines, 13)

    def test_duree_semaines_updates_when_dates_change(self):
        offer = OffreDeStage.objects.create(
            entreprise=self.entreprise,
            titre='Stage',
            description='Desc',
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 6, 29),  # 28 days → 4 weeks
            localisation='Paris',
            domaine='Info',
            places_disponibles=1,
        )
        offer.date_fin = date(2026, 7, 27)  # 56 days → 8 weeks
        offer.save()
        offer.refresh_from_db()
        self.assertEqual(offer.duree_semaines, 8)

    def test_default_statut_is_active(self):
        offer = OffreDeStage.objects.create(
            entreprise=self.entreprise,
            titre='Stage',
            description='Desc',
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 8, 31),
            localisation='Paris',
            domaine='Info',
            places_disponibles=1,
        )
        self.assertEqual(offer.statut, 'Active')


# ── 2. Offer Access Control ───────────────────────────────────────────────────

class OfferAccessControlTests(TestCase):
    """
    OffreDeStageViewSet: GET/POST/PATCH/DELETE /api/v1/offres/
    Enterprises own their offers; students and others have read-only access.
    """

    URL = '/api/v1/offres/'

    def setUp(self):
        self.client = APIClient()
        self.dept = make_dept()
        self.corp_user, self.entreprise = make_enterprise('corp1@test.com')
        self.corp2_user, self.entreprise2 = make_enterprise('corp2@test.com')
        self.student_user, self.student = make_student(dept=self.dept)
        self.offer = make_offer(self.entreprise)

    # ── Browsing ────────────────────────────────────────────

    def test_authenticated_student_can_list_active_offers(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_student_list_excludes_closed_offers(self):
        make_offer(self.entreprise, statut='Fermée')
        self.client.force_authenticate(self.student_user)
        response = self.client.get(self.URL)
        results = response.data.get('results', response.data)
        for offer in results:
            self.assertEqual(offer['statut'], 'Active')

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Creation ────────────────────────────────────────────

    def test_enterprise_can_create_an_offer(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.post(self.URL, {
            'titre': 'Nouveau Stage',
            'description': 'Développement Python',
            'date_debut': '2026-06-01',
            'date_fin': '2026-08-31',
            'localisation': 'Remote',
            'domaine': 'Développement',
            'places_disponibles': 1,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Offer is automatically linked to the authenticated enterprise
        offer = OffreDeStage.objects.get(titre='Nouveau Stage')
        self.assertEqual(offer.entreprise, self.entreprise)

    def test_student_cannot_create_an_offer(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(self.URL, {
            'titre': 'Hacked Stage',
            'description': 'Desc',
            'date_debut': '2026-06-01',
            'date_fin': '2026-08-31',
            'localisation': 'Paris',
            'domaine': 'Info',
            'places_disponibles': 1,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── Editing & ownership ─────────────────────────────────

    def test_enterprise_can_update_their_own_offer(self):
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(
            f'{self.URL}{self.offer.pk}/', {'titre': 'Stage Modifié'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.offer.refresh_from_db()
        self.assertEqual(self.offer.titre, 'Stage Modifié')

    def test_enterprise_cannot_update_another_enterprises_offer(self):
        offer2 = make_offer(self.entreprise2)
        self.client.force_authenticate(self.corp_user)
        response = self.client.patch(
            f'{self.URL}{offer2.pk}/', {'titre': 'Stolen Stage'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── mes-offres scoped endpoint ──────────────────────────

    def test_mes_offres_returns_only_the_enterprises_own_offers(self):
        make_offer(self.entreprise2)
        self.client.force_authenticate(self.corp_user)
        response = self.client.get(f'{self.URL}mes-offres/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # mes-offres returns a plain list; paginated endpoints return a dict
        data = response.data
        results = data.get('results', data) if isinstance(data, dict) else data
        for offer_data in results:
            # entreprise is a nested object; check its pk
            self.assertEqual(offer_data['entreprise']['id_entreprise'], self.entreprise.pk)

    def test_student_cannot_access_mes_offres(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.get(f'{self.URL}mes-offres/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── Favourites toggle ───────────────────────────────────

    def test_student_can_favourite_an_offer(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.post(f'{self.URL}{self.offer.pk}/favori/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Favori.objects.filter(etudiant=self.student, offre=self.offer).exists()
        )

    def test_favouriting_an_already_favourited_offer_removes_it(self):
        Favori.objects.create(etudiant=self.student, offre=self.offer)
        self.client.force_authenticate(self.student_user)
        response = self.client.post(f'{self.URL}{self.offer.pk}/favori/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            Favori.objects.filter(etudiant=self.student, offre=self.offer).exists()
        )


# ── 3. Matching Score Helpers ─────────────────────────────────────────────────

class LevelScoreTests(TestCase):
    """Unit tests for the _level_score helper (offres/views.py)."""

    def test_exact_level_match_returns_30(self):
        self.assertEqual(_level_score('Master 2', 'bac+5'), 30)

    def test_one_tier_off_returns_20(self):
        # Student: M2 (tier 7), required: M1 (tier 6) → diff 1
        self.assertEqual(_level_score('Master 2', 'Master 1'), 20)

    def test_two_tiers_off_returns_10(self):
        # Student: M2 (tier 7), required: L3 (tier 5) → diff 2
        self.assertEqual(_level_score('Master 2', 'Licence 3'), 10)

    def test_unrecognised_student_level_returns_0(self):
        self.assertEqual(_level_score('Doctorat', 'bac+5'), 0)

    def test_no_level_requirement_in_offer_returns_10(self):
        # Neutral partial credit when the offer has no level requirement
        self.assertEqual(_level_score('Master 2', ''), 10)


class DomainScoreTests(TestCase):
    """Unit tests for the _domain_score helper (offres/views.py)."""

    def test_matching_domain_returns_nonzero_score(self):
        score = _domain_score('Informatique', 'Informatique')
        self.assertGreater(score, 0)

    def test_unrelated_domains_return_zero(self):
        self.assertEqual(_domain_score('Biologie', 'Finance'), 0)

    def test_empty_department_returns_zero(self):
        self.assertEqual(_domain_score('', 'Informatique'), 0)

    def test_empty_offer_domain_returns_zero(self):
        self.assertEqual(_domain_score('Informatique', ''), 0)

    def test_partial_match_via_substring_gives_partial_score(self):
        # "informatique" is contained within "Développement Informatique"
        score = _domain_score('Informatique', 'Développement Informatique')
        self.assertGreater(score, 0)


class ScoreOfferTests(TestCase):
    """Integration tests for _score_offer — total score stays within 0–100."""

    def setUp(self):
        _, entreprise = make_enterprise()
        self.offer = make_offer(
            entreprise,
            domaine='Informatique',
            exigences='Master 2 requis, compétences en développement informatique',
        )

    def test_score_is_within_valid_range(self):
        score = _score_offer(self.offer, 'Informatique', 'Master 2', set())
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_matching_profile_scores_higher_than_mismatched_profile(self):
        good_score = _score_offer(self.offer, 'Informatique', 'Master 2', {'Informatique'})
        poor_score = _score_offer(self.offer, 'Biologie', 'BTS', set())
        self.assertGreater(good_score, poor_score)

    def test_past_domain_match_increases_score(self):
        without_history = _score_offer(self.offer, 'Informatique', 'Master 2', set())
        with_history = _score_offer(
            self.offer, 'Informatique', 'Master 2', {'Informatique'},
        )
        self.assertGreaterEqual(with_history, without_history)
