from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationDeStageViewSet, AutoEvaluationViewSet

router = DefaultRouter()
# auto/ must be registered before the catch-all '' to avoid URL shadowing
router.register(r'auto', AutoEvaluationViewSet, basename='auto-evaluation')
router.register(r'', EvaluationDeStageViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
