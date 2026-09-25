from django.urls import path

from catalog import key_views


urlpatterns = [
    path('', key_views.keys, name='identification-key-list'),
    path('discover/', key_views.discover_external, name='identification-key-discover'),
    path('imports/', key_views.import_external, name='identification-key-import'),
    path('<uuid:key_id>/', key_views.key_detail, name='identification-key-detail'),
    path('<uuid:key_id>/publish/', key_views.publish_key, name='identification-key-publish'),
    path('<uuid:key_id>/archive/', key_views.archive_key, name='identification-key-archive'),
    path('<uuid:key_id>/suggestions/', key_views.suggestions, name='identification-key-suggestions'),
    path('<uuid:key_id>/suggestions/<uuid:suggestion_id>/decision/', key_views.decide_suggestion, name='identification-key-suggestion-decision'),
    path('<uuid:key_id>/reports/', key_views.report_key, name='identification-key-report'),
]
