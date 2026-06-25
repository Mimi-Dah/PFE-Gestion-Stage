from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OffreDeStageViewSet, FavoriViewSet

router = DefaultRouter()
router.register(r'favoris', FavoriViewSet, basename='favori')
router.register(r'', OffreDeStageViewSet, basename='offre')

urlpatterns = [
    path('', include(router.urls)),
]
