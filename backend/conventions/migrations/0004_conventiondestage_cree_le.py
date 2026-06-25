from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('conventions', '0003_remove_conventiondestage_url_fichier_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='conventiondestage',
            name='cree_le',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, null=True),
            preserve_default=False,
        ),
    ]
