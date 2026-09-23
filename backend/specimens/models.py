"""
Specimen and CareLog models — Personal plant instances and care timeline.
Constitution Principle V: Specimen linked to Species, immutable care timestamps.
"""

import uuid

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Specimen(models.Model):
    """Individual physical plant belonging to the user."""

    class Light(models.TextChoices):
        SOMBRA = 'Sombra', 'Sombra'
        MEIA_SOMBRA = 'Meia sombra', 'Meia sombra'
        SOL_PLENO = 'Sol pleno', 'Sol pleno'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='specimens',
    )
    species = models.ForeignKey(
        'catalog.Species',
        on_delete=models.PROTECT,
        related_name='specimens',
        help_text='Linked canonical species catalog record',
    )
    nickname = models.CharField(
        max_length=100,
        blank=True,
        default='',
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
    initial_soil = models.TextField(
        default='',
        help_text='Initial free-text soil description',
    )
    initial_light = models.CharField(
        max_length=20,
        choices=Light.choices,
        default=Light.MEIA_SOMBRA,
        help_text='Initial light condition',
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
    metrics_updated_at = models.DateTimeField(
        default=timezone.now,
        help_text='Date and time when current vital metrics were last updated',
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

    @property
    def display_name(self):
        return self.nickname.strip() or self.species.scientific_name


class VisualEntry(models.Model):
    """Chronological photograph attached to a specimen."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    specimen = models.ForeignKey(
        Specimen,
        on_delete=models.CASCADE,
        related_name='visual_entries',
    )
    care_log = models.OneToOneField(
        'CareLog',
        on_delete=models.CASCADE,
        related_name='visual_entry',
        null=True,
        blank=True,
    )
    image = models.ImageField(upload_to='specimens/initial/%Y/%m/%d')
    captured_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-captured_at', '-created_at', '-id']

    def save(self, *args, **kwargs):
        if self.pk:
            original = type(self).objects.filter(pk=self.pk).values('captured_at').first()
            if original and original['captured_at'] != self.captured_at:
                self.captured_at = original['captured_at']
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Visual entry for {self.specimen.display_name}'


class CareLog(models.Model):
    """Historical maintenance event for a specimen."""

    CARE_TYPE_CHOICES = [
        ('watering', 'Watering'),
        ('fertilizing', 'Fertilizing'),
        ('repotting', 'Repotting'),
        ('pruning', 'Pruning'),
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
    occurred_at = models.DateTimeField(
        default=timezone.now,
        help_text='Date and time when care was performed',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(
        blank=True,
        default='',
        help_text='Free-text observations or notes',
    )

    class Meta:
        ordering = ['-occurred_at', '-created_at', '-id']

    def save(self, *args, **kwargs):
        if self.pk:
            original = type(self).objects.filter(pk=self.pk).values('occurred_at').first()
            if original and original['occurred_at'] != self.occurred_at:
                self.occurred_at = original['occurred_at']
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.get_type_display()} — {self.specimen.nickname}'
