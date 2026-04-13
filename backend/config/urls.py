"""
URL configuration for Fordham SwipeShare project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

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
