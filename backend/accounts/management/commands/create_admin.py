from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from internhub_backend.exceptions import BadRequestError

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates an internHub Admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Email of the admin')
        parser.add_argument('--password', type=str, required=True, help='Password for the admin')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        if User.objects.filter(courriel=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists.'))
            return

        user = User.objects.create_user(
            courriel=email,
            password=password,
            role='Admin',
            is_verified=True,
            is_staff=False # As per CDC 1.1 section 2.3
        )
        self.stdout.write(self.style.SUCCESS(f'Successfully created Admin user: {email}'))
