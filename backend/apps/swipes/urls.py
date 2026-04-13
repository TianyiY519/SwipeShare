from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'swipes'

router = DefaultRouter()
router.register(r'listings', views.SwipeListingViewSet, basename='swipelisting')
router.register(r'matches', views.SwipeMatchViewSet, basename='swipematch')

urlpatterns = [
    path('', include(router.urls)),
]
