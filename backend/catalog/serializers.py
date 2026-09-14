"""Serializers for the Species catalog."""

from rest_framework import serializers
from catalog.models import Species


class SpeciesSerializer(serializers.ModelSerializer):
    is_owned = serializers.BooleanField(read_only=True)

    class Meta:
        model = Species
        fields = [
            'id', 'gbif_key', 'scientific_name', 'common_name',
            'kingdom', 'phylum', 'class_name', 'order', 'family', 'genus',
            'native_region', 'is_owned',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_owned']


class SpeciesListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    is_owned = serializers.BooleanField(read_only=True)

    class Meta:
        model = Species
        fields = [
            'id', 'scientific_name', 'common_name', 'family', 'genus', 'is_owned',
        ]
