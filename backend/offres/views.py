import logging
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import OffreDeStage, Favori
from .serializers import OffreDeStageSerializer, FavoriSerializer
from internhub_backend.permissions import IsEnterprise, IsStudent, IsAdmin, IsOwnerOrReadOnly
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError, AuthorizationError
import django_filters

class OffreFilter(django_filters.FilterSet):
    localisation = django_filters.CharFilter(lookup_expr='icontains')
    entreprise__nom = django_filters.CharFilter(lookup_expr='icontains')
    duree_semaines = django_filters.NumberFilter(method='filter_duree')

    def filter_duree(self, queryset, name, value):
        if value <= 8:
            return queryset.filter(duree_semaines__lte=value)
        else:
            return queryset.filter(duree_semaines__gte=value)

    class Meta:
        model = OffreDeStage
        fields = ['statut', 'domaine', 'teletravail', 'localisation', 'entreprise__nom', 'departement', 'departement__nom']

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Matching helpers (module-level for testability)
# ---------------------------------------------------------------------------

# (keywords, numeric tier) — higher tier = more advanced level.
_LEVEL_TIERS = [
    (['bts', 'dut', 'bac+2'],            2),
    (['licence 1', 'l1', 'bac+3'],       3),
    (['licence 2', 'l2'],                4),
    (['licence 3', 'l3', 'bac+4'],       5),
    (['master 1', 'm1'],                 6),
    (['master 2', 'm2', 'bac+5'],        7),
]


def _level_tier(text: str):
    """Return the highest matching numeric tier found in *text*, or None."""
    t = text.lower()
    for keywords, tier in reversed(_LEVEL_TIERS):
        if any(kw in t for kw in keywords):
            return tier
    return None


def _level_score(niveau: str, exigences: str) -> int:
    """
    0–30 pts: how well the student's academic level fits the offer requirements.

    Exact tier match → 30, one tier off → 20, two tiers off → 10, further → 0.
    If the offer specifies no level requirement → 10 (neutral partial credit).
    """
    student = _level_tier(niveau)
    if student is None:
        return 0
    required = _level_tier(exigences)
    if required is None:
        return 10
    return {0: 30, 1: 20, 2: 10}.get(abs(student - required), 0)


def _domain_score(dept_name: str, offre_domaine: str) -> int:
    """
    0–40 pts: word-overlap between the student's department and the offer domain.

    Uses Jaccard similarity on meaningful tokens (length > 3), amplified for
    small vocabularies. Falls back to a substring check for 15 pts.
    """
    if not dept_name or not offre_domaine:
        return 0
    dept_tokens  = {w for w in dept_name.lower().split()     if len(w) > 3}
    offer_tokens = {w for w in offre_domaine.lower().split() if len(w) > 2}
    if not dept_tokens or not offer_tokens:
        return 0
    overlap = dept_tokens & offer_tokens
    if overlap:
        jaccard = len(overlap) / len(dept_tokens | offer_tokens)
        return round(40 * min(jaccard * 3, 1.0))
    # Loose substring fallback (e.g. "Informatique" inside "Développement Informatique")
    if any(t in offre_domaine.lower() for t in dept_tokens):
        return 15
    return 0


def _score_offer(offre, dept_name: str, niveau: str, past_domains: set) -> int:
    """
    Compute a 0–100 matching score for one offer against a student's profile.

    Signal weights
    ──────────────
    40  domain alignment      — department name ↔ offer domaine
    30  level compatibility   — niveau_academique ↔ offer exigences
    20  behavioural signal    — offer domain appears in student's past candidatures
    10  keyword in exigences  — department words found in the requirements text
    """
    score = 0

    # 1. Domain alignment (40 pts)
    score += _domain_score(dept_name, offre.domaine)

    # 2. Level compatibility (30 pts)
    if niveau and offre.exigences:
        score += _level_score(niveau, offre.exigences)

    # 3. Behavioural: past application domains (20 pts)
    if offre.domaine and offre.domaine in past_domains:
        score += 20

    # 4. Department keywords inside exigences (10 pts)
    if dept_name and offre.exigences:
        dept_tokens = {w for w in dept_name.lower().split() if len(w) > 3}
        if dept_tokens and any(t in offre.exigences.lower() for t in dept_tokens):
            score += 10

    return min(score, 100)

class IsEntrepriseOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'Entreprise'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Safer check using IDs
        return obj.entreprise.user_id == request.user.id_utilisateur

