from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
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

class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали, обновление и удаление столика"""
    
    queryset = Table.objects.select_related('zone')
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        """Обновление столика"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Обрабатываем FormData
            data = {}
            for key, value in request.data.items():
                if key == 'zone':
                    # Преобразуем zone в объект
                    try:
                        zone_id = int(value)
                        zone = Zone.objects.get(id=zone_id)
                        data[key] = zone
                    except (ValueError, Zone.DoesNotExist):
                        return Response(
                            {'error': f'Зона с ID {value} не найдена'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif key in ['capacity', 'min_capacity']:
                    try:
                        data[key] = int(value)
                    except ValueError:
                        return Response(
                            {'error': f'Некорректное значение для {key}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif key in ['price_per_hour', 'deposit']:
                    try:
                        data[key] = float(value)
                    except ValueError:
                        return Response(
                            {'error': f'Некорректное значение для {key}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif key in ['position_x', 'position_y']:
                    try:
                        data[key] = float(value)
                    except ValueError:
                        data[key] = 0.0
                elif key in ['is_active', 'is_vip']:
                    data[key] = value.lower() in ['true', '1', 'on']
                elif key == 'features':
                    # Обрабатываем features как JSON
                    if isinstance(value, str):
                        try:
                            import json
                            data[key] = json.loads(value)
                        except json.JSONDecodeError:
                            data[key] = []
                    else:
                        data[key] = value
                else:
                    data[key] = value
            
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка обновления столика: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали, обновление и удаление блюда"""
    
    queryset = MenuItem.objects.select_related('category')
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        """Обновление блюда"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Обрабатываем FormData
            data = {}
            for key, value in request.data.items():
                if key == 'category':
                    # Преобразуем category в объект
                    try:
                        category_id = int(value)
                        category = MenuCategory.objects.get(id=category_id)
                        data[key] = category
                    except (ValueError, MenuCategory.DoesNotExist):
                        return Response(
                            {'error': f'Категория с ID {value} не найдена'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif key in ['price']:
                    try:
                        data[key] = float(value)
                    except ValueError:
                        return Response(
                            {'error': f'Некорректное значение для {key}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif key in ['weight', 'calories', 'cooking_time', 'sort_order']:
                    try:
                        data[key] = int(value) if value else None
                    except ValueError:
                        return Response(
                            {'error': f'Некорректное значение для {key}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif key in ['is_available', 'is_special', 'is_vegetarian', 'is_vegan', 'is_gluten_free']:
                    data[key] = value.lower() in ['true', '1', 'on']
                elif key == 'allergens':
                    # Обрабатываем allergens как JSON
                    if isinstance(value, str):
                        try:
                            import json
                            data[key] = json.loads(value)
                        except json.JSONDecodeError:
                            data[key] = []
                    else:
                        data[key] = value
                else:
                    data[key] = value
            
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка обновления блюда: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
