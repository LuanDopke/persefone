"""Serializers for the Species catalog."""

from rest_framework import serializers
from catalog.models import Species, normalize_taxonomic_name


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
