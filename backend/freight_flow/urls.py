from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerUIView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/freight/", include("apps.freight.urls")),
    # Documentação
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerUIView.as_view(url_name="schema"), name="swagger-ui"),
]
