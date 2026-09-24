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
    """A field record that can be identified over time."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='species_observations')
    title = models.CharField(max_length=160)
    species = models.ForeignKey(Species, on_delete=models.PROTECT, null=True, blank=True, related_name='observations')
    confirmed_hypothesis = models.ForeignKey('ObservationHypothesis', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    observed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-observed_at', '-created_at', '-id']

    def __str__(self):
        return f'{self.title} — {self.observed_at:%Y-%m-%d}'


class ObservationEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='evidence')
    image = models.ImageField(upload_to='observations/%Y/%m/%d', blank=True)
    notes = models.TextField(blank=True)
    subject = models.CharField(max_length=12, choices=[('original', 'Planta principal'), ('comparison', 'Outro indivíduo')], default='original')
    observed_at = models.DateTimeField(default=timezone.now)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-observed_at', '-created_at']


class ObservationHypothesis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='hypotheses')
    name = models.CharField(max_length=255)
    rank = models.CharField(max_length=10, choices=[('genus', 'Gênero'), ('species', 'Espécie'), ('unknown', 'Não definido')], default='unknown')
    source = models.CharField(max_length=8, choices=[('catalog', 'Catálogo'), ('manual', 'Texto livre')])
    species = models.ForeignKey(Species, on_delete=models.PROTECT, null=True, blank=True)
    gbif_key = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    discarded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ObservationIdentificationEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='identification_events')
    hypothesis = models.ForeignKey(ObservationHypothesis, on_delete=models.PROTECT, null=True, blank=True)
    action = models.CharField(max_length=8, choices=[('confirm', 'Confirmação'), ('reopen', 'Reabertura')])
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ObservationRevision(models.Model):
    """Previous and new values for a correction to field evidence or a hypothesis note."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='revisions')
    evidence = models.ForeignKey(ObservationEvidence, on_delete=models.CASCADE, null=True, blank=True, related_name='revisions')
    hypothesis = models.ForeignKey(ObservationHypothesis, on_delete=models.CASCADE, null=True, blank=True, related_name='revisions')
    before = models.JSONField()
    after = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class IdentificationKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='identification_keys')
    title = models.CharField(max_length=160)
    scope_rank = models.CharField(max_length=6, choices=[('family', 'Família'), ('genus', 'Gênero')])
    scope_gbif_key = models.PositiveIntegerField(db_index=True)
    scope_name = models.CharField(max_length=255)
    coverage = models.TextField()
    source = models.CharField(max_length=500)
    source_metadata = models.JSONField(default=dict, blank=True)
    draft_graph = models.JSONField(default=dict)
    published_version = models.PositiveIntegerField(default=0)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class IdentificationKeyVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.ForeignKey(IdentificationKey, on_delete=models.CASCADE, related_name='versions')
    number = models.PositiveIntegerField()
    graph = models.JSONField()
    title = models.CharField(max_length=160)
    coverage = models.TextField()
    source = models.CharField(max_length=500)
    source_metadata = models.JSONField(default=dict, blank=True)
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['key', 'number'], name='unique_identification_key_version')]
        ordering = ['-number']

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError('Uma versão publicada não pode ser alterada.')
        return super().save(*args, **kwargs)


class IdentificationKeySuggestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.ForeignKey(IdentificationKey, on_delete=models.CASCADE, related_name='suggestions')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    base_version = models.PositiveIntegerField()
    graph = models.JSONField()
    note = models.TextField(blank=True)
    status = models.CharField(max_length=8, choices=[('pending', 'Pendente'), ('accepted', 'Aceita'), ('rejected', 'Rejeitada')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


class IdentificationKeyReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.ForeignKey(IdentificationKey, on_delete=models.CASCADE, related_name='reports')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class IdentificationKeyRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='key_runs')
    version = models.ForeignKey(IdentificationKeyVersion, on_delete=models.PROTECT)
    parent_run = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    answers = models.JSONField(default=list)
    pending_note = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=[('active', 'Ativo'), ('paused', 'Pausado'), ('completed', 'Concluído'), ('superseded', 'Substituído')], default='active')
    result_taxon = models.JSONField(null=True, blank=True)
    result_hypothesis = models.ForeignKey(ObservationHypothesis, on_delete=models.SET_NULL, null=True, blank=True)
    created_hypothesis = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class IdentificationKeyRunRevision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(IdentificationKeyRun, on_delete=models.CASCADE, related_name='revisions')
    before = models.JSONField()
    after = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
