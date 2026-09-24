"""Serializers for the Species catalog."""

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone

from catalog.models import (Observation, ObservationEvidence, ObservationHypothesis,
                            ObservationIdentificationEvent, ObservationRevision, Species, normalize_taxonomic_name)
from specimens.services import compressed_photo, validate_image_upload


class SpeciesSerializer(serializers.ModelSerializer):
    is_owned = serializers.SerializerMethodField()

    class Meta:
        model = Species
        fields = [
            'id', 'gbif_key', 'scientific_name', 'common_name',
            'kingdom', 'phylum', 'class_name', 'order', 'family', 'genus',
            'native_region', 'is_owned',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_owned']

    def get_is_owned(self, instance):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return instance.specimens.filter(owner=request.user).exists()
        return instance.is_owned


class SpeciesListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    is_owned = serializers.SerializerMethodField()

    class Meta:
        model = Species
        fields = [
            'id', 'scientific_name', 'common_name', 'family', 'genus', 'is_owned',
        ]

    def get_is_owned(self, instance):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return instance.specimens.filter(owner=request.user).exists()
        return instance.is_owned


class LocalSpeciesCreateSerializer(serializers.Serializer):
    scientific_name = serializers.CharField(max_length=255, trim_whitespace=True)

    def validate_scientific_name(self, value):
        display_name = ' '.join(value.split())
        if not normalize_taxonomic_name(display_name):
            raise serializers.ValidationError('Este campo é obrigatório.')
        return display_name

    def validated_species_values(self):
        scientific_name = self.validated_data['scientific_name']
        return {
            'scientific_name': scientific_name,
            'normalized_name': normalize_taxonomic_name(scientific_name),
            'genus': scientific_name.split()[0],
        }


def validate_coordinates(attrs, instance=None):
    latitude = attrs.get('latitude', getattr(instance, 'latitude', None))
    longitude = attrs.get('longitude', getattr(instance, 'longitude', None))
    if (latitude is None) != (longitude is None):
        raise serializers.ValidationError({'latitude': 'Informe latitude e longitude juntas.'})
    if latitude is not None and not -90 <= latitude <= 90:
        raise serializers.ValidationError({'latitude': 'Latitude fora do intervalo permitido.'})
    if longitude is not None and not -180 <= longitude <= 180:
        raise serializers.ValidationError({'longitude': 'Longitude fora do intervalo permitido.'})
    return attrs


def validate_past(value):
    if value > timezone.now():
        raise serializers.ValidationError('A data da observação não pode estar no futuro.')
    return value


class ObservationRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservationRevision
        fields = ['id', 'before', 'after', 'created_at']


class ObservationEvidenceSerializer(serializers.ModelSerializer):
    revisions = ObservationRevisionSerializer(many=True, read_only=True)

    class Meta:
        model = ObservationEvidence
        fields = ['id', 'image', 'notes', 'subject', 'observed_at', 'latitude', 'longitude', 'created_at', 'revisions']
        read_only_fields = ['id', 'created_at', 'revisions']

    def validate_image(self, value):
        return validate_image_upload(value)

    def validate_observed_at(self, value):
        return validate_past(value)

    def validate(self, attrs):
        validate_coordinates(attrs, self.instance)
        image = attrs.get('image', getattr(self.instance, 'image', None))
        notes = attrs.get('notes', getattr(self.instance, 'notes', ''))
        if not image and not notes.strip():
            raise serializers.ValidationError('Informe uma foto ou uma nota.')
        return attrs

    def create(self, validated_data):
        upload = validated_data.pop('image', None)
        evidence = ObservationEvidence(**validated_data)
        try:
            if upload:
                evidence.image = compressed_photo(upload)
            evidence.save()
            return evidence
        except Exception:
            if evidence.image.name:
                evidence.image.storage.delete(evidence.image.name)
            raise


class ObservationHypothesisSerializer(serializers.ModelSerializer):
    revisions = ObservationRevisionSerializer(many=True, read_only=True)

    class Meta:
        model = ObservationHypothesis
        fields = ['id', 'name', 'rank', 'source', 'species', 'gbif_key', 'notes', 'discarded_at', 'created_at', 'revisions']
        read_only_fields = ['id', 'discarded_at', 'created_at', 'revisions']
        extra_kwargs = {'name': {'required': False}}

    def validate(self, attrs):
        source = attrs.get('source')
        if source == 'manual':
            if attrs.get('species') or attrs.get('gbif_key'):
                raise serializers.ValidationError('Uma hipótese livre não pode ter vínculo com o catálogo.')
            attrs['name'] = ' '.join(attrs.get('name', '').split())
            if not attrs['name']:
                raise serializers.ValidationError({'name': 'Informe o nome da hipótese.'})
        elif source == 'catalog':
            species = attrs.get('species')
            gbif_key = attrs.get('gbif_key')
            if bool(species) == bool(gbif_key):
                raise serializers.ValidationError('Selecione uma espécie local ou um táxon GBIF.')
            if species:
                attrs['name'] = species.scientific_name
                attrs['rank'] = 'species' if len(species.scientific_name.split()) > 1 and not species.scientific_name.lower().endswith((' sp.', ' spp.')) else 'genus'
            elif attrs.get('rank') not in ('genus', 'species') or not attrs.get('name', '').strip():
                raise serializers.ValidationError('Informe o nome e o nível do táxon selecionado.')
        return attrs


class ObservationIdentificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservationIdentificationEvent
        fields = ['id', 'action', 'hypothesis', 'notes', 'created_at']


class ObservationListSerializer(serializers.ModelSerializer):
    species_detail = SpeciesListSerializer(source='species', read_only=True)
    image = serializers.SerializerMethodField()
    active_hypotheses_count = serializers.SerializerMethodField()

    class Meta:
        model = Observation
        fields = ['id', 'title', 'species_detail', 'image', 'observed_at', 'updated_at', 'active_hypotheses_count']

    def get_image(self, instance):
        first = next((item for item in instance.evidence.all() if item.image), None)
        if first is None:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(first.image.url) if request else first.image.url

    def get_active_hypotheses_count(self, instance):
        return sum(item.discarded_at is None for item in instance.hypotheses.all())


class ObservationSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=False)
    initial_notes = serializers.CharField(write_only=True, required=False, allow_blank=True)
    species_detail = SpeciesSerializer(source='species', read_only=True)
    related_species = serializers.SerializerMethodField()
    evidence = ObservationEvidenceSerializer(many=True, read_only=True)
    hypotheses = ObservationHypothesisSerializer(many=True, read_only=True)
    identification_events = ObservationIdentificationEventSerializer(many=True, read_only=True)

    class Meta:
        model = Observation
        fields = ['id', 'title', 'species', 'species_detail', 'confirmed_hypothesis', 'related_species',
                  'image', 'initial_notes', 'latitude', 'longitude', 'observed_at', 'evidence',
                  'hypotheses', 'identification_events', 'created_at', 'updated_at']
        read_only_fields = ['id', 'species_detail', 'confirmed_hypothesis', 'related_species',
                            'evidence', 'hypotheses', 'identification_events', 'created_at', 'updated_at']
        extra_kwargs = {'species': {'required': False, 'allow_null': True}, 'title': {'required': False}}

    def get_related_species(self, instance):
        if not instance.species or not instance.species.genus:
            return []
        queryset = Species.objects.filter(genus__iexact=instance.species.genus).exclude(pk=instance.species_id)
        return SpeciesListSerializer(queryset[:20], many=True, context=self.context).data

    def validate_observed_at(self, value):
        return validate_past(value)

    def validate_image(self, value):
        return validate_image_upload(value)

    def validate(self, attrs):
        validate_coordinates(attrs, self.instance)
        if self.instance and 'species' in attrs:
            raise serializers.ValidationError({'species': 'Use a ação de confirmação da identificação.'})
        species = attrs.get('species')
        if species and (len(species.scientific_name.split()) < 2 or species.scientific_name.lower().endswith((' sp.', ' spp.'))):
            raise serializers.ValidationError({'species': 'Selecione uma espécie, não apenas um gênero.'})
        if not self.instance and not (attrs.get('title', '').strip() or attrs.get('species')):
            raise serializers.ValidationError({'title': 'Informe um título para a observação.'})
        if 'title' in attrs:
            attrs['title'] = attrs['title'].strip()
            if not attrs['title']:
                raise serializers.ValidationError({'title': 'Informe um título para a observação.'})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        first = next((item for item in instance.evidence.all() if item.image), None)
        data['image'] = self.fields['image'].to_representation(first.image) if first else None
        return data

    def create(self, validated_data):
        upload = validated_data.pop('image', None)
        notes = validated_data.pop('initial_notes', '')
        species = validated_data.get('species')
        if not validated_data.get('title') and species:
            validated_data['title'] = species.scientific_name
        saved_evidence = None
        try:
            with transaction.atomic():
                observation = Observation.objects.create(**validated_data)
                if upload or notes.strip():
                    evidence_data = {'notes': notes, 'observed_at': observation.observed_at, 'subject': 'original'}
                    if upload:
                        evidence_data['image'] = upload
                    evidence = ObservationEvidenceSerializer(data=evidence_data)
                    evidence.is_valid(raise_exception=True)
                    saved_evidence = evidence.save(observation=observation)
                if species:
                    hypothesis = ObservationHypothesis.objects.create(observation=observation,
                        name=species.scientific_name, rank='species', source='catalog', species=species)
                    observation.confirmed_hypothesis = hypothesis
                    observation.save(update_fields=['confirmed_hypothesis'])
                    ObservationIdentificationEvent.objects.create(observation=observation,
                        hypothesis=hypothesis, action='confirm')
            return observation
        except Exception:
            if saved_evidence and saved_evidence.image.name:
                saved_evidence.image.storage.delete(saved_evidence.image.name)
            raise
