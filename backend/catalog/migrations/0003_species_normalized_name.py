from django.db import migrations, models


def normalize_existing_species(apps, schema_editor):
    Species = apps.get_model('catalog', 'Species')
    Specimen = apps.get_model('specimens', 'Specimen')
    canonical = {}

    for species in Species.objects.order_by('pk'):
        display_name = ' '.join((species.scientific_name or '').split())
        normalized_name = display_name.casefold()
        if normalized_name in canonical:
            target = canonical[normalized_name]
            Specimen.objects.filter(species_id=species.pk).update(species_id=target.pk)
            if species.is_collection_favorite and not target.is_collection_favorite:
                target.is_collection_favorite = True
                target.save(update_fields=['is_collection_favorite'])
            species.delete()
            continue
        species.scientific_name = display_name
        species.normalized_name = normalized_name
        species.save(update_fields=['scientific_name', 'normalized_name'])
        canonical[normalized_name] = species


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0002_species_collection_favorite'),
        ('specimens', '0002_collection_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='species',
            name='normalized_name',
            field=models.CharField(blank=True, db_index=True, editable=False, max_length=255, null=True),
        ),
        migrations.RunPython(normalize_existing_species, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='species',
            name='normalized_name',
            field=models.CharField(db_index=True, editable=False, max_length=255, unique=True),
        ),
    ]
