"""
URL configuration for internhub_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('accounts.urls')),
    path('api/v1/offres/', include('offres.urls')),
    path('api/v1/candidatures/', include('candidatures.urls')),
    path('api/v1/conventions/', include('conventions.urls')),
    path('api/v1/rapports/', include('rapports.urls')),
    path('api/v1/evaluations/', include('evaluations.urls')),
    path('api/v1/etablissements/', include('etablissements.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/absences/', include('absences.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

