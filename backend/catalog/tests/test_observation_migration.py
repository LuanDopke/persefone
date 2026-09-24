import pytest
from django.contrib.auth import get_user_model
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


@pytest.mark.django_db(transaction=True)
def test_existing_observation_becomes_confirmed_with_evidence():
    old = ('catalog', '0004_observation')
    new = ('catalog', '0005_observation_identification')
    executor = MigrationExecutor(connection)
    executor.migrate([old])
    old_apps = executor.loader.project_state([old]).apps
    Species = old_apps.get_model('catalog', 'Species')
    Observation = old_apps.get_model('catalog', 'Observation')
    user = get_user_model().objects.create_user(username='observation-migration-user')
    species = Species.objects.create(scientific_name='Begonia maculata', normalized_name='begonia maculata')
    observation = Observation.objects.create(owner_id=user.pk, species_id=species.pk, image='observations/legacy.avif')
    try:
        executor = MigrationExecutor(connection)
        executor.migrate([new])
        apps = executor.loader.project_state([new]).apps
        migrated = apps.get_model('catalog', 'Observation').objects.get(pk=observation.pk)
        assert migrated.title == 'Begonia maculata'
        assert migrated.confirmed_hypothesis_id is not None
        assert apps.get_model('catalog', 'ObservationEvidence').objects.get(observation_id=observation.pk).image.name == 'observations/legacy.avif'
        assert apps.get_model('catalog', 'ObservationIdentificationEvent').objects.get(observation_id=observation.pk).action == 'confirm'
    finally:
        MigrationExecutor(connection).migrate([new])
