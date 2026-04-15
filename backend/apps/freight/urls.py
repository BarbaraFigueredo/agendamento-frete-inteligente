from django.urls import path

from .views import FreightDetailView, FreightListCreateView, FreightStatusUpdateView, dashboard_view

urlpatterns = [
    path("", FreightListCreateView.as_view(), name="freight-list-create"),
    path("dashboard/", dashboard_view, name="freight-dashboard"),
    path("<uuid:id>/", FreightDetailView.as_view(), name="freight-detail"),
    path("<uuid:id>/status/", FreightStatusUpdateView.as_view(), name="freight-status-update"),
]
