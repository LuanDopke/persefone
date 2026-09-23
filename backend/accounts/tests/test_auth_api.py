from unittest.mock import Mock

import pytest
from django.core import mail
from rest_framework.test import APIClient

from accounts.models import AccessRequest
from accounts.services import _hash


@pytest.mark.django_db
def test_access_request_validates_and_returns_neutral_response(settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    client = APIClient()
    assert client.post('/api/auth/access-requests/', {'email': 'bad'}).status_code == 400
    response = client.post('/api/auth/access-requests/', {'email': ' Ana@Example.com '}, format='json')
    assert response.status_code == 202
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_access_request_reports_delivery_failure_and_allows_retry(settings, monkeypatch):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    monkeypatch.setattr('accounts.services.send_mail', Mock(side_effect=OSError))
    client = APIClient()

    response = client.post('/api/auth/access-requests/', {'email': 'ana@example.com'}, format='json')

    assert response.status_code == 503
    assert response.data['detail'] == 'Não foi possível enviar o link agora. Tente novamente.'
    assert not AccessRequest.objects.filter(email='ana@example.com').exists()


@pytest.mark.django_db
def test_confirmation_creates_account_and_token(settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    client = APIClient()
    client.post('/api/auth/access-requests/', {'email': 'ana@example.com'}, format='json')
    request = AccessRequest.objects.get()
    # Use a known request because production tokens are intentionally not stored in plaintext.
    request.token_hash = _hash('valid-token')
    request.save(update_fields=['token_hash'])
    response = client.post('/api/auth/access-confirmations/', {'token': 'valid-token'}, format='json')
    assert response.status_code == 200
    assert response.data['email'] == 'ana@example.com'
    assert client.post('/api/auth/access-confirmations/', {'token': 'valid-token'}, format='json').status_code == 400


@pytest.mark.django_db
def test_logout_requires_token():
    assert APIClient().post('/api/auth/logout/').status_code == 401
