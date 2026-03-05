from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0003_venuepartner_latitude_longitude'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='VenueRating',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.PositiveSmallIntegerField()),
                ('review', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('venue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ratings', to='venues.venuepartner')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='venue_ratings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'venue')},
            },
        ),
    ]
