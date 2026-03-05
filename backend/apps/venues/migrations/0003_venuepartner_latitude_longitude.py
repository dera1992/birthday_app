from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('venues', '0002_venuepartner_is_sponsored_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='venuepartner',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='venuepartner',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
