from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('offres', '0003_offre_departement'),
    ]

    operations = [
        migrations.AlterField(
            model_name='offredestage',
            name='domaine',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
