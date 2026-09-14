"""Serializers for Specimen and CareLog."""

from rest_framework import serializers
from specimens.models import Specimen, CareLog
from catalog.serializers import SpeciesListSerializer


class CollectionSpeciesSerializer(serializers.Serializer):
    """Read model returned by the personal collection endpoint."""

    species_id = serializers.IntegerField()
    common_name = serializers.CharField(allow_blank=True)
    scientific_name = serializers.CharField()
    image_url = serializers.URLField(allow_null=True)
    specimen_count = serializers.IntegerField()
    is_archived = serializers.BooleanField()
    is_favorite = serializers.BooleanField()
    care = serializers.DictField()
    care_reference = serializers.DictField()


class CareLogSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = CareLog
        fields = ['id', 'specimen', 'type', 'type_display', 'timestamp', 'notes']
        read_only_fields = ['id', 'timestamp']


class SpecimenListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    species_name = serializers.CharField(source='species.scientific_name', read_only=True)

    class Meta:
        model = Specimen
        fields = [
            'id', 'nickname', 'species', 'species_name',
            'location_in_home', 'vitality_index',
            'acquired_at',
        ]


class SpecimenDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail view."""
    species_detail = SpeciesListSerializer(source='species', read_only=True)
    care_logs = CareLogSerializer(many=True, read_only=True)

    class Meta:
        model = Specimen
        fields = [
            'id', 'species', 'species_detail',
            'nickname', 'location_in_home', 'acquired_at',
            'vitality_index', 'soil_moisture', 'lux_intensity',
            'photo', 'care_logs',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
