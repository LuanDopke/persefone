from django.urls import reverse


def test_visual_entry_routes_are_registered():
    assert reverse('visualentry-list') == '/api/visual-entries/'
