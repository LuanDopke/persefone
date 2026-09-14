"""
Specimen and CareLog models — Personal plant instances and care timeline.
Constitution Principle V: Specimen linked to Species, immutable care timestamps.
"""

import uuid

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Specimen(models.Model):
    """Individual physical plant belonging to the user."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    species = models.ForeignKey(
        'catalog.Species',
        on_delete=models.PROTECT,
        related_name='specimens',
        help_text='Linked canonical species catalog record',
    )
    nickname = models.CharField(
        max_length=100,
        help_text='Personal name for the specimen',
    )
    location_in_home = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Room / microclimate location',
    )
    acquired_at = models.DateField(
        help_text='Date when the plant was acquired',
    )

    # Vital indicators
    vitality_index = models.SmallIntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Vitality score percentage (0–100)',
    )
    soil_moisture = models.SmallIntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Current soil moisture percentage (0–100)',
    )
    lux_intensity = models.IntegerField(
        default=1000,
        validators=[MinValueValidator(0)],
        help_text='Estimated sunlight intensity (Lux)',
    )

    photo = models.URLField(
        blank=True,
        default='',
        help_text='Specimen cover photograph URL',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this specimen is active in the personal collection',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-acquired_at']

    def __str__(self):
        return f'{self.nickname} ({self.species.scientific_name})'


class CareLog(models.Model):
    """Historical maintenance event for a specimen."""

    CARE_TYPE_CHOICES = [
        ('watering', 'Watering'),
        ('fertilizing', 'Fertilizing'),
        ('repotting', 'Repotting'),
        ('observation', 'Observation'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    specimen = models.ForeignKey(
        Specimen,
        on_delete=models.CASCADE,
        related_name='care_logs',
        help_text='Linked specimen instance',
    )
    type = models.CharField(
        max_length=50,
        choices=CARE_TYPE_CHOICES,
        help_text='Type of care activity',
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='Date and time when care was performed',
    )
    notes = models.TextField(
        blank=True,
        default='',
        help_text='Free-text observations or notes',
    )

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.get_type_display()} — {self.specimen.nickname}'
