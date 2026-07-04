import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.parsers import MultiPartParser, FormParser
from internhub_backend.throttles import LoginRateThrottle, RegisterRateThrottle

_ = lambda s: s  # no-op: strings are already French

logger = logging.getLogger(__name__)
from .serializers import (
    RegisterSerializer, UserSerializer, EtudiantSerializer,
    EntrepriseSerializer, ChefDepartementSerializer, ChefCreateSerializer,
    CustomTokenObtainPairSerializer, build_user_profile_data,
)
from .models import Etudiant, Entreprise, ChefDepartement
from etablissements.models import Departement
from internhub_backend.permissions import IsAdmin
from internhub_backend.exceptions import NotFoundError, BadRequestError

User = get_user_model()


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Login JWT avec limite de 5 tentatives/minute par IP."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


class LogoutView(APIView):
    """
    Déconnexion côté serveur : blackliste le refresh token reçu pour qu'il ne
    puisse plus jamais être échangé contre un nouvel access token, même s'il
    n'a pas encore expiré (ex. token volé, appareil partagé, déconnexion
    automatique pour inactivité).

    Volontairement accessible sans authentification valide (AllowAny) : au
    moment où l'utilisateur se déconnecte, son access token est souvent déjà
    expiré (c'est justement pour ça qu'on veut invalider la session côté
    serveur). Seul le refresh token, transmis dans le corps de la requête,
    est nécessaire.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            raise BadRequestError(_("Refresh token manquant."))
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            # Jeton déjà invalide/expiré/blacklisté : la déconnexion reste un
            # succès du point de vue du client, il n'y a rien de plus à faire.
            pass
        return Response({"message": _("Déconnexion réussie.")}, status=status.HTTP_200_OK)


def _send_verification_email(user):
    token = user.verification_token
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verify_url = f"{frontend_url}/verify-account?token={token}"
    send_mail(
        subject='Vérifiez votre compte StageFlow',
        message=(
            f"Bonjour,\n\n"
            f"Cliquez sur ce lien pour vérifier votre compte StageFlow :\n"
            f"{verify_url}\n\n"
            f"Ce lien est valable 24 heures.\n\n"
            f"L'équipe StageFlow"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.courriel],
        fail_silently=False,
    )


def _send_password_reset_email(user):
    token = PasswordResetTokenGenerator().make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"
    send_mail(
        subject='Réinitialisation de votre mot de passe StageFlow',
        message=(
            f"Bonjour,\n\n"
            f"Cliquez sur ce lien pour réinitialiser votre mot de passe :\n"
            f"{reset_url}\n\n"
            f"Ce lien expire dans 3 jours. Si vous n'avez pas demandé cette "
            f"réinitialisation, ignorez cet email.\n\n"
            f"L'équipe StageFlow"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.courriel],
        fail_silently=False,
    )


class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        if not token:
            raise BadRequestError(_("Token manquant."))
        try:
            user = User.objects.get(verification_token=token, is_verified=False)
        except User.DoesNotExist:
            raise BadRequestError(_("Lien de vérification invalide ou déjà utilisé."))
        user.is_verified = True
        user.verification_token = None
        user.save(update_fields=['is_verified', 'verification_token'])
        return Response({"message": _("Compte vérifié avec succès.")}, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    parser_classes = (MultiPartParser, FormParser)
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            try:
                user = User.objects.get(courriel=request.data.get('courriel'))
                if settings.DEBUG:
                    # Auto-verify in development so no SMTP config is needed
                    user.is_verified = True
                    user.verification_token = None
                    user.save(update_fields=['is_verified', 'verification_token'])
                else:
                    _send_verification_email(user)
            except Exception as exc:
                logger.error("Post-registration step failed for %s: %s", request.data.get('courriel'), exc)
        return response

class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        courriel = request.data.get('courriel')
        if not courriel:
            raise BadRequestError(_("Email requis."))
        try:
            user = User.objects.get(courriel=courriel)
            _send_password_reset_email(user)
        except User.DoesNotExist:
            pass  # Don't reveal whether the email exists
        return Response({"message": _("Si ce compte existe, un email de réinitialisation a été envoyé.")})


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not all([uid, token, new_password]):
            raise BadRequestError(_("Données manquantes."))
        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError, Exception):
            raise BadRequestError(_("Lien invalide."))
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise BadRequestError(_("Lien de réinitialisation invalide ou expiré."))
        user.set_password(new_password)
        user.save()
        return Response({"message": _("Mot de passe réinitialisé avec succès.")})


class AdminPasswordResetView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            _send_password_reset_email(user)
            return Response({"message": f"Email de réinitialisation envoyé à {user.courriel}."})
        except User.DoesNotExist:
            raise NotFoundError("User")


class ProfileMeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        return Response(build_user_profile_data(request.user, context={'request': request}))

    def patch(self, request):
        user = request.user
        ctx = {'request': request}
        if user.role == 'Étudiant':
            try:
                etudiant = user.profil_etudiant
                serializer = EtudiantSerializer(etudiant, data=request.data, partial=True, context=ctx)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Profile updated", "profil_etudiant": serializer.data})
                raise BadRequestError("Validation failed", details=serializer.errors)
            except Etudiant.DoesNotExist:
                raise NotFoundError("Student profile")
        elif user.role == 'Entreprise':
            try:
                entreprise = user.profil_entreprise
                serializer = EntrepriseSerializer(entreprise, data=request.data, partial=True, context=ctx)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Profile updated", "profil_entreprise": serializer.data})
                raise BadRequestError("Validation failed", details=serializer.errors)
            except Entreprise.DoesNotExist:
                raise NotFoundError("Enterprise profile")
        raise BadRequestError("Unknown role")

class UserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from rest_framework.pagination import PageNumberPagination

        qs = User.objects.all().order_by('-cree_le')

        search = request.query_params.get('search', '').strip()
        role   = request.query_params.get('role', '').strip()

        if search:
            qs = qs.filter(courriel__icontains=search)
        if role and role != 'All':
            qs = qs.filter(role=role)

        paginator = PageNumberPagination()
        paginator.page_size = 15
        page = paginator.paginate_queryset(qs, request)
        serializer = UserSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            is_active = request.data.get('is_active')
            new_role = request.data.get('role')

            if is_active is not None:
                user.is_active = is_active
            if new_role is not None:
                valid_roles = [c[0] for c in User.ROLE_CHOICES]
                if new_role not in valid_roles:
                    raise BadRequestError("Rôle invalide.")
                if user.pk == request.user.pk:
                    raise BadRequestError("Vous ne pouvez pas modifier votre propre rôle.")
                user.role = new_role
            if is_active is None and new_role is None:
                return Response({"error": "No data provided"}, status=status.HTTP_400_BAD_REQUEST)
            user.save()
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            raise NotFoundError("User")

class ChefManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        chefs = ChefDepartement.objects.select_related('user', 'departement').all()
        serializer = ChefDepartementSerializer(chefs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChefCreateSerializer(data=request.data)
        if serializer.is_valid():
            chef = serializer.save()
            return Response(ChefDepartementSerializer(chef).data, status=status.HTTP_201_CREATED)
        raise BadRequestError("Validation failed", details=serializer.errors)

    def delete(self, request, pk):
        try:
            chef = ChefDepartement.objects.get(pk=pk)
            user = chef.user
            chef.delete()
            user.delete() 
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ChefDepartement.DoesNotExist:
            raise NotFoundError("Chef")

class DepartementManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get(self, request):
        depts = Departement.objects.select_related('etablissement').all()
        data = [{"id": d.id, "nom": d.nom, "etablissement": d.etablissement.nom} for d in depts]
        return Response(data)

class DepartementListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        depts = Departement.objects.all()
        data = [{"id": d.id, "nom": d.nom} for d in depts]
        return Response(data)

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        ancien = request.data.get('ancien_password')
        nouveau = request.data.get('nouveau_password')
        if not ancien or not nouveau:
            raise BadRequestError(_("Les deux mots de passe sont requis."))
        if not request.user.check_password(ancien):
            raise BadRequestError(_("Le mot de passe actuel est incorrect."))
        if len(nouveau) < 8:
            raise BadRequestError(_("Le nouveau mot de passe doit faire au moins 8 caractères."))
        request.user.set_password(nouveau)
        request.user.save(update_fields=['password'])
        return Response({"message": _("Mot de passe mis à jour avec succès.")})


class EtudiantDetailView(generics.RetrieveAPIView):
    queryset = Etudiant.objects.select_related('user', 'departement__etablissement').all()
    serializer_class = EtudiantSerializer
    permission_classes = (permissions.IsAuthenticated,)

class EntrepriseDetailView(generics.RetrieveAPIView):
    queryset = Entreprise.objects.select_related('user').all()
    serializer_class = EntrepriseSerializer
    permission_classes = (permissions.IsAuthenticated,)
