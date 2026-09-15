"""Serializers for Specimen and CareLog."""

from datetime import datetime
from io import BytesIO
from pathlib import Path
import uuid
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
import pillow_avif  # noqa: F401 -- registers AVIF support in Pillow
from PIL import Image, ImageOps
from rest_framework import serializers
from specimens.models import Specimen, CareLog, VisualEntry
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
    care_logs = CareLogSerializer(many=True, read_only=True)
    initial_visual_entry = serializers.SerializerMethodField()

    class Meta:
        model = Specimen
        fields = [
            'id', 'species', 'species_detail',
            'nickname', 'location_in_home', 'acquired_at',
            'initial_soil', 'initial_light',
            'vitality_index', 'soil_moisture', 'lux_intensity',
            'photo', 'initial_visual_entry', 'care_logs',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_initial_visual_entry(self, instance):
        entry = next(iter(instance.visual_entries.all()), None)
        if entry is None:
            return None
        return VisualEntrySerializer(entry, context=self.context).data


class VisualEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualEntry
        fields = ['id', 'image', 'captured_at']
        read_only_fields = fields


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

    def _compressed_photo(self, upload):
        upload.seek(0)
        with Image.open(upload) as image:
            image = ImageOps.exif_transpose(image)
            image.thumbnail((settings.INITIAL_PHOTO_MAX_DIMENSION,) * 2)
            if image.mode not in ('RGB', 'L'):
                background = Image.new('RGB', image.size, 'white')
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.getchannel('A'))
                else:
                    background.paste(image.convert('RGB'))
                image = background
            elif image.mode == 'L':
                image = image.convert('RGB')

            quality = settings.INITIAL_PHOTO_AVIF_QUALITY
            while True:
                output = BytesIO()
                image.save(output, format='AVIF', quality=quality, speed=6)
                if output.tell() <= settings.INITIAL_PHOTO_TARGET_BYTES:
                    break
                if quality > 25:
                    quality -= 10
                    continue
                width, height = image.size
                if max(width, height) <= 640:
                    break
                image.thumbnail((int(width * 0.8), int(height * 0.8)), Image.Resampling.LANCZOS)
        stem = Path(upload.name).stem[:80] or 'initial'
        return ContentFile(output.getvalue(), name=f'{stem}-{uuid.uuid4().hex}.avif')

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
                    entry = VisualEntry(specimen=specimen, image=self._compressed_photo(initial_photo))
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
