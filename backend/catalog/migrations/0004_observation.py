import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('catalog', '0003_species_normalized_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Observation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('image', models.ImageField(blank=True, upload_to='observations/%Y/%m/%d')),
                ('observed_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='species_observations', to=settings.AUTH_USER_MODEL)),
                ('species', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='observations', to='catalog.species')),
            ],
            options={'ordering': ['-observed_at', '-created_at', '-id']},
        ),
    ]
