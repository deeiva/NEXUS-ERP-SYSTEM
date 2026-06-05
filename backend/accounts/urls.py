# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('users/admin/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('users/hr/', views.HRUserListView.as_view(), name='hr-user-list'),
    path('users/<str:username>/', views.UserDetailView.as_view(), name='user-detail'),
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
]
