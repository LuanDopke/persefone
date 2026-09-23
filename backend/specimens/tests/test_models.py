"""Unit tests for specimens models (Specimen, CareLog)."""

import pytest
from datetime import date, datetime, timezone
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from catalog.models import Species
from specimens.models import Specimen, CareLog, VisualEntry


@pytest.fixture
def sample_species(db):
    return Species.objects.create(
        scientific_name='Monstera deliciosa',
        common_name='Swiss Cheese Plant',
        family='Araceae',
        genus='Monstera',
    )


@pytest.fixture
def owner(db):
    return User.objects.create_user(username='model-owner')


@pytest.fixture
def sample_specimen(sample_species, owner):
    return Specimen.objects.create(
        owner=owner,
        species=sample_species,
        nickname='Monsterina',
        location_in_home='Living Room Window',
        acquired_at=date(2024, 6, 1),
        vitality_index=95,
        soil_moisture=60,
        lux_intensity=800,
    )


@pytest.mark.django_db
class TestSpecimenModel:
    """Tests for the Specimen model."""

    def test_create_specimen(self, sample_species, owner):
        """Specimen can be created and linked to a species."""
        specimen = Specimen.objects.create(
            owner=owner,
            species=sample_species,
            nickname='Test Plant',
            acquired_at=date(2024, 1, 1),
        )
        assert specimen.pk is not None
        assert specimen.species == sample_species
        assert specimen.vitality_index == 100  # default

    def test_specimen_str(self, sample_specimen):
        """__str__ shows nickname and scientific name."""
        assert 'Monsterina' in str(sample_specimen)
        assert 'Monstera deliciosa' in str(sample_specimen)

    def test_vitality_defaults(self, sample_species, owner):
        """Specimen has correct default vital values."""
        specimen = Specimen.objects.create(
            owner=owner,
            species=sample_species,
            nickname='Defaults',
            acquired_at=date(2024, 1, 1),
        )
        assert specimen.vitality_index == 100
        assert specimen.soil_moisture == 50
        assert specimen.lux_intensity == 1000

    def test_collection_state_defaults(self, sample_species, owner):
        specimen = Specimen.objects.create(
            owner=owner, species=sample_species, nickname='Collection default', acquired_at=date(2024, 1, 1),
        )
        assert specimen.is_active is True
        assert sample_species.is_collection_favorite is False

    def test_species_protected_on_delete(self, sample_specimen):
        """Cannot delete a species that has specimens (PROTECT)."""
        species = sample_specimen.species
        with pytest.raises(Exception):
            species.delete()

    def test_registration_fields_and_light_choices(self, sample_species, owner):
        specimen = Specimen(
            owner=owner,
            species=sample_species,
            nickname='',
            acquired_at=date(2024, 1, 1),
            initial_soil='Substrato drenante',
            initial_light=Specimen.Light.MEIA_SOMBRA,
        )
        specimen.full_clean()
        specimen.save()

        assert specimen.owner == owner
        assert specimen.initial_light == 'Meia sombra'
        assert specimen.display_name == 'Monstera deliciosa'

    def test_invalid_initial_light_is_rejected(self, sample_species, owner):
        specimen = Specimen(
            owner=owner,
            species=sample_species,
            nickname='Teste',
            acquired_at=date(2024, 1, 1),
            initial_soil='Solo',
            initial_light='Luz indireta',
        )

        with pytest.raises(ValidationError):
            specimen.full_clean()

    def test_visual_entry_belongs_to_specimen(self, sample_specimen):
        entry = VisualEntry.objects.create(
            specimen=sample_specimen,
            image='specimens/initial/test.jpg',
        )

        assert list(sample_specimen.visual_entries.all()) == [entry]

    def test_visual_capture_time_is_immutable(self, sample_specimen):
        captured = datetime(2024, 1, 1, tzinfo=timezone.utc)
        entry = VisualEntry.objects.create(specimen=sample_specimen, image='specimens/initial/test.jpg', captured_at=captured)
        entry.captured_at = datetime(2025, 1, 1, tzinfo=timezone.utc)
        entry.save()
        assert entry.refresh_from_db() is None
        assert entry.captured_at == captured


@pytest.mark.django_db
class TestCareLogModel:
    """Tests for the CareLog model."""

    def test_create_care_log(self, sample_specimen):
        """CareLog can be created for a specimen."""
        log = CareLog.objects.create(
            specimen=sample_specimen,
            type='watering',
            notes='150ml filtered water',
        )
        assert log.pk is not None
        assert log.type == 'watering'
        assert log.specimen == sample_specimen

    def test_care_log_cascade_on_specimen_delete(self, sample_species, owner):
        """CareLog is deleted when its specimen is deleted (CASCADE)."""
        specimen = Specimen.objects.create(
            owner=owner,
            species=sample_species,
            nickname='Temp Plant',
            acquired_at=date(2024, 1, 1),
        )
        CareLog.objects.create(specimen=specimen, type='fertilizing')
        assert CareLog.objects.count() == 1

        specimen.delete()
        assert CareLog.objects.count() == 0

    def test_care_log_types(self, sample_specimen):
        """All care log types can be created."""
        for care_type in ['watering', 'fertilizing', 'repotting', 'pruning', 'observation']:
            log = CareLog.objects.create(
                specimen=sample_specimen,
                type=care_type,
            )
            assert log.type == care_type

    def test_care_occurrence_time_is_immutable(self, sample_specimen):
        occurred = datetime(2024, 1, 1, tzinfo=timezone.utc)
        log = CareLog.objects.create(specimen=sample_specimen, type='watering', occurred_at=occurred)
        log.occurred_at = datetime(2025, 1, 1, tzinfo=timezone.utc)
        log.save()
        log.refresh_from_db()
        assert log.occurred_at == occurred

    def test_care_log_str(self, sample_specimen):
        """__str__ shows care type and specimen nickname."""
        log = CareLog.objects.create(
            specimen=sample_specimen,
            type='watering',
        )
        result = str(log)
        assert 'Watering' in result
        assert 'Monsterina' in result
