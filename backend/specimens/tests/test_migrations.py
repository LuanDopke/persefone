from django.db.migrations.loader import MigrationLoader


def test_visual_care_link_migration_is_latest_and_depends_on_monitoring(db):
    loader = MigrationLoader(None, ignore_no_migrations=True)
    migration = loader.get_migration('specimens', '0005_visualentry_care_log')
    assert ('specimens', '0004_specimen_monitoring') in migration.dependencies
    assert loader.graph.leaf_nodes('specimens') == [('specimens', '0005_visualentry_care_log')]
