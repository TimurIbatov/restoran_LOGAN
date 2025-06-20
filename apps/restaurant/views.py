from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from .models import Zone, Table, MenuCategory, MenuItem, RestaurantSettings
from .serializers import (
    ZoneSerializer, TableSerializer, MenuCategorySerializer, 
    MenuItemSerializer, RestaurantSettingsSerializer
)

class ZoneListView(generics.ListAPIView):
    """Список зон ресторана"""
    
    queryset = Zone.objects.filter(is_active=True)
    serializer_class = ZoneSerializer
    permission_classes = [permissions.AllowAny]

class TableListView(generics.ListAPIView):
    """Список столиков"""
    
    queryset = Table.objects.filter(is_active=True).select_related('zone')
    serializer_class = TableSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['zone', 'capacity', 'is_vip']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'capacity', 'price_per_hour']
    ordering = ['zone', 'name']

class MenuCategoryListView(generics.ListAPIView):
    """Список категорий меню"""
    
    queryset = MenuCategory.objects.filter(is_active=True)
    serializer_class = MenuCategorySerializer
    permission_classes = [permissions.AllowAny]

class MenuItemListView(generics.ListAPIView):
    """Список блюд меню"""
    
    queryset = MenuItem.objects.filter(is_available=True).select_related('category')
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'category', 'is_special', 'is_vegetarian', 'is_vegan', 'is_gluten_free'
    ]
    search_fields = ['name', 'description', 'ingredients']
    ordering_fields = ['name', 'price', 'cooking_time']
    ordering = ['category', 'sort_order', 'name']

class RestaurantSettingsView(generics.RetrieveAPIView):
    """Настройки ресторана"""
    
    serializer_class = RestaurantSettingsSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        settings, created = RestaurantSettings.objects.get_or_create(
            defaults={
                'name': 'Ресторан "LOGAN"',
                'address': 'ул. Рудаки, 1',
                'phone': '+998 (93) 668-29-24',
                'email': 'info@restaurant-logan.com'
            }
        )
        return settings

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_stats(request):
    """Статистика для админ-панели"""
    
    today = timezone.now().date()
    month_start = today.replace(day=1)
    
    from apps.bookings.models import Booking
    from apps.accounts.models import User
    
    stats = {
        'today_bookings': Booking.objects.filter(date=today).count(),
        'total_users': User.objects.count(),
        'active_tables': Table.objects.filter(is_active=True).count(),
        'monthly_revenue': Booking.objects.filter(
            date__gte=month_start,
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or 0,
        'pending_bookings': Booking.objects.filter(status='pending').count(),
        'confirmed_bookings': Booking.objects.filter(status='confirmed').count(),
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def floor_plan(request):
    """План зала с расположением столиков"""
    
    zones = Zone.objects.filter(is_active=True).prefetch_related('tables')
    
    floor_plan_data = {
        'zones': [],
        'tables': []
    }
    
    for zone in zones:
        zone_data = {
            'id': zone.id,
            'name': zone.name,
            'slug': zone.slug,
            'description': zone.description,
            'image': zone.image.url if zone.image else None,
        }
        floor_plan_data['zones'].append(zone_data)
        
        for table in zone.tables.filter(is_active=True):
            table_data = {
                'id': table.id,
                'name': table.name,
                'zone_id': zone.id,
                'zone_name': zone.name,
                'capacity': table.capacity,
                'position_x': table.position_x,
                'position_y': table.position_y,
                'status': table.current_status,
                'is_vip': table.is_vip,
                'features': table.features,
            }
            floor_plan_data['tables'].append(table_data)
    
    return Response(floor_plan_data)