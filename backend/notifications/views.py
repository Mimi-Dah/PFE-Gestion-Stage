from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from internhub_backend.exceptions import PermissionDeniedError, BadRequestError, AuthorizationError


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=True, methods=['patch'], url_path='marquer-lue')
    def marquer_lue(self, request, pk=None):
        notification = self.get_object()
        notification.est_lue = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['patch', 'post'], url_path='tout-marquer-lue')
    def tout_marquer_lue(self, request):
        self.get_queryset().update(est_lue=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['patch', 'post'], url_path='marquer-toutes-lues')
    def marquer_toutes_lues(self, request):
        self.get_queryset().update(est_lue=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['delete'], url_path='supprimer-toutes')
    def supprimer_toutes(self, request):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
