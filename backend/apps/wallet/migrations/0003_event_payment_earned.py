import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0002_contribution_earned'),
        ('payments', '0002_eventpayment_platform_amounts'),
    ]

    operations = [
        migrations.AddField(
            model_name='walletledgerentry',
            name='source_event_payment',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='ledger_entries',
                to='payments.eventpayment',
            ),
        ),
        migrations.AlterField(
            model_name='walletledgerentry',
            name='type',
            field=models.CharField(
                choices=[
                    ('GIFT_EARNED', 'Gift Earned'),
                    ('GIFT_REFUND_REVERSAL', 'Gift Refund Reversal'),
                    ('CONTRIBUTION_EARNED', 'Contribution Earned'),
                    ('EVENT_REGISTRATION_EARNED', 'Event Registration Earned'),
                    ('PAYOUT', 'Payout'),
                    ('ADJUSTMENT', 'Adjustment'),
                ],
                max_length=30,
            ),
        ),
    ]
