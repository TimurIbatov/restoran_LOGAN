from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """Кастомная модель пользователя"""
    
    ROLE_CHOICES = [
        ('user', _('Пользователь')),
        ('admin', _('Администратор')),
        ('staff', _('Персонал')),
    ]
    
    email = models.EmailField(_('Email адрес'), unique=True)
    phone = models.CharField(_('Телефон'), max_length=20, blank=True)
    role = models.CharField(_('Роль'), max_length=10, choices=ROLE_CHOICES, default='user')
    avatar = models.ImageField(_('Аватар'), upload_to='avatars/', blank=True, null=True)
    birth_date = models.DateField(_('Дата рождения'), blank=True, null=True)
    address = models.TextField(_('Адрес'), blank=True)
    is_verified = models.BooleanField(_('Подтвержден'), default=False)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    @property
    def full_name(self):
        return self.get_full_name() or self.username
    
    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser
    
    @property
    def is_staff_user(self):
        return self.role in ['admin', 'staff'] or self.is_staff

class UserProfile(models.Model):
    """Дополнительная информация о пользователе"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    preferences = models.JSONField(_('Предпочтения'), default=dict, blank=True)
    loyalty_points = models.PositiveIntegerField(_('Баллы лояльности'), default=0)
    total_visits = models.PositiveIntegerField(_('Всего посещений'), default=0)
    total_spent = models.DecimalField(_('Общая сумма заказов'), max_digits=10, decimal_places=2, default=0)
    favorite_table = models.ForeignKey(
        'restaurant.Table', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name=_('Любимый столик')
    )
    notes = models.TextField(_('Заметки'), blank=True, help_text=_('Внутренние заметки о клиенте'))
    
    class Meta:
        verbose_name = _('Профиль пользователя')
        verbose_name_plural = _('Профили пользователей')
    
    def __str__(self):
        return f"Профиль {self.user.full_name}"