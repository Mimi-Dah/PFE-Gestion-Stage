"""
Regenerate all stored convention PDFs with the updated internHub template.
Run with: python regen_convention_pdfs.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internhub_backend.settings')
django.setup()

from conventions.models import ConventionDeStage
from conventions.utils import generate_convention_pdf

conventions = ConventionDeStage.objects.select_related(
    'candidature__etudiant',
    'candidature__offre__entreprise',
).all()

total = conventions.count()
print(f"Found {total} convention(s) to regenerate.\n")

ok = 0
failed = 0
for conv in conventions:
    try:
        generate_convention_pdf(conv.pk)
        print(f"  [OK]   {conv.numero_convention}")
        ok += 1
    except Exception as e:
        print(f"  [FAIL] {conv.numero_convention}: {e}")
        failed += 1

print(f"\nDone — {ok} regenerated, {failed} failed.")
