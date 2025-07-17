from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Админ-панель для пользователей"""
    
    list_display = ['email', 'full_name', 'role', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'username', 'phone']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Личная информация'), {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'birth_date', 'address', 'avatar')
        }),
        (_('Права доступа'), {
            'fields': ('role', 'is_active', 'is_verified', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Важные даты'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Админ-панель для профилей пользователей"""
    
    list_display = ['user', 'loyalty_points', 'total_visits', 'total_spent', 'favorite_table']
    list_filter = ['total_visits', 'loyalty_points']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['total_visits', 'total_spent']
    
    fieldsets = (
        (_('Основная информация'), {
            'fields': ('user', 'favorite_table')
        }),
        (_('Статистика'), {
            'fields': ('loyalty_points', 'total_visits', 'total_spent'),
            'classes': ('collapse',)
        }),
        (_('Дополнительно'), {
            'fields': ('preferences', 'notes'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'favorite_table')