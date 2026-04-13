from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('verify-email/', views.EmailVerificationView.as_view(), name='verify-email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Profile
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('whats-new/', views.whats_new, name='whats-new'),
    path('<int:pk>/', views.UserProfileView.as_view(), name='user-profile'),

    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/toggle-active/', views.AdminUserToggleActiveView.as_view(), name='admin-user-toggle'),
]
