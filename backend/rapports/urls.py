from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RapportDeStageViewSet

router = DefaultRouter()
router.register(r'', RapportDeStageViewSet, basename='rapport')

urlpatterns = [
    path('', include(router.urls)),
]
