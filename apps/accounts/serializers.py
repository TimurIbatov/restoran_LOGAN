from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор профиля пользователя"""
    
    class Meta:
        model = UserProfile
        fields = [
            'total_bookings', 'total_visits', 'total_spent', 'favorite_table_zone',
            'dietary_restrictions', 'special_occasions', 'loyalty_points', 'vip_status'
        ]
        read_only_fields = ['total_bookings', 'total_visits', 'total_spent', 'loyalty_points', 'vip_status']

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор пользователя"""
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role',
            'email_verified', 'date_of_birth', 'avatar', 'email_notifications',
            'sms_notifications', 'created_at', 'profile'
        ]
        read_only_fields = ['id', 'role', 'email_verified', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Создаем профиль
        UserProfile.objects.create(user=user)
        
        # Отправляем email подтверждение
        from .tasks import send_email_verification
        send_email_verification.delay(user.id)
        
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class EmailVerificationSerializer(serializers.Serializer):
    """Сериализатор для подтверждения email"""
    token = serializers.UUIDField()
    
    def validate_token(self, value):
        try:
            user = User.objects.get(email_verification_token=value, email_verified=False)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный или уже использованный токен')
