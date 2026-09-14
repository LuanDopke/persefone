import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken

from .models import AccessRequest, AccountProfile

REQUEST_LIMIT = timedelta(minutes=1)
TOKEN_LIFETIME = timedelta(minutes=15)


def normalize_email(email):
    return email.strip().lower()


def _hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def request_access(email):
    email = normalize_email(email)
    latest = AccessRequest.objects.filter(email=email).order_by('-created_at').first()
    if latest and latest.created_at >= timezone.now() - REQUEST_LIMIT:
        return 'limited'
    token = secrets.token_urlsafe(32)
    request = AccessRequest.objects.create(email=email, token_hash=_hash(token), expires_at=timezone.now() + TOKEN_LIFETIME)
    url = f'{settings.FRONTEND_URL}/access/confirm?token={token}'
    try:
        send_mail('Seu acesso ao Persefone', f'Use este link para acessar: {url}', None, [email], fail_silently=False)
    except Exception:
        request.delete()
        return 'delivery_failed'
    return request


@transaction.atomic
def confirm_access(token):
    request = AccessRequest.objects.select_for_update().filter(token_hash=_hash(token)).first()
    if request is None or not request.is_usable:
        return None
    request.used_at = timezone.now()
    request.save(update_fields=['used_at'])
    profile = AccountProfile.objects.select_related('user').filter(email=request.email).first()
    if profile is None:
        username = request.email
        user, _ = User.objects.get_or_create(username=username, defaults={'email': request.email})
        profile = AccountProfile.objects.create(user=user, email=request.email)
    token = AccessToken.for_user(profile.user)
    return {'access': str(token), 'email': profile.email, 'display_name': profile.email.split('@', 1)[0]}
