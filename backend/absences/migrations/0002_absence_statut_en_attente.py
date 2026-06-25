from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('absences', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='absence',
            name='statut',
            field=models.CharField(
                choices=[
                    ('Signaler',               'Signalée'),
                    ('En_attente_approbation', "En attente d'approbation"),
                    ('Justifiée',              'Justifiée'),
                    ('Non_justifiée',          'Non justifiée'),
                ],
                default='Signaler',
                max_length=25,
            ),
        ),
    ]
