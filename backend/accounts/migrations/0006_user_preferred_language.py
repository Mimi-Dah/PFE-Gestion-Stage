from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_etudiant_date_de_naissance_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preferred_language',
            field=models.CharField(
                choices=[('fr', 'Français'), ('ar', 'العربية')],
                default='fr',
                max_length=5,
                verbose_name='langue préférée',
            ),
        ),
    ]
