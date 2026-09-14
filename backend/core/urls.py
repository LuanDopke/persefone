"""
URL configuration for Persefone project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/species/', include('catalog.urls')),
    path('api/', include('specimens.urls')),
    path('api/weather/', include('weather.urls')),
    path('api/auth/', include('accounts.urls')),
]
