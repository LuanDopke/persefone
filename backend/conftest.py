import pytest
import django
from django.conf import settings


@pytest.fixture(scope='session')
def django_db_setup():
    """Use in-memory SQLite for tests."""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
    }
