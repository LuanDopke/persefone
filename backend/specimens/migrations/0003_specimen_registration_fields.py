import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


def assign_existing_owners(apps, schema_editor):
    Specimen = apps.get_model('specimens', 'Specimen')
    if not Specimen.objects.filter(owner__isnull=True).exists():
        return

    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))
    owner = User.objects.order_by('pk').first()
    if owner is None:
        owner = User.objects.create(username='legacy-specimens')
        owner.set_unusable_password()
        owner.save(update_fields=['password'])
    Specimen.objects.filter(owner__isnull=True).update(owner=owner)


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('catalog', '0003_species_normalized_name'),
        ('specimens', '0002_collection_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='specimen',
            name='owner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='specimens', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='specimen',
            name='initial_soil',
            field=models.TextField(default='', help_text='Initial free-text soil description'),
        ),
        migrations.AddField(
            model_name='specimen',
            name='initial_light',
            field=models.CharField(choices=[('Sombra', 'Sombra'), ('Meia sombra', 'Meia sombra'), ('Sol pleno', 'Sol pleno')], default='Meia sombra', help_text='Initial light condition', max_length=20),
        ),
        migrations.AlterField(
            model_name='specimen',
            name='nickname',
            field=models.CharField(blank=True, default='', help_text='Personal name for the specimen', max_length=100),
        ),
        migrations.RunPython(assign_existing_owners, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='specimen',
            name='owner',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='specimens', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='VisualEntry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('image', models.ImageField(upload_to='specimens/initial/%Y/%m/%d')),
                ('captured_at', models.DateTimeField(auto_now_add=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('specimen', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visual_entries', to='specimens.specimen')),
            ],
            options={'ordering': ['captured_at', 'created_at']},
        ),
    ]
