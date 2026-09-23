"""Shared image validation and normalization for specimen photos."""

from io import BytesIO
from pathlib import Path
import uuid

import pillow_avif  # noqa: F401
from PIL import Image, ImageOps
from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import serializers


def validate_image_upload(upload):
    if upload.size > settings.INITIAL_PHOTO_MAX_BYTES:
        raise serializers.ValidationError('A foto deve ter no máximo 10 MB.')
    try:
        upload.seek(0)
        with Image.open(upload) as image:
            image.verify()
    except Exception as exc:
        raise serializers.ValidationError('Envie um arquivo de imagem válido.') from exc
    finally:
        upload.seek(0)
    return upload


def compressed_photo(upload):
    validate_image_upload(upload)
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
    stem = Path(upload.name).stem[:80] or 'specimen'
    return ContentFile(output.getvalue(), name=f'{stem}-{uuid.uuid4().hex}.avif')
