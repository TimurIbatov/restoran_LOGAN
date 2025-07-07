from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Booking, BookingMenuItem, BookingHistory

class BookingMenuItemInline(admin.TabularInline):
    """Инлайн для предзаказанных блюд"""
    model = BookingMenuItem
    extra = 0
    readonly_fields = ['total_price']

class BookingHistoryInline(admin.TabularInline):
    """Инлайн для истории бронирования"""
    model = BookingHistory
    extra = 0
    readonly_fields = ['created_at']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Админ-панель для бронирований"""
    
    list_display = [
        'id', 'user', 'table', 'date', 'start_time', 'end_time', 
        'guests_count', 'status', 'table_price', 'total_amount', 'created_at'
    ]
    list_filter = ['status', 'date', 'created_at', 'table__zone']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'table__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    ordering = ['-start_time']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'table', 'date', 'start_time', 'end_time', 'guests_count')
        }),
        ('Статус и цены', {
            'fields': ('status', 'table_price', 'total_amount')
        }),
        ('Дополнительная информация', {
            'fields': ('special_requests', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [BookingMenuItemInline, BookingHistoryInline]
    
    actions = ['confirm_bookings', 'cancel_bookings', 'complete_bookings']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'table', 'table__zone')
    
    def confirm_bookings(self, request, queryset):
        count = 0
        for booking in queryset.filter(status='pending'):
            booking.confirm()
            count += 1
        self.message_user(request, f'Подтверждено {count} бронирований')
    confirm_bookings.short_description = 'Подтвердить выбранные бронирования'
    
    def cancel_bookings(self, request, queryset):
        count = 0
        for booking in queryset.exclude(status__in=['cancelled', 'completed']):
            if booking.can_be_cancelled:
                booking.cancel('Отменено администратором')
                count += 1
        self.message_user(request, f'Отменено {count} бронирований')
    cancel_bookings.short_description = 'Отменить выбранные бронирования'
    
    def complete_bookings(self, request, queryset):
        count = 0
        for booking in queryset.filter(status__in=['confirmed', 'active']):
            booking.complete()
            count += 1
        self.message_user(request, f'Завершено {count} бронирований')
    complete_bookings.short_description = 'Завершить выбранные бронирования'

@admin.register(BookingMenuItem)
class BookingMenuItemAdmin(admin.ModelAdmin):
    """Админ-панель для предзаказанных блюд"""
    
    list_display = ['booking', 'menu_item', 'quantity', 'price_per_item']
    list_filter = ['booking__date', 'menu_item__category']
    search_fields = ['booking__user__email', 'menu_item__name']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('booking', 'menu_item', 'booking__user')

@admin.register(BookingHistory)
class BookingHistoryAdmin(admin.ModelAdmin):
    """Админ-панель для истории бронирований"""
    
    list_display = ['booking', 'action', 'old_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['action', 'old_status', 'new_status', 'created_at']
    search_fields = ['booking__id', 'comment']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('booking', 'changed_by')
