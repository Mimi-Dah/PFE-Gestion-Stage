from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('candidatures', '0002_alter_candidature_statut'),
    ]

    operations = [
        migrations.AlterField(
            model_name='candidature',
            name='statut',
            field=models.CharField(
                choices=[
                    ('En_attente', 'En attente'),
                    ('Acceptée', 'Acceptée'),
                    ('Refusée', 'Refusée'),
                    ('Convention_en_cours', 'Convention en cours'),
                    ('Stage_actif', 'Stage actif (En cours)'),
                    ('Terminé', 'Stage terminé'),
                    ('Retirée', 'Retirée'),
                    ('Abandonné', 'Stage abandonné'),
                ],
                default='En_attente',
                max_length=20,
            ),
        ),
    ]
