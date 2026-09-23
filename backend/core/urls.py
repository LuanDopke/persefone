"""
URL configuration for Persefone project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from catalog.views import ObservationViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/species/', include('catalog.urls')),
    path('api/observations/', ObservationViewSet.as_view({'get': 'list', 'post': 'create'}), name='observation-list'),
    path('api/', include('specimens.urls')),
    path('api/weather/', include('weather.urls')),
    path('api/auth/', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
