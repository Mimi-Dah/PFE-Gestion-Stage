import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.files.base import ContentFile
from .models import ConventionDeStage

logger = logging.getLogger(__name__)


def generate_convention_pdf(convention_id):
    """
    Génère un PDF WeasyPrint pour une convention et le sauvegarde sur le modèle.
    Lève une exception en cas d'échec pour que le task Celery puisse relancer.
    """
    from xhtml2pdf import pisa
    from io import BytesIO

    convention = ConventionDeStage.objects.get(pk=convention_id)
    candidature = convention.candidature

    context = {
        'convention': convention,
        'candidature': candidature,
        'etudiant': candidature.etudiant,
        'entreprise': candidature.offre.entreprise,
        'offre': candidature.offre,
        'today': timezone.now(),
    }

    html_string = render_to_string('conventions/convention_template.html', context)
    
    result = BytesIO()
    pisa_status = pisa.CreatePDF(html_string, dest=result)
    
    if pisa_status.err:
        logger.error("xhtml2pdf error in convention generation")
        raise Exception("Failed to generate convention PDF")

    pdf_bytes = result.getvalue()

    filename = f"convention_{convention.numero_convention}.pdf"
    convention.fichier_convention.save(filename, ContentFile(pdf_bytes), save=True)
    logger.info("PDF generated for convention %s", convention.numero_convention)
