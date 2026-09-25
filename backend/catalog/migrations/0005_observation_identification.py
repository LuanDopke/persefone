import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


def migrate_observations(apps, schema_editor):
    Observation = apps.get_model('catalog', 'Observation')
    Evidence = apps.get_model('catalog', 'ObservationEvidence')
    Hypothesis = apps.get_model('catalog', 'ObservationHypothesis')
    Event = apps.get_model('catalog', 'ObservationIdentificationEvent')
    for observation in Observation.objects.select_related('species').iterator():
        observation.title = observation.species.scientific_name
        hypothesis = Hypothesis.objects.create(
            observation=observation,
            name=observation.species.scientific_name,
            rank='species',
            source='catalog',
            species=observation.species,
            gbif_key=observation.species.gbif_key,
        )
        Hypothesis.objects.filter(pk=hypothesis.pk).update(created_at=observation.created_at)
        Event.objects.create(observation=observation, hypothesis=hypothesis, action='confirm')
        Event.objects.filter(observation=observation).update(created_at=observation.created_at)
        observation.confirmed_hypothesis = hypothesis
        observation.save(update_fields=['title', 'confirmed_hypothesis'])
        if observation.image:
            evidence = Evidence.objects.create(
                observation=observation,
                image=observation.image.name,
                observed_at=observation.observed_at,
            )
            Evidence.objects.filter(pk=evidence.pk).update(created_at=observation.created_at)


class Migration(migrations.Migration):
    dependencies = [('catalog', '0004_observation')]

    operations = [
        migrations.AddField(model_name='observation', name='title', field=models.CharField(blank=True, max_length=160)),
        migrations.AlterField(model_name='observation', name='species', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='observations', to='catalog.species')),
        migrations.AddField(model_name='observation', name='latitude', field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name='observation', name='longitude', field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name='observation', name='updated_at', field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now), preserve_default=False),
        migrations.CreateModel(name='ObservationEvidence', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('image', models.ImageField(blank=True, upload_to='observations/%Y/%m/%d')),
            ('notes', models.TextField(blank=True)),
            ('subject', models.CharField(choices=[('original', 'Planta principal'), ('comparison', 'Outro indivíduo')], default='original', max_length=12)),
            ('observed_at', models.DateTimeField(default=django.utils.timezone.now)),
            ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
            ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('observation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evidence', to='catalog.observation')),
        ], options={'ordering': ['-observed_at', '-created_at']}),
        migrations.CreateModel(name='ObservationHypothesis', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('name', models.CharField(max_length=255)),
            ('rank', models.CharField(choices=[('genus', 'Gênero'), ('species', 'Espécie'), ('unknown', 'Não definido')], default='unknown', max_length=10)),
            ('source', models.CharField(choices=[('catalog', 'Catálogo'), ('manual', 'Texto livre')], max_length=8)),
            ('gbif_key', models.IntegerField(blank=True, null=True)),
            ('notes', models.TextField(blank=True)),
            ('discarded_at', models.DateTimeField(blank=True, null=True)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('observation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hypotheses', to='catalog.observation')),
            ('species', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='catalog.species')),
        ], options={'ordering': ['-created_at']}),
        migrations.AddField(model_name='observation', name='confirmed_hypothesis', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='catalog.observationhypothesis')),
        migrations.CreateModel(name='ObservationIdentificationEvent', fields=[
            ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ('action', models.CharField(choices=[('confirm', 'Confirmação'), ('reopen', 'Reabertura')], max_length=8)),
            ('notes', models.TextField(blank=True)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('hypothesis', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='catalog.observationhypothesis')),
            ('observation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='identification_events', to='catalog.observation')),
        ], options={'ordering': ['-created_at']}),
        migrations.RunPython(migrate_observations, migrations.RunPython.noop),
        migrations.RemoveField(model_name='observation', name='image'),
        migrations.AlterField(model_name='observation', name='title', field=models.CharField(max_length=160)),
    ]
