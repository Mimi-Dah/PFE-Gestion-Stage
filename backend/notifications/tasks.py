from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(bind=True, max_retries=2)
def send_notification_email(self, user_email, titre, message, lien=None):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    body = message
    if lien:
        body += f"\n\n→ {frontend_url}{lien}"
    body += "\n\n---\nL'équipe StageFlow — Ne pas répondre à cet email."

    try:
        send_mail(
            subject=f"StageFlow — {titre}",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
