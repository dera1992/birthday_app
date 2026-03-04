from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("birthdays", "0004_birthdayprofile_gender_date_of_birth_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="birthdayprofile",
            name="profile_image",
            field=models.ImageField(blank=True, null=True, upload_to="profile-images/"),
        ),
    ]
