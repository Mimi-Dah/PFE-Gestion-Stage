from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConventionDeStageViewSet

router = DefaultRouter()
router.register(r'', ConventionDeStageViewSet, basename='convention')

urlpatterns = [
    path('', include(router.urls)),
]
