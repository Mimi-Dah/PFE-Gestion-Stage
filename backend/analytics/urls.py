from django.urls import path
from .views import ChefAnalyticsView, AdminAnalyticsView, AdminActivityView, AdminReportPDFView

urlpatterns = [
    path('chef/', ChefAnalyticsView.as_view(), name='chef-analytics'),
    path('admin/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/report/', AdminReportPDFView.as_view(), name='admin-report-pdf'),
    path('admin/activity/', AdminActivityView.as_view(), name='admin-activity'),
]
