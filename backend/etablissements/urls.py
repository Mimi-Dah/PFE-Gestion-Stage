from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EtablissementViewSet, DepartementViewSet

router = DefaultRouter()
router.register(r'etablissements', EtablissementViewSet)
router.register(r'departements', DepartementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
