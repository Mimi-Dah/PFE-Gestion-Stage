from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('offres', '0002_favori'),
        ('etablissements', '0003_alter_departement_id_alter_etablissement_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='offredestage',
            name='departement',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='offres',
                to='etablissements.departement',
            ),
        ),
    ]
