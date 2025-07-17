from django.urls import path
from . import views

app_name = 'restaurant'

urlpatterns = [
    path('zones/', views.ZoneListView.as_view(), name='zone-list'),
    path('tables/', views.TableListView.as_view(), name='table-list'),
    path('menu/categories/', views.MenuCategoryListView.as_view(), name='menu-category-list'),
    path('menu/items/', views.MenuItemListView.as_view(), name='menu-item-list'),
    path('settings/', views.RestaurantSettingsView.as_view(), name='restaurant-settings'),
    path('floor-plan/', views.floor_plan, name='floor-plan'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
]