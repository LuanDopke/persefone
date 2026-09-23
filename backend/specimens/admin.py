from django.contrib import admin

from specimens.models import Specimen, CareLog, VisualEntry


@admin.register(Specimen)
class SpecimenAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'species', 'location_in_home', 'vitality_index', 'acquired_at')
    list_filter = ('species__family',)
    search_fields = ('nickname', 'species__scientific_name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'metrics_updated_at')


@admin.register(CareLog)
class CareLogAdmin(admin.ModelAdmin):
    list_display = ('specimen', 'type', 'occurred_at', 'created_at')
    list_filter = ('type',)
    readonly_fields = ('id', 'occurred_at', 'created_at')


@admin.register(VisualEntry)
class VisualEntryAdmin(admin.ModelAdmin):
    list_display = ('specimen', 'captured_at', 'created_at')
    readonly_fields = ('id', 'captured_at', 'created_at')
