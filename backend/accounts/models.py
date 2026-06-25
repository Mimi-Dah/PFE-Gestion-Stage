from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, courriel, password=None, **extra_fields):
        if not courriel:
            raise ValueError('Le courriel est obligatoire')
        courriel = self.normalize_email(courriel)
        user = self.model(courriel=courriel, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, courriel, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Admin')
        return self.create_user(courriel, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('Étudiant', 'Étudiant'),
        ('Entreprise', 'Entreprise'),
        ('Chef_Departement', 'Chef de Département'),
        ('Admin', 'Admin'),
    )

    id_utilisateur    = models.AutoField(primary_key=True)
    courriel          = models.EmailField(unique=True)
    role              = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_verified       = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, null=True, blank=True)
    cree_le           = models.DateTimeField(auto_now_add=True)
    mis_a_jour_le     = models.DateTimeField(auto_now=True)

    # Required for Django admin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'courriel'
    REQUIRED_FIELDS = []

    @property
    def id(self):
        return self.id_utilisateur

    def __str__(self):
        return f"{self.courriel} ({self.role})"

class Etudiant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profil_etudiant')
    photo = models.ImageField(upload_to='photos/', null=True, blank=True)
    prenom = models.CharField(max_length=100)
    nom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, null=True, blank=True)
    adresse = models.TextField(null=True, blank=True)
    departement = models.ForeignKey('etablissements.Departement', on_delete=models.SET_NULL, null=True)
    universite = models.CharField(max_length=255, null=True, blank=True)
    specialite = models.CharField(max_length=255, null=True, blank=True)
    matricule = models.CharField(max_length=100, null=True, blank=True)
    date_de_naissance = models.DateField(null=True, blank=True)
    niveau_academique = models.CharField(max_length=100, null=True, blank=True)
    cv = models.FileField(upload_to='cvs/', null=True, blank=True)
    lettre_motivation = models.FileField(upload_to='cvs/', null=True, blank=True)

    def is_profile_complete(self):
        return all([self.photo, self.prenom, self.nom, self.telephone, self.adresse, self.departement, self.niveau_academique, self.cv, self.date_de_naissance])

    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.user.courriel}"

class Entreprise(models.Model):
    id_entreprise = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profil_entreprise')
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    nom = models.CharField(max_length=255)
    description = models.TextField()
    adresse = models.TextField()
    telephone = models.CharField(max_length=20)
    site_web = models.URLField(null=True, blank=True)
    nom_contact = models.CharField(max_length=100)
    email_contact = models.EmailField()

    def is_profile_complete(self):
        return all([self.logo, self.nom, self.description and len(self.description) >= 100, self.adresse, self.telephone, self.nom_contact, self.email_contact])

    def __str__(self):
        return self.nom

class ChefDepartement(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profil_chef')
    departement = models.OneToOneField('etablissements.Departement', on_delete=models.CASCADE)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.prenom} {self.nom} - Chef de Département"
