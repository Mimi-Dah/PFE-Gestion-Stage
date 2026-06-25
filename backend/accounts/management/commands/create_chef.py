from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import ChefDepartement
from etablissements.models import Departement
import secrets
import string

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a Chef de Département user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Email of the chef')
        parser.add_argument('--departement', type=str, required=True, help='Name of the department')
        parser.add_argument('--prenom', type=str, default='Chef', help='First name')
        parser.add_argument('--nom', type=str, default='Dept', help='Last name')
        parser.add_argument('--password', type=str, help='Password for the account (randomly generated if omitted)')

    def handle(self, *args, **options):
        email = options['email']
        dept_name = options['departement']
        prenom = options['prenom']
        nom = options['nom']
        password = options['password']

        if not password:
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for i in range(12))

        try:
            dept = Departement.objects.get(nom=dept_name)
        except Departement.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Department "{dept_name}" does not exist.'))
            return

        if User.objects.filter(courriel=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists.'))
            return
            
        if ChefDepartement.objects.filter(departement=dept).exists():
            self.stdout.write(self.style.ERROR(f'Department "{dept_name}" already has a chef assigned.'))
            return

        user = User.objects.create_user(
            courriel=email,
            password=password,
            role='Chef_Departement',
            is_verified=True,
            is_staff=False
        )

        ChefDepartement.objects.create(
            user=user,
            departement=dept,
            prenom=prenom,
            nom=nom
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created Chef de Département: {email}'))
        self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
        self.stdout.write(self.style.WARNING(f'Please save this password securely.'))
