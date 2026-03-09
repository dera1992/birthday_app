from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='eventpayment',
            name='platform_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='eventpayment',
            name='celebrant_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
