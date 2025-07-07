from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid

class User(AbstractUser):
    """Кастомная модель пользователя"""
    
    ROLE_CHOICES = [
        ('customer', _('Клиент')),
        ('staff', _('Персонал')),
        ('admin', _('Администратор')),
    ]
    
    email = models.EmailField(_('Email'), unique=True)
    phone = models.CharField(_('Телефон'), max_length=20, blank=True)
    role = models.CharField(_('Роль'), max_length=20, choices=ROLE_CHOICES, default='customer')
    
    # Email подтверждение
    email_verified = models.BooleanField(_('Email подтвержден'), default=False)
    email_verification_token = models.UUIDField(_('Токен подтверждения email'), default=uuid.uuid4, unique=True)
    
    # Дополнительные поля
    date_of_birth = models.DateField(_('Дата рождения'), blank=True, null=True)
    avatar = models.ImageField(_('Аватар'), upload_to='avatars/', blank=True, null=True)
    
    # Настройки уведомлений
    email_notifications = models.BooleanField(_('Email уведомления'), default=True)
    sms_notifications = models.BooleanField(_('SMS уведомления'), default=True)
    
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser
    
    @property
    def is_staff_user(self):
        return self.role in ['staff', 'admin'] or self.is_staff
    
    def verify_email(self):
        """Подтвердить email"""
        self.email_verified = True
        self.save(update_fields=['email_verified'])

class UserProfile(models.Model):
    """Профиль пользователя"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name=_('Пользователь'))
    
    # Статистика
    total_bookings = models.PositiveIntegerField(_('Всего бронирований'), default=0)
    total_visits = models.PositiveIntegerField(_('Всего посещений'), default=0)
    total_spent = models.DecimalField(_('Потрачено всего'), max_digits=10, decimal_places=2, default=0)
    
    # Предпочтения
    favorite_table_zone = models.CharField(_('Любимая зона'), max_length=100, blank=True)
    dietary_restrictions = models.TextField(_('Диетические ограничения'), blank=True)
    special_occasions = models.TextField(_('Особые случаи'), blank=True)
    
    # Программа лояльности
    loyalty_points = models.PositiveIntegerField(_('Баллы лояльности'), default=0)
    vip_status = models.BooleanField(_('VIP статус'), default=False)
    
    created_at = models.DateTimeField(_('Создан'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлен'), auto_now=True)
    
    class Meta:
        verbose_name = _('Профиль пользователя')
        verbose_name_plural = _('Профили пользователей')
    
    def __str__(self):
        return f"Профиль {self.user.get_full_name()}"
