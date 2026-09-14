from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.utils import timezone

from accounts.models import AccessRequest, AccountProfile


@pytest.mark.django_db
def test_profile_email_is_unique():
    AccountProfile.objects.create(user=User.objects.create_user('first'), email='ana@example.com')
    with pytest.raises(IntegrityError):
        AccountProfile.objects.create(user=User.objects.create_user('second'), email='ana@example.com')


@pytest.mark.django_db
def test_access_request_state_helpers():
    request = AccessRequest.objects.create(
        email='ana@example.com', token_hash='hash', expires_at=timezone.now() + timedelta(minutes=15)
    )
    assert request.is_usable is True
    request.used_at = timezone.now()
    assert request.is_usable is False
    request.used_at = None
    request.expires_at = timezone.now() - timedelta(seconds=1)
    assert request.is_usable is False
