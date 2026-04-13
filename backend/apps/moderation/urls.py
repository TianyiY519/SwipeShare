from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'moderation'

router = DefaultRouter()
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'actions', views.ContentActionViewSet, basename='contentaction')

urlpatterns = [
    path('', include(router.urls)),
]
