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
        'id', 'user_name', 'table', 'date', 'start_time', 'duration_display', 
        'guests_count', 'status_display', 'deposit_status', 'created_at'
    ]
    list_filter = [
        'status', 'date', 'table__zone', 'is_deposit_paid', 'source', 'created_at'
    ]
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name',
        'contact_name', 'contact_phone', 'contact_email'
    ]
    date_hierarchy = 'date'
    ordering = ['-start_time']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'table', 'date', 'start_time', 'end_time', 'guests_count', 'status')
        }),
        ('Контактная информация', {
            'fields': ('contact_name', 'contact_phone', 'contact_email'),
            'classes': ('collapse',)
        }),
        ('Дополнительная информация', {
            'fields': ('comment', 'special_requests', 'source'),
            'classes': ('collapse',)
        }),
        ('Финансовая информация', {
            'fields': ('deposit_amount', 'total_amount', 'is_deposit_paid'),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('confirmed_at', 'cancelled_at', 'cancellation_reason', 'notes'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    inlines = [BookingMenuItemInline, BookingHistoryInline]
    
    actions = ['confirm_bookings', 'cancel_bookings', 'complete_bookings']
    
    def user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_name.short_description = 'Пользователь'
    
    def duration_display(self, obj):
        hours = obj.duration // 60
        minutes = obj.duration % 60
        if hours > 0:
            return f"{hours}ч {minutes}м"
        return f"{minutes}м"
    duration_display.short_description = 'Продолжительность'
    
    def status_display(self, obj):
        colors = {
            'pending': 'orange',
            'confirmed': 'green',
            'active': 'blue',
            'completed': 'gray',
            'cancelled': 'red',
            'no_show': 'darkred'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_display.short_description = 'Статус'
    
    def deposit_status(self, obj):
        if obj.deposit_amount > 0:
            if obj.is_deposit_paid:
                return format_html('<span style="color: green;">✓ Оплачен</span>')
            else:
                return format_html('<span style="color: red;">✗ Не оплачен</span>')
        return '-'
    deposit_status.short_description = 'Депозит'
    
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
    
    list_display = ['booking', 'menu_item', 'quantity', 'price', 'total_price']
    list_filter = ['menu_item__category', 'booking__date']
    search_fields = ['booking__id', 'menu_item__name']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('booking', 'menu_item')

@admin.register(BookingHistory)
class BookingHistoryAdmin(admin.ModelAdmin):
    """Админ-панель для истории бронирований"""
    
    list_display = ['booking', 'action', 'old_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['action', 'old_status', 'new_status', 'created_at']
    search_fields = ['booking__id', 'comment']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('booking', 'changed_by')