from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_rename_events_birt_state_3d9546_idx_events_birt_state_cfb187_idx"),
    ]

    operations = [
        migrations.AddField(
            model_name="birthdayevent",
            name="expense_breakdown",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="birthdayevent",
            name="target_amount",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
