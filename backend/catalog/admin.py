from django.contrib import admin

from catalog.models import Observation, Species


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    list_display = ('scientific_name', 'common_name', 'family', 'genus', 'is_owned')
    list_filter = ('kingdom', 'family')
    search_fields = ('scientific_name', 'common_name', 'genus')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ('species', 'owner', 'observed_at')
    list_filter = ('species__family', 'species__genus')
    search_fields = ('species__scientific_name', 'owner__username')
    readonly_fields = ('created_at',)
