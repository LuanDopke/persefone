"""
Species model — Taxonomic catalog entity cached from GBIF API.
Constitution Principle V: Strict biological hierarchy and computed ownership.
"""

from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid


def normalize_taxonomic_name(value):
    """Return the canonical comparison key for a displayed taxonomic name."""
    return ' '.join((value or '').split()).casefold()


class Species(models.Model):
    """Canonical plant species entry, optionally cached from GBIF."""

    gbif_key = models.IntegerField(
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text='GBIF API usageKey',
    )
    scientific_name = models.CharField(
        max_length=255,
        db_index=True,
        help_text='Full binomial scientific name',
    )
    normalized_name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        editable=False,
    )
    common_name = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Primary vernacular/common name',
    )
    is_collection_favorite = models.BooleanField(
        default=False,
        help_text='Personal collection favourite preference',
    )

    # Taxonomic hierarchy
    kingdom = models.CharField(max_length=100, default='Plantae')
    phylum = models.CharField(max_length=100, blank=True, default='')
    class_name = models.CharField(max_length=100, blank=True, default='')
    order = models.CharField(max_length=100, blank=True, default='')
    family = models.CharField(max_length=100, blank=True, default='')
    genus = models.CharField(max_length=100, blank=True, default='')

    # Geographic origin
    native_region = models.JSONField(
        default=dict,
        blank=True,
        help_text='GeoJSON/Region metadata for origin mapping',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'species'
        ordering = ['scientific_name']

    def __str__(self):
        return self.scientific_name

    def save(self, *args, **kwargs):
        self.scientific_name = ' '.join((self.scientific_name or '').split())
        self.normalized_name = normalize_taxonomic_name(self.scientific_name)
        if not self.normalized_name:
            raise ValidationError({'scientific_name': 'Este campo é obrigatório.'})
        super().save(*args, **kwargs)

    @property
    def is_owned(self):
        """Returns True if at least one Specimen exists for this species."""
        return self.specimens.exists()


class Observation(models.Model):
    """A species sighting recorded by a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='species_observations')
    species = models.ForeignKey(Species, on_delete=models.PROTECT, related_name='observations')
    image = models.ImageField(upload_to='observations/%Y/%m/%d', blank=True)
    observed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-observed_at', '-created_at', '-id']

    def __str__(self):
        return f'{self.species.scientific_name} — {self.observed_at:%Y-%m-%d}'
