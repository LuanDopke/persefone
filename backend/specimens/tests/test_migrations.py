from django.db.migrations.loader import MigrationLoader


def test_monitoring_migration_is_latest_and_depends_on_registration_fields(db):
    loader = MigrationLoader(None, ignore_no_migrations=True)
    migration = loader.get_migration('specimens', '0004_specimen_monitoring')
    assert ('specimens', '0003_specimen_registration_fields') in migration.dependencies
    assert loader.graph.leaf_nodes('specimens') == [('specimens', '0004_specimen_monitoring')]
