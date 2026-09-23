from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('specimens', '0004_specimen_monitoring'),
    ]

    operations = [
        migrations.AddField(
            model_name='visualentry',
            name='care_log',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='visual_entry',
                to='specimens.carelog',
            ),
        ),
    ]
