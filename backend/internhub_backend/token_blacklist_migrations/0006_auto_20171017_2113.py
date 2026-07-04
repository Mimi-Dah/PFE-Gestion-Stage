from django.db import migrations

# ─────────────────────────────────────────────────────────────────────────
# Correctif local : cette migration est une copie de
# rest_framework_simplejwt.token_blacklist.migrations.0006_auto_20171017_2113,
# chargée à la place de l'originale via settings.MIGRATION_MODULES.
#
# L'originale utilise `migrations.RenameField`, ce qui génère un
# `ALTER TABLE ... RENAME COLUMN ...` — syntaxe non supportée par MariaDB
# < 10.5.2 (le serveur de ce projet tourne en 10.4.32). On obtient le même
# résultat avec `CHANGE COLUMN`, supporté par toutes les versions de
# MySQL/MariaDB, tout en gardant `RenameField` pour l'état des migrations
# Django (SeparateDatabaseAndState : le SQL exécuté et l'état suivi par
# Django peuvent différer).
# ─────────────────────────────────────────────────────────────────────────


def rename_jti_hex_forward(apps, schema_editor):
    table = "token_blacklist_outstandingtoken"
    if schema_editor.connection.vendor == "mysql":
        schema_editor.execute(f"ALTER TABLE {table} CHANGE COLUMN jti_hex jti varchar(255) NOT NULL")
    else:
        # Postgres/SQLite modernes supportent nativement RENAME COLUMN.
        schema_editor.execute(f"ALTER TABLE {table} RENAME COLUMN jti_hex TO jti")


def rename_jti_hex_backward(apps, schema_editor):
    table = "token_blacklist_outstandingtoken"
    if schema_editor.connection.vendor == "mysql":
        schema_editor.execute(f"ALTER TABLE {table} CHANGE COLUMN jti jti_hex varchar(255) NOT NULL")
    else:
        schema_editor.execute(f"ALTER TABLE {table} RENAME COLUMN jti TO jti_hex")


class Migration(migrations.Migration):
    dependencies = [
        ("token_blacklist", "0005_remove_outstandingtoken_jti"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RenameField(
                    model_name="outstandingtoken",
                    old_name="jti_hex",
                    new_name="jti",
                ),
            ],
            database_operations=[
                migrations.RunPython(rename_jti_hex_forward, rename_jti_hex_backward),
            ],
        ),
    ]
