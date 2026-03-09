import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0001_initial'),
        ('birthdays', '0006_supportmessage_reaction_reply'),
    ]

    operations = [
        migrations.AddField(
            model_name='walletledgerentry',
            name='source_wishlist_contribution',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='ledger_entries',
                to='birthdays.wishlistcontribution',
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
                    ('PAYOUT', 'Payout'),
                    ('ADJUSTMENT', 'Adjustment'),
                ],
                max_length=30,
            ),
        ),
    ]
