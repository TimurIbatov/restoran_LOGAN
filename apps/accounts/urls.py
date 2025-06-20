from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('current/', views.current_user, name='current-user'),
    path('change-password/', views.change_password, name='change-password'),
]