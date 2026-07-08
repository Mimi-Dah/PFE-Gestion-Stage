from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _
from django.utils.text import format_lazy
from .models import RapportDeStage
from .serializers import RapportDeStageSerializer
from accounts.models import Etudiant, ChefDepartement
from candidatures.models import Candidature
from notifications.utils import create_notification
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError, AuthorizationError
from internhub_backend.permissions import IsStudent, IsChefDepartement, IsEnterprise, IsAdmin

class RapportDeStageViewSet(viewsets.ModelViewSet):
    queryset = RapportDeStage.objects.all()
    serializer_class = RapportDeStageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            etudiant = self.request.user.profil_etudiant
        except AttributeError:
            raise AuthorizationError("Seul un étudiant peut soumettre un rapport.")
            
        offre = serializer.validated_data['offre']
        
        # BUSINESS RULE: Only allow report if stage is ACTIVE
        try:
            candidature = Candidature.objects.get(etudiant=etudiant, offre=offre)
            if candidature.statut not in ['Stage_actif', 'Terminé']:
                raise PermissionDeniedError("Vous ne pouvez soumettre un rapport que si votre stage est officiellement déclaré 'En cours' ou 'Terminé'.")
        except Candidature.DoesNotExist:
            raise PermissionDeniedError("Aucune candidature trouvée pour cette offre. Vous devez avoir une candidature acceptée.")

        rapport = serializer.save(etudiant=etudiant)
        
        # Notify Chef of Department
        rapport_msg = format_lazy(
            _("L'étudiant {etudiant} a soumis son rapport de stage pour '{offre}'."),
            etudiant=f"{etudiant.prenom} {etudiant.nom}",
            offre=rapport.offre.titre,
        )
        chef = ChefDepartement.objects.filter(departement=etudiant.departement).first()
        if chef:
            create_notification(
                user=chef.user,
                titre=_("Nouveau Rapport Soumis"),
                message=rapport_msg,
                type_event="Rapport_soumis",
                lien="/espace/chef/rapports"
            )

        # Notify Enterprise
        try:
            entreprise = rapport.offre.entreprise
            if entreprise and entreprise.user:
                create_notification(
                    user=entreprise.user,
                    titre=_("Nouveau Rapport Soumis"),
                    message=rapport_msg,
                    type_event="Rapport_soumis",
                    lien="/espace/entreprise/mes-stagiaires"
                )
        except Exception as e:
            print(f"Notification entreprise error: {e}")

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.select_related('etudiant__user', 'offre__entreprise')
        if user.role == 'Étudiant':
            return qs.filter(etudiant__user=user)
        elif user.role == 'Entreprise':
            return qs.filter(offre__entreprise__user=user)
        elif user.role == 'Chef_Departement':
            chef = getattr(user, 'profil_chef', None)
            if chef and chef.departement_id:
                return qs.filter(etudiant__departement_id=chef.departement_id)
            return qs.none()
        return qs.none()

    @action(detail=True, methods=['patch'], url_path='noter', permission_classes=[IsChefDepartement])
    def noter(self, request, pk=None):
        
        note = request.data.get('note')
        commentaire = request.data.get('commentaires', '')
        
        if note is None:
            raise BadRequestError("Note is required.")
            
        try:
            rapport = self.get_object()
            rapport.note = float(note)
            rapport.commentaire = commentaire
            rapport.save()

            # Notify Student
            try:
                create_notification(
                    user=rapport.etudiant.user,
                    titre=_("Rapport Noté"),
                    message=format_lazy(
                        _("Votre rapport pour '{offre}' a été noté : {note}/20."),
                        offre=rapport.offre.titre,
                        note=note,
                    ),
                    type_event="Rapport_note",
                    lien="/espace/mon-stage"
                )
            except Exception as e:
                print(f"Notification error: {e}")

            return Response({"status": "Report scored successfully"})
        except Exception as e:
            raise BadRequestError(f"Error saving score: {str(e)}")

