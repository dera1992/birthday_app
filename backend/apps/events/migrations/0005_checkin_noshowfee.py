from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0004_curatedpack_birthdayevent_pack"),
    ]

    operations = [
        migrations.AddField(
            model_name="birthdayevent",
            name="no_show_fee_percent",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="eventattendee",
            name="checked_in_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
