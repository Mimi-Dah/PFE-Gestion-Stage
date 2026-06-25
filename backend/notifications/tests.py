from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from notifications.models import Notification
from notifications.utils import create_notification

User = get_user_model()

# ── Factories ─────────────────────────────────────────────────────────────────

def make_user(courriel, role, **kwargs):
    defaults = {'is_verified': True, 'is_active': True}
    defaults.update(kwargs)
    return User.objects.create_user(courriel=courriel, password='TestPass123!', role=role, **defaults)


def make_notification(user, titre='Info', est_lue=False):
    return Notification.objects.create(
        user=user,
        titre=titre,
        message='Ceci est un message de test.',
        type_event='Test_event',
        lien='/espace/test',
        est_lue=est_lue,
    )


# ── 1. Notification Listing ───────────────────────────────────────────────────

class NotificationListTests(TestCase):
    """
    NotificationViewSet: GET /api/v1/notifications/
    Each user sees only their own notifications.
    """

    URL = '/api/v1/notifications/'

    def setUp(self):
        self.client = APIClient()
        self.user1 = make_user('user1@test.com', 'Étudiant')
        self.user2 = make_user('user2@test.com', 'Entreprise')
        self.notif1 = make_notification(self.user1, titre='Pour user1')
        self.notif2 = make_notification(self.user2, titre='Pour user2')

    def test_user_sees_only_their_own_notifications(self):
        self.client.force_authenticate(self.user1)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [n['id_notification'] for n in response.data['results']]
        self.assertIn(self.notif1.pk, ids)
        self.assertNotIn(self.notif2.pk, ids)

    def test_another_user_only_sees_their_notifications(self):
        self.client.force_authenticate(self.user2)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [n['id_notification'] for n in response.data['results']]
        self.assertIn(self.notif2.pk, ids)
        self.assertNotIn(self.notif1.pk, ids)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unread_notifications_have_est_lue_false_by_default(self):
        self.client.force_authenticate(self.user1)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notifs = [n for n in response.data['results'] if n['id_notification'] == self.notif1.pk]
        self.assertFalse(notifs[0]['est_lue'])


# ── 2. Mark Single Notification as Read ──────────────────────────────────────

class MarkNotificationReadTests(TestCase):
    """
    NotificationViewSet.marquer_lue: PATCH /api/v1/notifications/{pk}/marquer-lue/
    """

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('reader@test.com', 'Étudiant')
        self.other = make_user('other@test.com', 'Étudiant')
        self.notif = make_notification(self.user)

    def test_owner_can_mark_notification_as_read(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            f'/api/v1/notifications/{self.notif.pk}/marquer-lue/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.est_lue)

    def test_other_user_cannot_access_foreign_notification(self):
        # get_queryset filters by user, so the other user gets a 404
        self.client.force_authenticate(self.other)
        response = self.client.patch(
            f'/api/v1/notifications/{self.notif.pk}/marquer-lue/', format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.notif.refresh_from_db()
        self.assertFalse(self.notif.est_lue)


# ── 3. Mark All Notifications as Read ────────────────────────────────────────

class MarkAllNotificationsReadTests(TestCase):
    """
    NotificationViewSet.tout_marquer_lue: PATCH /api/v1/notifications/tout-marquer-lue/
    """

    URL = '/api/v1/notifications/tout-marquer-lue/'

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('all@test.com', 'Étudiant')
        self.n1 = make_notification(self.user, titre='Notif 1')
        self.n2 = make_notification(self.user, titre='Notif 2')
        self.n3 = make_notification(self.user, titre='Notif 3', est_lue=True)

    def test_all_unread_notifications_are_marked_as_read(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(self.URL, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.n2.refresh_from_db()
        self.assertTrue(self.n1.est_lue)
        self.assertTrue(self.n2.est_lue)

    def test_already_read_notification_remains_read(self):
        self.client.force_authenticate(self.user)
        self.client.patch(self.URL, format='json')
        self.n3.refresh_from_db()
        self.assertTrue(self.n3.est_lue)


# ── 4. create_notification Utility ───────────────────────────────────────────

class CreateNotificationUtilTests(TestCase):
    """Unit tests for the create_notification() helper."""

    def setUp(self):
        self.user = make_user('util@test.com', 'Étudiant')

    def test_create_notification_persists_to_database(self):
        create_notification(
            user=self.user,
            titre='Test',
            message='Un message.',
            type_event='Test_event',
            lien='/test',
        )
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 1)

    def test_created_notification_has_correct_fields(self):
        create_notification(
            user=self.user,
            titre='Titre Test',
            message='Corps du message.',
            type_event='Nouveau_badge',
            lien='/espace/badges',
        )
        notif = Notification.objects.get(user=self.user)
        self.assertEqual(notif.titre, 'Titre Test')
        self.assertEqual(notif.type_event, 'Nouveau_badge')
        self.assertFalse(notif.est_lue)

    def test_notification_is_unread_by_default(self):
        create_notification(
            user=self.user,
            titre='Par défaut',
            message='Non lue.',
            type_event='Test',
            lien='/test',
        )
        notif = Notification.objects.get(user=self.user)
        self.assertFalse(notif.est_lue)
