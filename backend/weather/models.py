"""WeatherCache model — Local climate data cache."""

from django.db import models


class WeatherCache(models.Model):
    """Cached local weather and environmental forecast metrics."""

    location_key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text='Location key (e.g., "lat_-23.55_lon_-46.63")',
    )
    temperature_c = models.FloatField(help_text='Current ambient temperature in Celsius')
    humidity_pct = models.IntegerField(help_text='Relative humidity percentage')
    weather_code = models.IntegerField(default=0, help_text='WMO weather code')
    cached_at = models.DateTimeField(auto_now=True, help_text='Timestamp of cache capture')

    class Meta:
        verbose_name_plural = 'weather caches'

    def __str__(self):
        return f'{self.location_key}: {self.temperature_c}°C, {self.humidity_pct}% humidity'
