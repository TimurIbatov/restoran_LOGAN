from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render
from django.http import JsonResponse
from .models import Zone, Table, MenuCategory, MenuItem, RestaurantSettings

@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    """Админ-панель для зон"""
    
    list_display = ['name', 'slug', 'is_active', 'sort_order', 'tables_count']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['sort_order', 'name']
    
    def tables_count(self, obj):
        return obj.tables.count()
    tables_count.short_description = 'Количество столиков'

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    """Админ-панель для столиков"""
    
    list_display = ['name', 'zone', 'capacity', 'current_status', 'is_vip', 'is_active', 'price_per_hour', 'position_display']
    list_filter = ['zone', 'is_active', 'is_vip', 'capacity']
    search_fields = ['name', 'description']
    ordering = ['zone', 'name']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'zone', 'capacity', 'min_capacity', 'description', 'image')
        }),
        ('Ценообразование', {
            'fields': ('price_per_hour', 'deposit'),
            'classes': ('collapse',)
        }),
        ('Настройки', {
            'fields': ('is_active', 'is_vip', 'features'),
            'classes': ('collapse',)
        }),
        ('Позиция на плане', {
            'fields': ('position_x', 'position_y'),
            'description': 'Координаты столика на плане зала (в пикселях)'
        }),
    )
    
    def current_status(self, obj):
        status = obj.current_status
        colors = {
            'available': 'green',
            'occupied': 'red',
            'reserved': 'orange',
            'maintenance': 'gray'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(status, 'black'),
            status
        )
    current_status.short_description = 'Текущий статус'
    
    def position_display(self, obj):
        if obj.position_x and obj.position_y:
            return f"({obj.position_x}, {obj.position_y})"
        return "Не задано"
    position_display.short_description = 'Позиция (X, Y)'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('floor-plan/', self.admin_site.admin_view(self.floor_plan_view), name='table_floor_plan'),
        ]
        return custom_urls + urls
    
    def floor_plan_view(self, request):
        """Представление для интерактивного плана зала"""
        if request.method == 'POST':
            # Обновление позиций столиков
            table_id = request.POST.get('table_id')
            position_x = request.POST.get('position_x')
            position_y = request.POST.get('position_y')
            
            try:
                table = Table.objects.get(id=table_id)
                table.position_x = float(position_x)
                table.position_y = float(position_y)
                table.save()
                return JsonResponse({'success': True})
            except Table.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Table not found'})
        
        # GET запрос - отображение плана
        zones = Zone.objects.filter(is_active=True).prefetch_related('tables')
        tables = Table.objects.filter(is_active=True).select_related('zone')
        
        context = {
            'zones': zones,
            'tables': tables,
            'title': 'План зала',
            'opts': self.model._meta,
        }
        
        return render(request, 'admin/restaurant/floor_plan.html', context)

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    """Админ-панель для категорий меню"""
    
    list_display = ['name', 'slug', 'is_active', 'sort_order', 'items_count']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['sort_order', 'name']
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Количество блюд'

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    """Админ-панель для блюд меню"""
    
    list_display = ['name', 'category', 'price', 'is_available', 'is_special', 'cooking_time']
    list_filter = ['category', 'is_available', 'is_special', 'is_vegetarian', 'is_vegan', 'is_gluten_free']
    search_fields = ['name', 'description', 'ingredients']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['category', 'sort_order', 'name']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('category', 'name', 'slug', 'description', 'ingredients', 'image')
        }),
        ('Ценообразование и характеристики', {
            'fields': ('price', 'weight', 'calories', 'cooking_time')
        }),
        ('Настройки доступности', {
            'fields': ('is_available', 'is_special', 'sort_order')
        }),
        ('Диетические особенности', {
            'fields': ('is_vegetarian', 'is_vegan', 'is_gluten_free', 'allergens'),
            'classes': ('collapse',)
        }),
    )

@admin.register(RestaurantSettings)
class RestaurantSettingsAdmin(admin.ModelAdmin):
    """Админ-панель для настроек ресторана"""
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'address', 'phone', 'email', 'website')
        }),
        ('Время работы', {
            'fields': ('opening_time', 'closing_time')
        }),
        ('Настройки бронирования', {
            'fields': (
                'booking_advance_days', 'min_booking_duration', 'max_booking_duration',
                'default_booking_duration', 'booking_interval', 'cancellation_hours'
            )
        }),
        ('Социальные сети', {
            'fields': ('facebook_url', 'instagram_url', 'telegram_url'),
            'classes': ('collapse',)
        }),
        ('Изображения', {
            'fields': ('logo', 'hero_image'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Разрешаем создание только если нет записей
        return not RestaurantSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Запрещаем удаление
        return False

# Кастомизация админ-панели
admin.site.site_header = 'Ресторан "LOGAN" - Панель администратора'
admin.site.site_title = 'LOGAN Admin'
admin.site.index_title = 'Добро пожаловать в панель администратора'