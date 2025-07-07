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
            'features', 'position_x', 'position_y', 'current_status', 'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Валидация данных столика"""
        # Проверяем, что зона существует
        zone = data.get('zone')
        if zone and not Zone.objects.filter(id=zone.id if hasattr(zone, 'id') else zone, is_active=True).exists():
            raise serializers.ValidationError({'zone': 'Выбранная зона не существует или неактивна'})
        
        # Проверяем вместимость
        capacity = data.get('capacity')
        min_capacity = data.get('min_capacity', 1)
        if capacity and min_capacity and min_capacity > capacity:
            raise serializers.ValidationError({'min_capacity': 'Минимальная вместимость не может быть больше максимальной'})
        
        # Проверяем цену
        price_per_hour = data.get('price_per_hour')
        if price_per_hour is not None and price_per_hour < 0:
            raise serializers.ValidationError({'price_per_hour': 'Цена не может быть отрицательной'})
        
        return data
    
    def create(self, validated_data):
        """Создание столика"""
        return Table.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """Обновление столика"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

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
    
    def validate(self, data):
        """Валидация данных блюда"""
        # Проверяем, что категория существует
        category = data.get('category')
        if category and not MenuCategory.objects.filter(id=category.id if hasattr(category, 'id') else category, is_active=True).exists():
            raise serializers.ValidationError({'category': 'Выбранная категория не существует или неактивна'})
        
        # Проверяем цену
        price = data.get('price')
        if price is not None and price < 0:
            raise serializers.ValidationError({'price': 'Цена не может быть отрицательной'})
        
        # Генерируем slug если не указан
        name = data.get('name')
        if name and not data.get('slug'):
            import re
            slug = re.sub(r'[^\w\s-]', '', name.lower())
            slug = re.sub(r'[-\s]+', '-', slug)
            data['slug'] = slug
        
        return data
    
    def create(self, validated_data):
        """Создание блюда"""
        return MenuItem.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """Обновление блюда"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

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
