"""Unit tests for catalog models (Species)."""

import pytest
from django.db import IntegrityError
from django.contrib.auth.models import User
from catalog.models import Species


@pytest.mark.django_db
class TestSpeciesModel:
    """Tests for the Species model and computed is_owned property."""

    def test_create_species(self):
        """Species can be created with required fields."""
        species = Species.objects.create(
            scientific_name='Monstera deliciosa',
            common_name='Swiss Cheese Plant',
            family='Araceae',
            genus='Monstera',
        )
        assert species.pk is not None
        assert species.scientific_name == 'Monstera deliciosa'
        assert species.kingdom == 'Plantae'

    def test_is_owned_false_when_no_specimens(self):
        """is_owned returns False when no specimens exist."""
        species = Species.objects.create(
            scientific_name='Ficus lyrata',
            family='Moraceae',
        )
        assert species.is_owned is False

    def test_is_owned_true_when_specimen_exists(self):
        """is_owned returns True when at least one specimen exists."""
        from specimens.models import Specimen
        from datetime import date

        species = Species.objects.create(
            scientific_name='Epipremnum aureum',
            family='Araceae',
        )
        owner = User.objects.create_user(username='catalog-owner-1')
        Specimen.objects.create(
            owner=owner,
            species=species,
            nickname='Golden Pothos',
            acquired_at=date(2024, 1, 15),
        )
        assert species.is_owned is True

    def test_is_owned_reverts_when_all_specimens_deleted(self):
        """is_owned reverts to False when all specimens are removed."""
        from specimens.models import Specimen
        from datetime import date

        species = Species.objects.create(
            scientific_name='Calathea orbifolia',
            family='Marantaceae',
        )
        owner = User.objects.create_user(username='catalog-owner-2')
        specimen = Specimen.objects.create(
            owner=owner,
            species=species,
            nickname='Prayer Plant',
            acquired_at=date(2024, 3, 10),
        )
        assert species.is_owned is True

        specimen.delete()
        assert species.is_owned is False

    def test_gbif_key_unique(self):
        """gbif_key enforces uniqueness."""
        Species.objects.create(
            scientific_name='Test Plant',
            gbif_key=12345,
        )
        with pytest.raises(Exception):
            Species.objects.create(
                scientific_name='Another Plant',
                gbif_key=12345,
            )

    def test_str_representation(self):
        """__str__ returns the scientific name."""
        species = Species.objects.create(scientific_name='Zamioculcas zamiifolia')
        assert str(species) == 'Zamioculcas zamiifolia'

    def test_normalized_name_collapses_spaces_and_case(self):
        species = Species.objects.create(scientific_name='  Begonia   sp.  ')

        assert species.scientific_name == 'Begonia sp.'
        assert species.normalized_name == 'begonia sp.'

    def test_normalized_name_is_unique(self):
        Species.objects.create(scientific_name='Begonia sp.')

        with pytest.raises(IntegrityError):
            Species.objects.create(scientific_name='  BEGONIA   SP. ')
