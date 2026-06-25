from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Candidature
from .serializers import CandidatureSerializer
from conventions.models import ConventionDeStage
from notifications.utils import create_notification
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError, AuthorizationError
from internhub_backend.permissions import IsStudent, IsEnterprise
from accounts.models import ChefDepartement

class CandidatureViewSet(viewsets.ModelViewSet):
    serializer_class = CandidatureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base = Candidature.objects.select_related('etudiant__user', 'offre__entreprise')
        qs = base.none()

        if user.role == 'Étudiant':
            qs = base.filter(etudiant=user.profil_etudiant)
        elif user.role == 'Entreprise':
            qs = base.filter(offre__entreprise=user.profil_entreprise)
        elif user.role == 'Chef_Departement':
            chef = getattr(user, 'profil_chef', None)
            if chef and chef.departement_id:
                qs = base.filter(etudiant__departement_id=chef.departement_id)
            else:
                qs = base.none()
        elif user.role == 'Admin':
            qs = base.all()

        statuts = self.request.query_params.get('statut')
        if statuts:
            statut_list = statuts.split(',')
            qs = qs.filter(statut__in=statut_list)

        return qs

    def create(self, request, *args, **kwargs):
        if not IsStudent().has_permission(request, self):
            raise AuthorizationError("Seul un étudiant peut postuler.")
        
        response = super().create(request, *args, **kwargs)
        
        # Notify Enterprise
        if response.status_code == status.HTTP_201_CREATED:
            candidature_id = response.data.get('id_candidature')
            candidature = Candidature.objects.select_related(
                'offre__entreprise__user', 'etudiant'
            ).get(pk=candidature_id)
            entreprise_user = candidature.offre.entreprise.user
            
            create_notification(
                user=entreprise_user,
                titre="Nouvelle Candidature",
                message=f"{candidature.etudiant.prenom} {candidature.etudiant.nom} a postulé à votre offre '{candidature.offre.titre}'.",
                type_event="Nouvelle_candidature",
                # Correct deep link for entreprise to see candidates of this offer
                lien=f"/espace/entreprise/offres/{candidature.offre.id_offre}/candidatures"
            )
            
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role == 'Étudiant' and instance.statut == 'En_attente':
            instance.statut = 'Retirée'
            instance.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        raise AuthorizationError("Action non autorisée")

    @action(detail=True, methods=['get', 'post'], url_path='absences')
    def absences(self, request, pk=None):
        """
        GET  /api/v1/candidatures/{id}/absences/ — list absences for this internship.
        POST /api/v1/candidatures/{id}/absences/ — enterprise signals a new absence.
        """
        from absences.models import Absence as AbsenceModel
        from absences.serializers import AbsenceSerializer, AbsenceCreateSerializer

        candidature = self.get_object()
        user = request.user

        if request.method == 'GET':
            if user.role == 'Étudiant' and candidature.etudiant.user != user:
                raise AuthorizationError("Accès refusé.")
            if user.role == 'Entreprise' and candidature.offre.entreprise.user != user:
                raise AuthorizationError("Accès refusé.")
            qs = AbsenceModel.objects.filter(
                candidature=candidature
            ).order_by('-date_absence')
            return Response(AbsenceSerializer(qs, many=True).data)

        # POST — only the linked enterprise may signal an absence
        if user.role != 'Entreprise':
            raise AuthorizationError("Seule l'entreprise peut signaler une absence.")
        if candidature.offre.entreprise.user != user:
            raise PermissionDeniedError("Vous ne pouvez signaler une absence que pour vos propres stagiaires.")
        if candidature.statut != 'Stage_actif':
            raise BadRequestError("Vous ne pouvez signaler une absence que pour un stage actif.")

        data = request.data.copy()
        data['candidature'] = candidature.pk
        serializer = AbsenceCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        absence = serializer.save()

        create_notification(
            user=candidature.etudiant.user,
            titre="Absence signalée",
            message=(
                f"Une absence a été signalée pour votre stage "
                f"'{candidature.offre.titre}' le {absence.date_absence}."
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
                titre="Absence à valider",
                message=(
                    f"{candidature.etudiant.prenom} {candidature.etudiant.nom} "
                    f"a été signalé absent le {absence.date_absence} "
                    f"(stage : '{candidature.offre.titre}')."
                ),
                type_event="Absence_signalee",
                lien="/espace/chef/absences",
            )


        return Response(AbsenceSerializer(absence).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='mes-candidatures', permission_classes=[IsStudent])
    def mes_candidatures(self, request):
        today = timezone.now().date()
        candidatures = Candidature.objects.filter(
            etudiant=request.user.profil_etudiant
        ).select_related('etudiant__user', 'offre__entreprise')

        # Auto-close active candidatures whose internship end date has passed
        expired = candidatures.filter(
            statut__in=['Stage_actif', 'Acceptée', 'Convention_en_cours'],
            offre__date_fin__lt=today
        )
        if expired.exists():
            expired.update(statut='Terminé')

        return Response(self.get_serializer(candidatures, many=True).data)

    @action(detail=False, methods=['get'], url_path='offre/(?P<offre_id>[^/.]+)', permission_classes=[IsEnterprise])
    def pour_offre(self, request, offre_id=None):
        candidatures = Candidature.objects.filter(
            offre_id=offre_id, offre__entreprise=request.user.profil_entreprise
        ).select_related('etudiant__user', 'offre__entreprise')
        return Response(self.get_serializer(candidatures, many=True).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsEnterprise])
    def statut(self, request, pk=None):
        candidature = self.get_object()
        nouveau_statut = request.data.get('statut')
        if nouveau_statut not in ['Acceptée', 'Refusée', 'Convention_en_cours', 'Terminé']:
            raise BadRequestError("Statut invalide")
        
        ancier_statut = candidature.statut
        candidature.statut = nouveau_statut
        candidature.save()

        # If status changed, notify student
        if ancier_statut != nouveau_statut:
            titre = "Mise à jour de votre candidature"
            message = f"Votre candidature pour '{candidature.offre.titre}' a été {nouveau_statut.lower()}."
            create_notification(
                user=candidature.etudiant.user,
                titre=titre,
                message=message,
                type_event=f"Candidature_{nouveau_statut}",
                lien="/espace/candidatures"
            )

        # If accepted, create ConventionDeStage and decrease places
        if nouveau_statut == 'Acceptée':
            offre = candidature.offre
            if offre.places_disponibles > 0:
                offre.places_disponibles -= 1
                if offre.places_disponibles == 0:
                    offre.statut = 'Fermée'
                offre.save()

                # Generate convention entry with sequential numbering
                convention, created = ConventionDeStage.objects.get_or_create(
                    candidature=candidature,
                    defaults={'numero_convention': f'TEMP-{candidature.id_candidature}'}
                )
                if created:
                    year = timezone.now().year
                    convention.numero_convention = f"Conv-{year}-{convention.id_convention:03d}"
                    ConventionDeStage.objects.filter(pk=convention.pk).update(
                        numero_convention=convention.numero_convention
                    )
                
                # Trigger PDF Generation (async — fails gracefully if Celery is down)
                try:
                    from conventions.tasks import generate_convention_pdf_task
                    generate_convention_pdf_task.delay(convention.id_convention)
                except Exception:
                    pass

                # Notify Chef de Département
                chef = ChefDepartement.objects.filter(departement=candidature.etudiant.departement).first()
                if chef:
                    create_notification(
                        user=chef.user,
                        titre="Candidature Acceptée - Action Requise",
                        message=f"La candidature de {candidature.etudiant.prenom} {candidature.etudiant.nom} pour '{candidature.offre.titre}' a été acceptée. Veuillez déposer la convention.",
                        type_event="Convention_A_Deposer",
                        lien="/espace/chef/conventions"
                    )
            else:
                raise BadRequestError("Plus de places disponibles")

        return Response(self.get_serializer(candidature).data)
