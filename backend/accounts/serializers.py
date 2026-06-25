import secrets
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Etudiant, Entreprise, ChefDepartement
from etablissements.models import Departement
from internhub_backend.exceptions import ValidationError as AppValidationError

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id_utilisateur', 'courriel', 'role', 'is_active', 'is_verified', 'cree_le')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    # Etudiant fields
    prenom = serializers.CharField(required=False, write_only=True)
    nom = serializers.CharField(required=False, write_only=True)
    telephone = serializers.CharField(required=False, write_only=True)
    adresse = serializers.CharField(required=False, write_only=True)
    universite = serializers.CharField(required=False, allow_blank=True, write_only=True)
    specialite = serializers.CharField(required=False, allow_blank=True, write_only=True)
    matricule = serializers.CharField(required=False, allow_blank=True, write_only=True)
    niveau_academique = serializers.CharField(required=False, write_only=True)
    departement_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    photo = serializers.ImageField(required=False, allow_null=True, write_only=True)
    cv = serializers.FileField(required=False, allow_null=True, write_only=True)
    lettre_motivation = serializers.FileField(required=False, allow_null=True, write_only=True)
    date_de_naissance = serializers.DateField(required=False, allow_null=True, write_only=True)
    
    # Entreprise fields
    nom_entreprise = serializers.CharField(required=False, write_only=True)
    description = serializers.CharField(required=False, write_only=True)
    adresse_entreprise = serializers.CharField(required=False, write_only=True)
    telephone_entreprise = serializers.CharField(required=False, write_only=True)
    site_web = serializers.URLField(required=False, allow_blank=True, allow_null=True, write_only=True)
    nom_contact = serializers.CharField(required=False, write_only=True)
    email_contact = serializers.EmailField(required=False, allow_null=True, write_only=True)
    logo = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = (
            'courriel', 'password', 'role',
            'prenom', 'nom', 'telephone', 'adresse',
            'universite', 'specialite', 'matricule',
            'niveau_academique', 'departement_id', 'photo', 'cv', 'lettre_motivation', 'date_de_naissance',
            'nom_entreprise', 'description', 'adresse_entreprise', 'telephone_entreprise', 'site_web', 'nom_contact', 'email_contact', 'logo'
        )

    def validate(self, data):
        role = data.get('role')
        if role == 'Chef_Departement':
            raise AppValidationError("Chef de Département must be created by an administrator.")
        return data

    def create(self, validated_data):
        # Extract everything
        etudiant_data = {
            'prenom': validated_data.pop('prenom', ''),
            'nom': validated_data.pop('nom', ''),
            'telephone': validated_data.pop('telephone', ''),
            'adresse': validated_data.pop('adresse', ''),
            'universite': validated_data.pop('universite', ''),
            'specialite': validated_data.pop('specialite', ''),
            'matricule': validated_data.pop('matricule', ''),
            'niveau_academique': validated_data.pop('niveau_academique', ''),
            'photo': validated_data.pop('photo', None),
            'cv': validated_data.pop('cv', None),
            'lettre_motivation': validated_data.pop('lettre_motivation', None),
            'date_de_naissance': validated_data.pop('date_de_naissance', None),
        }
        dept_id = validated_data.pop('departement_id', None)
        
        entreprise_data = {
            'nom': validated_data.pop('nom_entreprise', ''),
            'description': validated_data.pop('description', ''),
            'adresse': validated_data.pop('adresse_entreprise', ''),
            'telephone': validated_data.pop('telephone_entreprise', ''),
            'site_web': validated_data.pop('site_web', ''),
            'nom_contact': validated_data.pop('nom_contact', ''),
            'email_contact': validated_data.pop('email_contact', ''),
            'logo': validated_data.pop('logo', None),
        }

        user = User.objects.create_user(
            courriel=validated_data['courriel'],
            password=validated_data['password'],
            role=validated_data['role'],
            verification_token=secrets.token_urlsafe(32),
        )

        if user.role == 'Étudiant':
            dept = None
            if dept_id:
                try:
                   dept = Departement.objects.get(id=dept_id)
                except Departement.DoesNotExist:
                   pass
            Etudiant.objects.create(user=user, departement=dept, **etudiant_data)
        elif user.role == 'Entreprise':
            if not entreprise_data['email_contact']:
                entreprise_data['email_contact'] = user.courriel
            Entreprise.objects.create(user=user, **entreprise_data)
            
        return user

class EtudiantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True)
    
    class Meta:
        model = Etudiant
        fields = '__all__'

class EntrepriseSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Entreprise
        fields = '__all__'

class ChefDepartementSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True)
    
    class Meta:
        model = ChefDepartement
        fields = '__all__'

class ChefCreateSerializer(serializers.Serializer):
    courriel = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    nom = serializers.CharField()
    prenom = serializers.CharField()
    departement_id = serializers.IntegerField()

    def create(self, validated_data):
        courriel = validated_data.pop('courriel')
        password = validated_data.pop('password')
        dept_id = validated_data.pop('departement_id')

        try:
            dept = Departement.objects.get(id=dept_id)
        except Departement.DoesNotExist:
            raise AppValidationError("Département non trouvé.")

        # Check if dept already has a chef
        if ChefDepartement.objects.filter(departement=dept).exists():
            raise AppValidationError(
                f"Le département {dept.nom} a déjà un chef."
            )

        user = User.objects.create_user(
            courriel=courriel,
            password=password,
            role='Chef_Departement',
            is_verified=True # Admin created accounts are pre-verified
        )

        chef = ChefDepartement.objects.create(
            user=user,
            departement=dept,
            **validated_data
        )
        return chef
