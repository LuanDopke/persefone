"""
Species model — Taxonomic catalog entity cached from GBIF API.
Constitution Principle V: Strict biological hierarchy and computed ownership.
"""

from django.core.exceptions import ValidationError
from django.db import models


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
