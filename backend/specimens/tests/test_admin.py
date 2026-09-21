from specimens.admin import CareLogAdmin, SpecimenAdmin, VisualEntryAdmin


def test_admin_exposes_monitoring_fields_as_read_only():
    assert 'occurred_at' in CareLogAdmin.readonly_fields
    assert 'created_at' in CareLogAdmin.readonly_fields
    assert 'captured_at' in VisualEntryAdmin.readonly_fields
    assert 'metrics_updated_at' in SpecimenAdmin.readonly_fields
