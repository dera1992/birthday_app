from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("birthdays", "0003_birthdayprofile_social_links"),
    ]

    operations = [
        migrations.AddField(
            model_name="birthdayprofile",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="birthdayprofile",
            name="gender",
            field=models.CharField(blank=True, choices=[("MALE", "Male"), ("FEMALE", "Female"), ("OTHER", "Other"), ("PREFER_NOT_TO_SAY", "Prefer not to say")], max_length=32),
        ),
        migrations.AddField(
            model_name="birthdayprofile",
            name="marital_status",
            field=models.CharField(blank=True, choices=[("SINGLE", "Single"), ("IN_A_RELATIONSHIP", "In a relationship"), ("MARRIED", "Married"), ("DIVORCED", "Divorced"), ("WIDOWED", "Widowed"), ("PREFER_NOT_TO_SAY", "Prefer not to say")], max_length=32),
        ),
        migrations.AddField(
            model_name="birthdayprofile",
            name="occupation",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
