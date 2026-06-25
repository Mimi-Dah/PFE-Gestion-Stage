import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Avg, Count, Q
from accounts.models import Etudiant, Entreprise
from candidatures.models import Candidature
from evaluations.models import EvaluationDeStage
from offres.models import OffreDeStage
from etablissements.models import Departement

logger = logging.getLogger(__name__)


def generate_admin_report_pdf():
    """
    Aggregates global platform statistics and renders a PDF report via xhtml2pdf.
    Returns raw PDF bytes.
    """
    from xhtml2pdf import pisa
    from io import BytesIO

    total_etudiants = Etudiant.objects.count()
    total_entreprises = Entreprise.objects.count()
    total_offres = OffreDeStage.objects.count()
    offres_actives = OffreDeStage.objects.filter(statut='Active').count()
    total_candidatures = Candidature.objects.count()
    stages_actifs = Candidature.objects.filter(statut='Stage_actif').count()
    stages_termines = Candidature.objects.filter(statut='Terminé').count()
    avg_note = EvaluationDeStage.objects.aggregate(Avg('note_globale'))['note_globale__avg'] or 0

    placement_rate = round((stages_actifs / total_etudiants * 100), 1) if total_etudiants > 0 else 0
    completed_pct = round((stages_termines / total_etudiants * 100), 1) if total_etudiants > 0 else 0

    dept_stats = [
        {
            'departement': dept.nom,
            'total': dept.total_etudiants,
            'en_stage': dept.en_stage,
            'pct': round((dept.en_stage / dept.total_etudiants * 100), 1) if dept.total_etudiants > 0 else 0,
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
    ).select_related('etudiant', 'offre__entreprise').order_by('-postule_le')[:10]

    recent_placements = [
        {
            'student': f"{cp.etudiant.prenom} {cp.etudiant.nom}",
            'company': cp.offre.entreprise.nom,
            'date': cp.postule_le.strftime('%d/%m/%Y'),
        }
        for cp in recent
    ]

    context = {
        'overview': {
            'total_students': total_etudiants,
            'total_companies': total_entreprises,
            'total_offers': total_offres,
            'active_offers': offres_actives,
            'total_candidatures': total_candidatures,
            'active_internships': stages_actifs,
            'completed_internships': stages_termines,
            'placement_rate': placement_rate,
            'average_performance': round(avg_note, 1),
        },
        'by_department': dept_stats,
        'recent_placements': recent_placements,
        'completed_pct': completed_pct,
        'generated_at': timezone.now().strftime('%d/%m/%Y à %H:%M'),
    }

    html_string = render_to_string('analytics/admin_report_template.html', context)
    
    result = BytesIO()
    pisa_status = pisa.CreatePDF(html_string, dest=result)
    
    if pisa_status.err:
        logger.error("xhtml2pdf error occurred during PDF generation")
        raise Exception("Erreur lors de la génération du PDF avec xhtml2pdf")
        
    pdf_bytes = result.getvalue()
    logger.info("Admin analytics PDF report generated via xhtml2pdf (%d bytes)", len(pdf_bytes))
    return pdf_bytes
