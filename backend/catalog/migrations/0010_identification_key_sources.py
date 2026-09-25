from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0009_key_run_pending_note'),
    ]

    operations = [
        migrations.AddField(
            model_name='identificationkey',
            name='source_metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='identificationkeyversion',
            name='source_metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