class OffreDeStageViewSet(viewsets.ModelViewSet):
    queryset = OffreDeStage.objects.all()
    serializer_class = OffreDeStageSerializer
    permission_classes = [permissions.IsAuthenticated, IsEntrepriseOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OffreFilter
    search_fields = ['titre', 'description']
    ordering_fields = ['publie_le', 'gratification', 'duree_semaines']

    def get_queryset(self):
        user = self.request.user
        qs = OffreDeStage.objects.all().select_related('entreprise')

        if not user.is_authenticated:
            return qs.filter(statut='Active')

        if user.role in ['Admin', 'Chef_Departement']:
            return qs
            
        if user.role == 'Entreprise':
            from django.db.models import Q
            return qs.filter(Q(statut='Active') | Q(entreprise__user=user))
            
        if user.role == 'Étudiant':
            if self.action == 'list':
                qs = qs.filter(statut='Active')
                if self.request.query_params.get('favoris'):
                    qs = qs.filter(favorise_par__etudiant=user.profil_etudiant)
                return qs
            return qs
            
        return qs.filter(statut='Active')


    def perform_create(self, serializer):
        entreprise = self.request.user.profil_entreprise
        serializer.save(entreprise=entreprise)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            logger.info("Offer %s deleted by %s", instance.id_offre, request.user.courriel)
            self.perform_destroy(instance)
            return Response({"message": "Offer deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Offer deletion failed: %s", e)
            return Response(
                {"error": f"Failed to delete offer: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin], url_path='archive')
    def archive(self, request, pk=None):
        offre = self.get_object()
        if offre.statut != 'Fermée':
            return Response(
                {'error': "Seules les offres fermées peuvent être archivées."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        offre.statut = 'Archivée'
        offre.save(update_fields=['statut'])
        return Response({'statut': 'Archivée'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsEnterprise], url_path='mes-offres')
    def mes_offres(self, request):
        offres = OffreDeStage.objects.filter(
            entreprise=request.user.profil_entreprise
        ).select_related('entreprise')
        serializer = self.get_serializer(offres, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsStudent])
    def recommandees(self, request):
        """
        Returns up to 20 active offers ranked by matching_score (0–100) for the
        authenticated student. Already-applied offers are always excluded.

        Score breakdown  (see module-level helpers for full detail):
          40  domain alignment      — department ↔ offer domaine
          30  level compatibility   — niveau_academique ↔ offer exigences
          20  behavioural signal    — past candidature domains
          10  keywords in exigences — department words in requirements text
        """
        from candidatures.models import Candidature

        etudiant = request.user.profil_etudiant

        applied_ids = (
            Candidature.objects
            .filter(etudiant=etudiant)
            .values_list('offre_id', flat=True)
        )
        offers = list(
            OffreDeStage.objects
            .filter(statut='Active')
            .exclude(id_offre__in=applied_ids)
            .select_related('entreprise')
        )

        dept_name = etudiant.departement.nom if etudiant.departement else ''
        niveau    = etudiant.niveau_academique or ''
        past_domains = set(
            Candidature.objects
            .filter(etudiant=etudiant)
            .values_list('offre__domaine', flat=True)
            .distinct()
        ) - {None, ''}

        scored = sorted(
            [(_score_offer(o, dept_name, niveau, past_domains), o) for o in offers],
            key=lambda x: (x[0], x[1].publie_le),
            reverse=True,
        )
        top = scored[:20]

        serializer = self.get_serializer([o for _, o in top], many=True)
        score_map = {o.id_offre: s for s, o in top}
        result = [
            {**item, 'matching_score': score_map.get(item['id_offre'], 0)}
            for item in serializer.data
        ]
        return Response(result)

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def favori(self, request, pk=None):
        offre = self.get_object()
        etudiant = request.user.profil_etudiant
        favori, created = Favori.objects.get_or_create(etudiant=etudiant, offre=offre)
        
        if not created:
            favori.delete()
            return Response({'status': 'unfavorited'}, status=status.HTTP_200_OK)
            
        return Response({'status': 'favorited'}, status=status.HTTP_201_CREATED)

class FavoriViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        return Favori.objects.filter(
            etudiant=self.request.user.profil_etudiant
        ).select_related('offre__entreprise', 'etudiant__user')

    def perform_create(self, serializer):
        serializer.save(etudiant=self.request.user.profil_etudiant)
