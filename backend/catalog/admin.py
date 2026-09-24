from django.contrib import admin

from catalog.models import (Observation, ObservationEvidence, ObservationHypothesis, ObservationIdentificationEvent,
    ObservationRevision, IdentificationKey, IdentificationKeyVersion, IdentificationKeySuggestion,
    IdentificationKeyReport, IdentificationKeyRun, IdentificationKeyRunRevision, Species)


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    list_display = ('scientific_name', 'common_name', 'family', 'genus', 'is_owned')
    list_filter = ('kingdom', 'family')
    search_fields = ('scientific_name', 'common_name', 'genus')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ('title', 'species', 'owner', 'observed_at')
    list_filter = ('species__family', 'species__genus')
    search_fields = ('title', 'species__scientific_name', 'owner__username')
    readonly_fields = ('created_at',)


@admin.register(ObservationEvidence)
class ObservationEvidenceAdmin(admin.ModelAdmin):
    list_display = ('observation', 'subject', 'observed_at')
    search_fields = ('observation__title',)


@admin.register(ObservationHypothesis)
class ObservationHypothesisAdmin(admin.ModelAdmin):
    list_display = ('name', 'rank', 'source', 'observation', 'discarded_at')
    search_fields = ('name', 'observation__title')


@admin.register(ObservationIdentificationEvent)
class ObservationIdentificationEventAdmin(admin.ModelAdmin):
    list_display = ('observation', 'action', 'hypothesis', 'created_at')
    search_fields = ('observation__title',)


@admin.register(ObservationRevision)
class ObservationRevisionAdmin(admin.ModelAdmin):
    list_display = ('observation', 'evidence', 'hypothesis', 'created_at')
    search_fields = ('observation__title',)


@admin.register(IdentificationKey)
class IdentificationKeyAdmin(admin.ModelAdmin):
    list_display = ('title', 'scope_name', 'author', 'published_version', 'archived_at')
    search_fields = ('title', 'scope_name', 'author__username')
    list_filter = ('scope_rank', 'archived_at')


@admin.register(IdentificationKeyVersion)
class IdentificationKeyVersionAdmin(admin.ModelAdmin):
    list_display = ('key', 'number', 'published_at')
    readonly_fields = ('key', 'number', 'graph', 'title', 'coverage', 'source', 'source_metadata', 'published_at')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
admin.site.register(IdentificationKeySuggestion)
@admin.register(IdentificationKeyReport)
class IdentificationKeyReportAdmin(admin.ModelAdmin):
    list_display = ('key', 'author', 'created_at')
    search_fields = ('key__title', 'author__username', 'reason')
    actions = ['archive_reported_keys']

    @admin.action(description='Arquivar chaves relatadas')
    def archive_reported_keys(self, request, queryset):
        from django.utils import timezone
        IdentificationKey.objects.filter(pk__in=queryset.values('key_id')).update(archived_at=timezone.now())
admin.site.register(IdentificationKeyRun)
admin.site.register(IdentificationKeyRunRevision)
