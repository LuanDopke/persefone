"""Serializers for the Species catalog."""

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone

from catalog.models import Observation, Species, normalize_taxonomic_name
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


class ObservationSerializer(serializers.ModelSerializer):
    species_detail = SpeciesSerializer(source='species', read_only=True)
    related_species = serializers.SerializerMethodField()

    class Meta:
        model = Observation
        fields = ['id', 'species', 'species_detail', 'related_species', 'image', 'observed_at', 'created_at']
        read_only_fields = ['id', 'species_detail', 'related_species', 'created_at']
        extra_kwargs = {'image': {'required': False}}

    def get_related_species(self, instance):
        if not instance.species.genus:
            return []
        queryset = Species.objects.filter(genus__iexact=instance.species.genus).exclude(pk=instance.species_id)
        return SpeciesListSerializer(queryset[:20], many=True, context=self.context).data

    def validate_observed_at(self, value):
        if value > timezone.now():
            raise serializers.ValidationError('A data da observação não pode estar no futuro.')
        return value

    def validate_image(self, value):
        return validate_image_upload(value)

    def create(self, validated_data):
        upload = validated_data.pop('image', None)
        observation = None
        try:
            with transaction.atomic():
                observation = Observation(**validated_data)
                if upload:
                    observation.image = compressed_photo(upload)
                observation.save()
            return observation
        except Exception:
            if observation is not None and observation.image.name:
                observation.image.storage.delete(observation.image.name)
            raise
