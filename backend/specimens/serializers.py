"""Serializers for Specimen and CareLog."""

from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from specimens.models import Specimen, CareLog, VisualEntry
from specimens.services import compressed_photo, validate_image_upload
from catalog.serializers import SpeciesListSerializer


class CollectionSpeciesSerializer(serializers.Serializer):
    """Read model returned by the personal collection endpoint."""

    species_id = serializers.IntegerField()
    specimen_id = serializers.UUIDField(allow_null=True)
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
        fields = ['id', 'specimen', 'type', 'type_display', 'occurred_at', 'created_at', 'notes']
        read_only_fields = ['id', 'created_at']

    def validate_occurred_at(self, value):
        if value > timezone.now():
            raise serializers.ValidationError('A data e hora não podem estar no futuro.')
        return value

    def validate_specimen(self, specimen):
        request = self.context.get('request')
        if request and specimen.owner_id != request.user.id:
            raise serializers.ValidationError('Exemplar não encontrado.')
        return specimen


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
    care_logs = serializers.SerializerMethodField()
    initial_visual_entry = serializers.SerializerMethodField()
    representative_visual_entry = serializers.SerializerMethodField()
    latest_care_log = serializers.SerializerMethodField()

    class Meta:
        model = Specimen
        fields = [
            'id', 'species', 'species_detail',
            'nickname', 'location_in_home', 'acquired_at',
            'initial_soil', 'initial_light',
            'vitality_index', 'soil_moisture', 'lux_intensity', 'metrics_updated_at',
            'photo', 'is_active', 'initial_visual_entry', 'representative_visual_entry', 'latest_care_log', 'care_logs',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'species', 'species_detail', 'metrics_updated_at',
            'created_at', 'updated_at', 'initial_visual_entry',
            'representative_visual_entry', 'latest_care_log', 'care_logs',
        ]

    def get_initial_visual_entry(self, instance):
        entry = instance.visual_entries.order_by('created_at', 'id').first()
        if entry is None:
            return None
        return VisualEntrySerializer(entry, context=self.context).data

    def get_representative_visual_entry(self, instance):
        entry = instance.visual_entries.order_by('-captured_at', '-created_at', '-id').first()
        if entry is None:
            return None
        return VisualEntrySerializer(entry, context=self.context).data

    def get_latest_care_log(self, instance):
        entry = instance.care_logs.order_by('-occurred_at', '-created_at', '-id').first()
        return CareLogSerializer(entry, context=self.context).data if entry else None

    def get_care_logs(self, instance):
        # Kept as a bounded compatibility projection for existing consumers.
        entries = instance.care_logs.order_by('-occurred_at', '-created_at', '-id')[:1]
        return CareLogSerializer(entries, many=True, context=self.context).data


class SpecimenUpdateSerializer(serializers.ModelSerializer):
    expected_updated_at = serializers.DateTimeField(write_only=True, required=False)

    class Meta:
        model = Specimen
        fields = [
            'id', 'species', 'nickname', 'location_in_home', 'acquired_at',
            'initial_soil', 'initial_light', 'vitality_index', 'soil_moisture',
            'lux_intensity', 'is_active', 'expected_updated_at', 'updated_at',
        ]
        read_only_fields = ['id', 'species', 'updated_at']

    def validate_nickname(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Informe um nome para o exemplar.')
        return value

    def validate_initial_soil(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Informe a condição do solo.')
        return value

    def validate_acquired_at(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError('A data não pode estar no futuro.')
        return value

    def update(self, instance, validated_data):
        validated_data.pop('expected_updated_at', None)
        metric_fields = {'vitality_index', 'soil_moisture', 'lux_intensity'}
        metrics_changed = any(name in validated_data and getattr(instance, name) != value for name, value in validated_data.items() if name in metric_fields)
        for name, value in validated_data.items():
            setattr(instance, name, value)
        if metrics_changed:
            instance.metrics_updated_at = timezone.now()
        instance.save()
        return instance


class VisualEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualEntry
        fields = ['id', 'specimen', 'image', 'captured_at', 'created_at', 'notes']
        read_only_fields = fields


class VisualEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualEntry
        fields = ['id', 'specimen', 'image', 'captured_at', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_specimen(self, specimen):
        request = self.context.get('request')
        if request and specimen.owner_id != request.user.id:
            raise serializers.ValidationError('Exemplar não encontrado.')
        return specimen

    def validate_captured_at(self, value):
        if value > timezone.now():
            raise serializers.ValidationError('A data e hora não podem estar no futuro.')
        return value

    def validate_image(self, value):
        return validate_image_upload(value)

    def create(self, validated_data):
        upload = validated_data.pop('image')
        stored_name = None
        entry = None
        try:
            with transaction.atomic():
                entry = VisualEntry(image=compressed_photo(upload), **validated_data)
                entry.save()
                stored_name = entry.image.name
            return entry
        except Exception:
            if entry is not None and entry.image.name:
                entry.image.storage.delete(entry.image.name)
            elif stored_name:
                entry.image.storage.delete(stored_name)
            raise


class SpecimenCreateSerializer(serializers.ModelSerializer):
    client_timezone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    initial_photo = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Specimen
        fields = [
            'id', 'species', 'nickname', 'acquired_at', 'client_timezone',
            'initial_soil', 'initial_light', 'initial_photo',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'nickname': {'required': False, 'allow_blank': True},
            'initial_soil': {'required': True, 'allow_blank': False, 'trim_whitespace': True},
            'initial_light': {'required': True},
        }

    def validate(self, attrs):
        timezone_name = attrs.pop('client_timezone', '') or settings.TIME_ZONE
        try:
            local_timezone = ZoneInfo(timezone_name)
        except ZoneInfoNotFoundError:
            local_timezone = ZoneInfo(settings.TIME_ZONE)
        acquired_at = attrs.get('acquired_at')
        if acquired_at and acquired_at > datetime.now(local_timezone).date():
            raise serializers.ValidationError({'acquired_at': ['A data não pode estar no futuro.']})
        return attrs

    def validate_initial_photo(self, value):
        if value.size > settings.INITIAL_PHOTO_MAX_BYTES:
            raise serializers.ValidationError('A foto deve ter no máximo 10 MB.')
        return value

    def create(self, validated_data):
        initial_photo = validated_data.pop('initial_photo', None)
        owner = validated_data['owner']
        nickname = validated_data.get('nickname', '').strip()
        if not nickname:
            base = validated_data['species'].scientific_name
            sequence = Specimen.objects.filter(owner=owner, species=validated_data['species']).count() + 1
            nickname = f'{base} #{sequence}'
        validated_data['nickname'] = nickname
        stored_files = []
        try:
            with transaction.atomic():
                specimen = super().create(validated_data)
                if initial_photo:
                    entry = VisualEntry(specimen=specimen, image=compressed_photo(initial_photo))
                    try:
                        entry.save()
                    except Exception:
                        if entry.image.name:
                            entry.image.storage.delete(entry.image.name)
                        raise
                    stored_files.append((entry.image.storage, entry.image.name))
                return specimen
        except Exception:
            for storage, name in stored_files:
                storage.delete(name)
            raise

    def to_representation(self, instance):
        return SpecimenDetailSerializer(instance, context=self.context).data
