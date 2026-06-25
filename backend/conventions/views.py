from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import ConventionDeStage
from .serializers import ConventionDeStageSerializer
from notifications.utils import create_notification
from internhub_backend.permissions import IsChefDepartement, IsStudent, IsEnterprise, IsAdmin
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError, AuthorizationError

class ConventionDeStageViewSet(viewsets.ModelViewSet):
    queryset = ConventionDeStage.objects.all()
    serializer_class = ConventionDeStageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.select_related(
            'candidature__etudiant__user',
            'candidature__offre__entreprise',
        )
        if user.role == 'Étudiant':
            return qs.filter(candidature__etudiant__user=user)
        elif user.role == 'Entreprise':
            return qs.filter(candidature__offre__entreprise__user=user)
        elif user.role == 'Chef_Departement':
            chef = getattr(user, 'profil_chef', None)
            if chef and chef.departement_id:
                return qs.filter(candidature__etudiant__departement_id=chef.departement_id)
            return qs.none()
        elif user.role == 'Admin':
            return qs
        return qs.none()

    @action(detail=False, methods=['get'], url_path='en-attente', permission_classes=[IsChefDepartement])
    def en_attente(self, request):
        pending = self.get_queryset().filter(statut='En_attente_validation')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsChefDepartement])
    def valider(self, request, pk=None):
        
        convention = self.get_object()
        
        fichier_convention = request.FILES.get('fichier_convention')
        if fichier_convention:
            convention.fichier_convention = fichier_convention
            
        convention.statut = 'Validée'
        convention.date_validation = timezone.now()
        convention.save()

        # Update Candidature status to Stage_actif to unblock Entreprise functionalities
        if convention.candidature:
            convention.candidature.statut = 'Stage_actif'
            convention.candidature.save()


        # Notify Student
        create_notification(
            user=convention.candidature.etudiant.user,
            titre="Convention Validée",
            message=f"Votre convention {convention.numero_convention} a été validée par le département.",
            type_event="Convention_validee",
            lien="/espace/mon-stage"
        )
        # Notify Enterprise
        create_notification(
            user=convention.candidature.offre.entreprise.user,
            titre="Convention Validée",
            message=f"La convention {convention.numero_convention} ({convention.candidature.etudiant.prenom} {convention.candidature.etudiant.nom}) a été validée.",
            type_event="Convention_validee",
            lien="/espace/entreprise/conventions"
        )

        return Response({"status": "Convention validated"})

    @action(detail=True, methods=['post'], permission_classes=[IsChefDepartement])
    def refuser(self, request, pk=None):
        
        motif = request.data.get('motif_refus')
        if not motif:
            raise BadRequestError("Motif is required.")
            
        convention = self.get_object()
        convention.statut = 'Refusée'
        convention.motif_refus = motif
        convention.save()

        # Notify Student
        create_notification(
            user=convention.candidature.etudiant.user,
            titre="Convention Refusée",
            message=f"Votre convention {convention.numero_convention} a été refusée. Motif : {motif}",
            type_event="Convention_refusee",
            lien="/espace/mon-stage"
        )
        # Notify Enterprise
        create_notification(
            user=convention.candidature.offre.entreprise.user,
            titre="Convention Refusée",
            message=f"La convention {convention.numero_convention} a été refusée par le département.",
            type_event="Convention_refusee",
            lien="/espace/entreprise/conventions"
        )

        return Response({"status": "Convention refused"})

    @action(detail=True, methods=['post'], url_path='signer-etudiant', permission_classes=[IsStudent])
    def signer_etudiant(self, request, pk=None):
        convention = self.get_object()
        
        # Save the signed file if provided
        fichier_signe = request.FILES.get('fichier_signe')
        if fichier_signe:
            convention.fichier_signe = fichier_signe
            
        convention.signe_par_etudiant_le = timezone.now()
        convention.save()

        # Notify Enterprise
        create_notification(
            user=convention.candidature.offre.entreprise.user,
            titre="Signature Étudiant",
            message=f"L'étudiant {convention.candidature.etudiant.prenom} {convention.candidature.etudiant.nom} a signé la convention {convention.numero_convention}.",
            type_event="Convention_signee_etudiant",
            lien="/espace/entreprise/conventions"
        )

        return Response({"status": "Signed by student"})

    @action(detail=True, methods=['post'], url_path='signer-entreprise', permission_classes=[IsEnterprise])
    def signer_entreprise(self, request, pk=None):
        convention = self.get_object()
        
        # Save the signed file if provided
        fichier_signe = request.FILES.get('fichier_signe')
        if fichier_signe:
            convention.fichier_signe = fichier_signe
            # If the original template was empty, we can also set it to this file
            if not convention.fichier_convention:
                convention.fichier_convention = convention.fichier_signe
            
        convention.signe_par_entreprise_le = timezone.now()
        convention.save()

        # Notify Student
        create_notification(
            user=convention.candidature.etudiant.user,
            titre="Signature Entreprise",
            message=f"L'entreprise a signé votre convention {convention.numero_convention}.",
            type_event="Convention_signee_entreprise",
            lien="/espace/mon-stage"
        )

        return Response({"status": "Signed by entreprise", "fichier_url": convention.fichier_signe.url if convention.fichier_signe else None})
