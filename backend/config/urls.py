"""
URL configuration for Fordham SwipeShare project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger/ReDoc API Documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Fordham SwipeShare API",
        default_version='v1',
        description="API documentation for Fordham SwipeShare - Meal Swipe Exchange Platform",
        terms_of_service="https://www.fordham.edu/",
        contact=openapi.Contact(email="admin@fordham.edu"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),

    # API Endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/swipes/', include('apps.swipes.urls')),
    path('api/forum/', include('apps.forum.urls')),
    path('api/moderation/', include('apps.moderation.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/upload/', include('apps.uploads.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
