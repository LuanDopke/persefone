from io import BytesIO

import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers

from specimens.services import compressed_photo, validate_image_upload


def upload(fmt='PNG', name='photo.png', color='green'):
    stream = BytesIO()
    Image.new('RGB', (40, 30), color=color).save(stream, format=fmt)
    return SimpleUploadedFile(name, stream.getvalue(), content_type=f'image/{fmt.lower()}')


@pytest.mark.django_db
def test_compressed_photo_returns_displayable_avif(settings):
    result = compressed_photo(upload())
    assert result.name.endswith('.avif')
    assert len(result.read()) <= settings.INITIAL_PHOTO_TARGET_BYTES


def test_validate_image_upload_rejects_non_image():
    with pytest.raises(serializers.ValidationError):
        validate_image_upload(SimpleUploadedFile('note.txt', b'not image', content_type='text/plain'))


def test_validate_image_upload_rejects_oversized(settings):
    settings.INITIAL_PHOTO_MAX_BYTES = 2
    with pytest.raises(serializers.ValidationError):
        validate_image_upload(SimpleUploadedFile('photo.png', b'123', content_type='image/png'))
