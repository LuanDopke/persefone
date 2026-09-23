from django.contrib import admin
from .models import AccessRequest, AccountProfile

admin.site.register(AccountProfile)
admin.site.register(AccessRequest)
