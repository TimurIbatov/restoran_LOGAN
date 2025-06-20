from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для профиля пользователя"""
    
    class Meta:
        model = UserProfile
        fields = ['preferences', 'loyalty_points', 'total_visits', 'total_spent', 'favorite_table', 'notes']
        read_only_fields = ['total_visits', 'total_spent']

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователя"""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar', 'birth_date', 'address', 'is_verified',
            'created_at', 'updated_at', 'profile'
        ]
        read_only_fields = ['id', 'role', 'is_verified', 'created_at', 'updated_at']

class UserUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления профиля пользователя"""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'birth_date', 'address', 'avatar']
    
    def update(self, instance, validated_data):
        # Обновляем пользователя
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Создаем профиль если его нет
        if not hasattr(instance, 'profile'):
            UserProfile.objects.create(user=instance)
        
        return instance

class AdminUserSerializer(serializers.ModelSerializer):
    """Сериализатор для администраторов"""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar', 'birth_date', 'address', 'is_verified',
            'is_active', 'created_at', 'updated_at', 'profile'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']