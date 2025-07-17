from rest_framework import serializers
from .models import Zone, Table, MenuCategory, MenuItem, RestaurantSettings

class ZoneSerializer(serializers.ModelSerializer):
    """Сериализатор для зон"""
    
    tables_count = serializers.IntegerField(source='tables.count', read_only=True)
    
    class Meta:
        model = Zone
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'sort_order', 'tables_count']

class TableSerializer(serializers.ModelSerializer):
    """Сериализатор для столиков"""
    
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    zone_slug = serializers.CharField(source='zone.slug', read_only=True)
    current_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Table
        fields = [
            'id', 'name', 'zone', 'zone_name', 'zone_slug', 'capacity', 'min_capacity',
            'description', 'image', 'price_per_hour', 'deposit', 'is_active', 'is_vip',
            'features', 'current_status', 'created_at', 'updated_at'
        ]

class MenuCategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий меню"""
    
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    
    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'sort_order', 'items_count']

class MenuItemSerializer(serializers.ModelSerializer):
    """Сериализатор для блюд меню"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name', 'category_slug', 'name', 'slug',
            'description', 'ingredients', 'image', 'price', 'weight', 'calories',
            'cooking_time', 'is_available', 'is_special', 'is_vegetarian', 'is_vegan',
            'is_gluten_free', 'allergens', 'sort_order', 'created_at', 'updated_at'
        ]

class RestaurantSettingsSerializer(serializers.ModelSerializer):
    """Сериализатор для настроек ресторана"""
    
    class Meta:
        model = RestaurantSettings
        fields = [
            'name', 'description', 'address', 'phone', 'email', 'website',
            'opening_time', 'closing_time', 'booking_advance_days', 'min_booking_duration',
            'max_booking_duration', 'default_booking_duration', 'booking_interval',
            'cancellation_hours', 'facebook_url', 'instagram_url', 'telegram_url',
            'logo', 'hero_image'
        ]