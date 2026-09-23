from django.db import migrations, models
from django.utils import timezone


def backfill_monitoring_timestamps(apps, schema_editor):
    Specimen = apps.get_model('specimens', 'Specimen')
    CareLog = apps.get_model('specimens', 'CareLog')
    Specimen.objects.update(metrics_updated_at=models.F('updated_at'))
    for log in CareLog.objects.all().only('pk', 'occurred_at'):
        CareLog.objects.filter(pk=log.pk).update(created_at=log.occurred_at)


class Migration(migrations.Migration):
    dependencies = [('specimens', '0003_specimen_registration_fields')]

    operations = [
        migrations.AddField(
            model_name='specimen',
            name='metrics_updated_at',
            field=models.DateTimeField(default=timezone.now, help_text='Date and time when current vital metrics were last updated'),
        ),
        migrations.RenameField(
            model_name='carelog',
            old_name='timestamp',
            new_name='occurred_at',
        ),
        migrations.AlterField(
            model_name='carelog',
            name='occurred_at',
            field=models.DateTimeField(default=timezone.now, help_text='Date and time when care was performed'),
        ),
        migrations.AddField(
            model_name='carelog',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='carelog',
            name='type',
            field=models.CharField(choices=[('watering', 'Watering'), ('fertilizing', 'Fertilizing'), ('repotting', 'Repotting'), ('pruning', 'Pruning'), ('observation', 'Observation')], help_text='Type of care activity', max_length=50),
        ),
        migrations.AlterField(
            model_name='visualentry',
            name='captured_at',
            field=models.DateTimeField(default=timezone.now),
        ),
        migrations.AddField(
            model_name='visualentry',
            name='notes',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterModelOptions(
            name='carelog',
            options={'ordering': ['-occurred_at', '-created_at', '-id']},
        ),
        migrations.AlterModelOptions(
            name='visualentry',
            options={'ordering': ['-captured_at', '-created_at', '-id']},
        ),
        migrations.RunPython(backfill_monitoring_timestamps, migrations.RunPython.noop),
    ]
