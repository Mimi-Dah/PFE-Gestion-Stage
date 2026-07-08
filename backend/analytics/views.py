from rest_framework import views, status
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.http import HttpResponse
from django.utils import timezone
from accounts.models import Etudiant, Entreprise
from candidatures.models import Candidature
from evaluations.models import EvaluationDeStage
from offres.models import OffreDeStage
from etablissements.models import Departement
from internhub_backend.permissions import IsChefDepartement, IsAdmin

class ChefAnalyticsView(views.APIView):
    permission_classes = [IsChefDepartement]

    def get(self, request):
        try:
            if not hasattr(request.user, 'profil_chef'):
                return Response({"error": "Profil Chef de Département non trouvé."}, status=status.HTTP_404_NOT_FOUND)
            
            chef = request.user.profil_chef
            dept = chef.departement
            
            if not dept:
                 return Response({"error": "Département non assigné au Chef."}, status=status.HTTP_400_BAD_REQUEST)

            # Basic Stats
            total_etudiants = Etudiant.objects.filter(departement=dept).count()

            # Etudiant IDs who already have an evaluation (stage de facto terminé)
            evaluated_ids = set(
                EvaluationDeStage.objects.filter(etudiant__departement=dept)
                .values_list('etudiant_id', flat=True)
            )

            # Active = Stage_actif with no evaluation yet
            etudiants_avec_stage = (
                Etudiant.objects
                .filter(departement=dept, candidatures__statut='Stage_actif')
                .exclude(pk__in=evaluated_ids)
                .distinct()
                .count()
            )

            # Completed = Terminé  +  Stage_actif that now has an evaluation
            stages_termines = (
                Candidature.objects
                .filter(
                    Q(etudiant__departement=dept, statut='Terminé') |
                    Q(etudiant__departement=dept, statut='Stage_actif',
                      etudiant_id__in=evaluated_ids)
                )
                .distinct()
                .count()
            )

            # Stats by Level
            stats_niveaux = Etudiant.objects.filter(departement=dept).values('niveau_academique').annotate(
                total=Count('pk'),
                en_stage=Count('candidatures', filter=Q(candidatures__statut='Stage_actif'))
            )

            # Performance (Evaluations)
            avg_note = EvaluationDeStage.objects.filter(
                etudiant__departement=dept
            ).aggregate(Avg('note_globale'))['note_globale__avg'] or 0

            # Candidature Status Distribution
            candidature_stats = Candidature.objects.filter(etudiant__departement=dept).values('statut').annotate(count=Count('pk'))
            
            # Recent Activity (Last 5 acceptances)
            recent_placements = Candidature.objects.filter(
                etudiant__departement=dept,
                statut__in=['Acceptée', 'Stage_actif', 'Convention_en_cours']
            ).select_related('etudiant', 'offre__entreprise').order_by('-postule_le')[:5]

            return Response({
                "overview": {
                    "total_students": total_etudiants,
                    "active_internships": etudiants_avec_stage,
                    "completed_internships": stages_termines,
                    "placement_rate": (etudiants_avec_stage / total_etudiants * 100) if total_etudiants > 0 else 0,
                    "average_performance": round(avg_note, 1)
                },
                "by_level": list(stats_niveaux),
                "candidature_stats": list(candidature_stats),
                "recent_placements": [
                    {
                        "student": f"{cp.etudiant.prenom} {cp.etudiant.nom}",
                        "company": getattr(getattr(cp.offre, 'entreprise', None), 'nom', '—'),
                        "date": cp.postule_le,
                        "status": cp.statut
                    } for cp in recent_placements
                ]
            })
        except Exception as e:
            print(f"Error in ChefAnalyticsView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminAnalyticsView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_etudiants = Etudiant.objects.count()
        total_entreprises = Entreprise.objects.count()
        total_offres = OffreDeStage.objects.count()
        offres_actives = OffreDeStage.objects.filter(statut='Active').count()
        total_candidatures = Candidature.objects.count()
        stages_actifs = Candidature.objects.filter(statut='Stage_actif').count()
        stages_termines = Candidature.objects.filter(statut='Terminé').count()
        avg_note = EvaluationDeStage.objects.aggregate(Avg('note_globale'))['note_globale__avg'] or 0

        dept_stats = [
            {
                'departement': dept.nom,
                'total': dept.total_etudiants,
                'en_stage': dept.en_stage,
            }
            for dept in Departement.objects.annotate(
                total_etudiants=Count('etudiant', distinct=True),
                en_stage=Count(
                    'etudiant__candidatures',
                    filter=Q(etudiant__candidatures__statut='Stage_actif'),
                    distinct=True,
                ),
            )
        ]

        recent = Candidature.objects.filter(
            statut__in=['Acceptée', 'Stage_actif']
        ).select_related('etudiant', 'offre__entreprise').order_by('-postule_le')[:5]

        return Response({
            "overview": {
                "total_students": total_etudiants,
                "total_companies": total_entreprises,
                "total_offers": total_offres,
                "active_offers": offres_actives,
                "total_candidatures": total_candidatures,
                "active_internships": stages_actifs,
                "completed_internships": stages_termines,
                "placement_rate": round((stages_actifs / total_etudiants * 100), 1) if total_etudiants > 0 else 0,
                "average_performance": round(avg_note, 1),
            },
            "by_department": dept_stats,
            "recent_placements": [
                {
                    "student": f"{cp.etudiant.prenom} {cp.etudiant.nom}",
                    "company": cp.offre.entreprise.nom,
                    "date": cp.postule_le,
                }
                for cp in recent
            ],
        })


class AdminReportPDFView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from .utils import generate_admin_report_pdf
        try:
            pdf_bytes = generate_admin_report_pdf()
            filename = f"internhub_rapport_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response(
                {"error": f"Erreur lors de la génération du rapport PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminActivityView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from accounts.models import User

        activities = []

        # Recent user registrations
        for u in User.objects.order_by('-cree_le')[:12]:
            activities.append({
                'type': 'user_registered',
                'label': f'Nouveau compte {u.role}',
                'detail': u.courriel,
                'date': u.cree_le.isoformat(),
                'color': 'primary',
            })

        # Recent candidatures
        recent_cands = Candidature.objects.select_related(
            'etudiant', 'offre__entreprise'
        ).order_by('-postule_le')[:12]
        for c in recent_cands:
            activities.append({
                'type': 'candidature',
                'label': f'Candidature — {c.statut}',
                'detail': f'{c.etudiant.prenom} {c.etudiant.nom} → {c.offre.titre}',
                'date': c.postule_le.isoformat(),
                'color': 'success' if c.statut == 'Acceptée' else 'warning',
            })

        # Recent offers
        for o in OffreDeStage.objects.select_related('entreprise').order_by('-publie_le')[:10]:
            publie = o.publie_le
            if publie:
                activities.append({
                    'type': 'offre',
                    'label': 'Offre publiée',
                    'detail': f'{o.titre} — {o.entreprise.nom}',
                    'date': publie.isoformat(),
                    'color': 'accent',
                })

        activities.sort(key=lambda x: x['date'], reverse=True)
        return Response({'activities': activities[:30]})
