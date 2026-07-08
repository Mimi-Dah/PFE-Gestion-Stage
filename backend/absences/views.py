from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.utils.text import format_lazy
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Absence
from .serializers import AbsenceSerializer, AbsenceCreateSerializer
from internhub_backend.permissions import IsStudent, IsEnterprise
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError
from rest_framework.permissions import IsAuthenticated
from notifications.utils import create_notification
from accounts.models import ChefDepartement


class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all().order_by('-date_absence')
    serializer_class = AbsenceSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsEnterprise()]
        if self.action in ['justifier']:
            return [IsStudent()]
        if self.action in ['valider']:
            return [IsEnterprise()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Absence.objects.none()

        qs = Absence.objects.all().select_related(
            'candidature__etudiant',
            'candidature__offre__entreprise'
        ).order_by('-date_absence')

        if user.role == 'Étudiant':
            return qs.filter(candidature__etudiant__user=user)
        if user.role == 'Entreprise':
            return qs.filter(candidature__offre__entreprise__user=user)
        if user.role == 'Chef_Departement':
            chef_profile = getattr(user, 'profil_chef', None)
            if chef_profile and chef_profile.departement_id:
                return qs.filter(candidature__etudiant__departement_id=chef_profile.departement_id)
            return qs
        if user.role == 'Admin':
            return qs
        return qs.none()

    def create(self, request, *args, **kwargs):
        serializer = AbsenceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        candidature = serializer.validated_data['candidature']

        if candidature.offre.entreprise.user != request.user:
            raise PermissionDeniedError("Vous ne pouvez signaler une absence que pour vos propres stagiaires.")

        if candidature.statut not in ('Stage_actif', 'Terminé'):
            raise PermissionDeniedError("Vous ne pouvez signaler une absence que pour un stage actif.")

        absence = serializer.save()

        create_notification(
            user=candidature.etudiant.user,
            titre=_("Absence signalée"),
            message=format_lazy(
                _(
                    "Une absence a été signalée pour votre stage "
                    "'{offre}' le {date}. "
                    "Vous avez 3 jours pour la justifier."
                ),
                offre=candidature.offre.titre, date=absence.date_absence,
            ),
            type_event="Absence_signalee",
            lien="/espace/absences",
        )

        chef = ChefDepartement.objects.filter(
            departement=candidature.etudiant.departement
        ).select_related('user').first()
        if chef:
            create_notification(
                user=chef.user,
                titre=_("Absence signalée"),
                message=format_lazy(
                    _(
                        "{etudiant} a été signalé absent le {date} "
                        "(stage : '{offre}')."
                    ),
                    etudiant=f"{candidature.etudiant.prenom} {candidature.etudiant.nom}",
                    date=absence.date_absence,
                    offre=candidature.offre.titre,
                ),
                type_event="Absence_signalee",
                lien="/espace/chef/absences",
            )

        return Response(AbsenceSerializer(absence).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def justifier(self, request, pk=None):
        absence = self.get_object()

        if absence.candidature.etudiant.user != request.user:
            raise PermissionDeniedError("Vous ne pouvez justifier que vos propres absences.")

        if absence.statut != 'Signaler':
            raise BadRequestError("Cette absence ne peut plus être justifiée.")

        if absence.delai_depasse:
            raise BadRequestError("Le délai de justification de 3 jours est dépassé. Cette absence est définitivement non justifiée.")

        justification = request.data.get('justification')
        if not justification:
            raise BadRequestError("Une justification est obligatoire.")

        absence.justification = justification
        if 'document_justificatif' in request.FILES:
            absence.document_justificatif = request.FILES['document_justificatif']

        absence.statut = 'En_attente_approbation'
        absence.save()

        etudiant_nom = f"{absence.candidature.etudiant.prenom} {absence.candidature.etudiant.nom}"

        create_notification(
            user=absence.candidature.offre.entreprise.user,
            titre=_("Justification à approuver"),
            message=format_lazy(
                _(
                    "{etudiant} a soumis une justification pour son absence du {date}. "
                    "Une décision de votre part est attendue."
                ),
                etudiant=etudiant_nom, date=absence.date_absence,
            ),
            type_event="Absence_justification_soumise",
            lien="/espace/entreprise/absences",
        )

        chef = ChefDepartement.objects.filter(
            departement=absence.candidature.etudiant.departement
        ).select_related('user').first()
        if chef:
            create_notification(
                user=chef.user,
                titre=_("Justification soumise"),
                message=format_lazy(
                    _(
                        "{etudiant} a soumis une justification pour son absence du {date}. "
                        "L'entreprise doit maintenant se prononcer."
                    ),
                    etudiant=etudiant_nom, date=absence.date_absence,
                ),
                type_event="Absence_justification_soumise",
                lien="/espace/chef/absences",
            )

        return Response(AbsenceSerializer(absence).data)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        absence = self.get_object()

        if absence.statut not in ('Signaler', 'En_attente_approbation'):
            raise BadRequestError("Cette absence a déjà été traitée.")

        statut = request.data.get('statut')
        if statut not in ['Justifiée', 'Non_justifiée']:
            raise BadRequestError("Statut de validation invalide.")

        absence.statut = statut
        absence.valide_le = timezone.now()
        absence.save()

        if statut == 'Justifiée':
            msg = format_lazy(
                _("Votre justification pour l'absence du {date} a été approuvée par l'entreprise."),
                date=absence.date_absence,
            )
            event = "Absence_approuvee"
        else:
            msg = format_lazy(
                _(
                    "Votre justification pour l'absence du {date} a été refusée par l'entreprise. "
                    "Cette absence est marquée comme non justifiée."
                ),
                date=absence.date_absence,
            )
            event = "Absence_refusee"

        create_notification(
            user=absence.candidature.etudiant.user,
            titre=_("Décision sur votre absence"),
            message=msg,
            type_event=event,
            lien="/espace/absences",
        )

        return Response(AbsenceSerializer(absence).data)
