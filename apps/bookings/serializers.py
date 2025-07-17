from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Booking, BookingMenuItem
from apps.restaurant.models import Table, MenuItem, RestaurantSettings
from apps.restaurant.serializers import TableSerializer, MenuItemSerializer

class BookingMenuItemSerializer(serializers.ModelSerializer):
    """Сериализатор для предзаказанных блюд"""
    
    menu_item_details = MenuItemSerializer(source='menu_item', read_only=True)
    total_price = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    
    class Meta:
        model = BookingMenuItem
        fields = ['id', 'menu_item', 'menu_item_details', 'quantity', 'price', 'total_price', 'notes']
        read_only_fields = ['price']

class BookingSerializer(serializers.ModelSerializer):
    """Сериализатор для бронирований"""
    
    table_details = TableSerializer(source='table', read_only=True)
    menu_items = BookingMenuItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_name', 'table', 'table_details', 'date', 'start_time', 'end_time',
            'duration', 'guests_count', 'status', 'comment', 'special_requests',
            'contact_name', 'contact_phone', 'contact_email', 'deposit_amount', 'total_amount',
            'is_deposit_paid', 'created_at', 'updated_at', 'menu_items', 'can_be_cancelled', 'is_active'
        ]
        read_only_fields = [
            'id', 'user', 'duration', 'deposit_amount', 'total_amount', 'created_at', 'updated_at'
        ]

class BookingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания бронирования"""
    
    menu_items = BookingMenuItemSerializer(many=True, required=False)
    
    class Meta:
        model = Booking
        fields = [
            'table', 'start_time', 'end_time', 'guests_count', 'comment', 'special_requests',
            'contact_name', 'contact_phone', 'contact_email', 'menu_items'
        ]
    
    def validate(self, data):
        """Валидация данных бронирования"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        table = data.get('table')
        guests_count = data.get('guests_count')
        
        # Проверяем время
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError('Время окончания должно быть позже времени начала')
            
            if start_time < timezone.now():
                raise serializers.ValidationError('Нельзя создать бронирование в прошлом')
            
            # Проверяем продолжительность
            duration = int((end_time - start_time).total_seconds() / 60)
            
            try:
                settings = RestaurantSettings.objects.first()
                min_duration = settings.min_booking_duration if settings else 60
                max_duration = settings.max_booking_duration if settings else 240
            except:
                min_duration = 60
                max_duration = 240
            
            if duration < min_duration:
                raise serializers.ValidationError(f'Минимальная продолжительность бронирования: {min_duration} минут')
            
            if duration > max_duration:
                raise serializers.ValidationError(f'Максимальная продолжительность бронирования: {max_duration} минут')
        
        # Проверяем столик
        if table and guests_count:
            if guests_count > table.capacity:
                raise serializers.ValidationError(
                    f'Количество гостей ({guests_count}) превышает вместимость столика ({table.capacity})'
                )
            
            if guests_count < table.min_capacity:
                raise serializers.ValidationError(
                    f'Количество гостей ({guests_count}) меньше минимальной вместимости столика ({table.min_capacity})'
                )
        
        # Проверяем доступность столика
        if table and start_time and end_time:
            overlapping_bookings = Booking.objects.filter(
                table=table,
                status__in=['confirmed', 'active', 'pending'],
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            if overlapping_bookings.exists():
                raise serializers.ValidationError('Столик уже забронирован на это время')
        
        return data
    
    def create(self, validated_data):
        """Создание бронирования"""
        menu_items_data = validated_data.pop('menu_items', [])
        
        # Устанавливаем пользователя
        validated_data['user'] = self.context['request'].user
        
        # Создаем бронирование
        booking = Booking.objects.create(**validated_data)
        
        # Добавляем предзаказанные блюда
        for item_data in menu_items_data:
            BookingMenuItem.objects.create(booking=booking, **item_data)
        
        return booking

class AvailableTimeSlotsSerializer(serializers.Serializer):
    """Сериализатор для доступных временных слотов"""
    
    date = serializers.DateField()
    table_id = serializers.IntegerField()
    duration = serializers.IntegerField(required=False)
    
    def validate_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError('Нельзя выбрать дату в прошлом')
        
        try:
            settings = RestaurantSettings.objects.first()
            advance_days = settings.booking_advance_days if settings else 30
        except:
            advance_days = 30
        
        max_date = timezone.now().date() + timedelta(days=advance_days)
        if value > max_date:
            raise serializers.ValidationError(f'Можно бронировать максимум на {advance_days} дней вперед')
        
        return value
    
    def validate_table_id(self, value):
        try:
            table = Table.objects.get(id=value, is_active=True)
            return value
        except Table.DoesNotExist:
            raise serializers.ValidationError('Столик не найден или неактивен')