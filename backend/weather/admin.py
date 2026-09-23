from django.contrib import admin

from weather.models import WeatherCache


@admin.register(WeatherCache)
class WeatherCacheAdmin(admin.ModelAdmin):
    list_display = ('location_key', 'temperature_c', 'humidity_pct', 'cached_at')
    readonly_fields = ('cached_at',)
