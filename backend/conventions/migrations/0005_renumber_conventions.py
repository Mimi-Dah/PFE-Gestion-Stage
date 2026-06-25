from django.db import migrations


def renumber_conventions(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        # Drop unique constraint so all rows can be updated without transient conflicts
        cursor.execute("ALTER TABLE conventions_conventiondestage DROP INDEX numero_convention")
        cursor.execute("""
            UPDATE conventions_conventiondestage
            SET numero_convention = CONCAT(
                'Conv-',
                COALESCE(YEAR(cree_le), 2026),
                '-',
                LPAD(id_convention, 3, '0')
            )
        """)
        cursor.execute(
            "ALTER TABLE conventions_conventiondestage ADD UNIQUE (numero_convention)"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('conventions', '0004_conventiondestage_cree_le'),
    ]

    operations = [
        migrations.RunPython(renumber_conventions, migrations.RunPython.noop),
    ]
