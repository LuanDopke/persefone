from django.contrib import admin

from catalog.models import Species


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    list_display = ('scientific_name', 'common_name', 'family', 'genus', 'is_owned')
    list_filter = ('kingdom', 'family')
    search_fields = ('scientific_name', 'common_name', 'genus')
    readonly_fields = ('created_at', 'updated_at')
