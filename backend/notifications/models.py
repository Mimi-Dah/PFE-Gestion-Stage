from django.db import models

class Notification(models.Model):
    id_notification = models.AutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    titre = models.CharField(max_length=255)
    message = models.TextField()
    est_lue = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)
    type_event = models.CharField(max_length=100) # Ex: Inscription_confirmee, Nouvelle_candidature
    lien = models.CharField(max_length=255, null=True, blank=True) # Deep link in-app

    class Meta:
        ordering = ['-cree_le']

    def __str__(self):
        return f"{self.titre} -> {self.user.courriel}"
