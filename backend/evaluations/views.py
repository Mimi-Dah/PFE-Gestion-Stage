from rest_framework import viewsets, permissions
from django.utils.translation import gettext_lazy as _
from django.utils.text import format_lazy
from .models import EvaluationDeStage, AutoEvaluation
from .serializers import EvaluationDeStageSerializer, AutoEvaluationSerializer
from notifications.utils import create_notification
from internhub_backend.permissions import IsEnterprise, IsStudent, IsChefDepartement
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError, AuthorizationError


class EvaluationDeStageViewSet(viewsets.ModelViewSet):
    queryset = EvaluationDeStage.objects.all()
    serializer_class = EvaluationDeStageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.select_related('entreprise', 'etudiant__user', 'etudiant__departement', 'offre__entreprise')
        if user.role == 'Étudiant':
            return qs.filter(etudiant__user=user)
        if user.role == 'Entreprise':
            return qs.filter(entreprise__user=user)
        if user.role == 'Chef_Departement':
            chef = getattr(user, 'profil_chef', None)
            if chef and chef.departement_id:
                return qs.filter(etudiant__departement_id=chef.departement_id)
            return qs.none()
        if user.role == 'Admin':
            return qs
        return qs.none()

    def perform_create(self, serializer):
        try:
            entreprise = self.request.user.profil_entreprise
        except AttributeError:
            raise AuthorizationError("Seule une entreprise peut évaluer un stagiaire.")

        etudiant = serializer.validated_data['etudiant']
        offre    = serializer.validated_data['offre']

        from candidatures.models import Candidature
        eligible = ['Stage_actif', 'Terminé']
        if not Candidature.objects.filter(
            etudiant=etudiant, offre=offre, offre__entreprise=entreprise,
            statut__in=eligible
        ).exists():
            raise PermissionDeniedError("Vous ne pouvez évaluer que vos stagiaires en cours ou ayant terminé leur stage.")

        if EvaluationDeStage.objects.filter(
            entreprise=entreprise, etudiant=etudiant, offre=offre
        ).exists():
            raise BadRequestError("Vous avez déjà évalué ce stagiaire pour cette offre.")

        evaluation = serializer.save(entreprise=entreprise)

        # Mark the candidature as Terminé once the enterprise submits an evaluation
        Candidature.objects.filter(
            etudiant=etudiant, offre=offre,
            offre__entreprise=entreprise,
            statut='Stage_actif'
        ).update(statut='Terminé')

        create_notification(
            user=evaluation.etudiant.user,
            titre=_("Évaluation Disponible"),
            message=format_lazy(
                _("L'entreprise {entreprise} a publié votre évaluation de stage."),
                entreprise=evaluation.entreprise.nom,
            ),
            type_event="Evaluation_disponible",
            lien="/espace/evaluations",
        )

        from accounts.models import ChefDepartement
        chef = ChefDepartement.objects.filter(
            departement=evaluation.etudiant.departement
        ).first()
        if chef:
            create_notification(
                user=chef.user,
                titre=_("Nouvelle Évaluation Déposée"),
                message=format_lazy(
                    _("L'entreprise {entreprise} a évalué le stage de {etudiant}."),
                    entreprise=evaluation.entreprise.nom,
                    etudiant=f"{evaluation.etudiant.prenom} {evaluation.etudiant.nom}",
                ),
                type_event="Evaluation_disponible",
                lien="/espace/chef/stagiaires",
            )


class AutoEvaluationViewSet(viewsets.ModelViewSet):
    """
    Students create and view their own self-assessments.
    PUT / PATCH / DELETE are disabled — a submitted auto-evaluation is final.
    """
    serializer_class   = AutoEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    http_method_names  = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return AutoEvaluation.objects.filter(
            etudiant__user=self.request.user
        ).select_related('offre__entreprise')

    def perform_create(self, serializer):
        etudiant = self.request.user.profil_etudiant
        offre    = serializer.validated_data['offre']

        from candidatures.models import Candidature
        eligible = ['Acceptée', 'Convention_en_cours', 'Stage_actif', 'Terminé']
        if not Candidature.objects.filter(
            etudiant=etudiant, offre=offre, statut__in=eligible
        ).exists():
            raise PermissionDeniedError(
                "Vous ne pouvez vous auto-évaluer que pour un stage en cours ou terminé."
            )

        if AutoEvaluation.objects.filter(etudiant=etudiant, offre=offre).exists():
            raise BadRequestError(
                "Vous avez déjà soumis une auto-évaluation pour ce stage."
            )

        serializer.save(etudiant=etudiant)
