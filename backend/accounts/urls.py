from django.urls import path
from .views import AccessConfirmationView, AccessRequestView, LogoutView

urlpatterns = [
    path('access-requests/', AccessRequestView.as_view()),
    path('access-confirmations/', AccessConfirmationView.as_view()),
    path('logout/', LogoutView.as_view()),
]
