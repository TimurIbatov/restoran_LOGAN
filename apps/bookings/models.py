from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Booking(models.Model):
    """Бронирования столиков"""
    
    STATUS_CHOICES = [
        ('pending', _('Ожидает подтверждения')),
        ('confirmed', _('Подтверждено')),
        ('active', _('Активно')),
        ('completed', _('Завершено')),
        ('cancelled', _('Отменено')),
        ('no_show', _('Не явился')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', verbose_name=_('Пользователь'))
    table = models.ForeignKey('restaurant.Table', on_delete=models.CASCADE, related_name='bookings', verbose_name=_('Столик'))
    
    # Временные интервалы
    date = models.DateField(_('Дата'))
    start_time = models.DateTimeField(_('Время начала'))
    end_time = models.DateTimeField(_('Время окончания'))
    duration = models.PositiveIntegerField(_('Продолжительность (мин)'))
    
    # Информация о бронировании
    guests_count = models.PositiveIntegerField(_('Количество гостей'))
    status = models.CharField(_('Статус'), max_length=20, choices=STATUS_CHOICES, default='pending')
    comment = models.TextField(_('Комментарий'), blank=True)
    special_requests = models.TextField(_('Особые пожелания'), blank=True)
    
    # Контактная информация
    contact_name = models.CharField(_('Контактное имя'), max_length=100, blank=True)
    contact_phone = models.CharField(_('Контактный телефон'), max_length=20, blank=True)
    contact_email = models.EmailField(_('Контактный email'), blank=True)
    
    # Финансовая информация
    deposit_amount = models.DecimalField(_('Сумма депозита'), max_digits=8, decimal_places=2, default=0)
    total_amount = models.DecimalField(_('Общая сумма'), max_digits=8, decimal_places=2, default=0)
    is_deposit_paid = models.BooleanField(_('Депозит оплачен'), default=False)
    
    # Системная информация
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    confirmed_at = models.DateTimeField(_('Дата подтверждения'), blank=True, null=True)
    cancelled_at = models.DateTimeField(_('Дата отмены'), blank=True, null=True)
    cancellation_reason = models.TextField(_('Причина отмены'), blank=True)
    
    # Дополнительные поля
    source = models.CharField(_('Источник бронирования'), max_length=50, default='website')
    notes = models.TextField(_('Внутренние заметки'), blank=True)
    
    class Meta:
        verbose_name = _('Бронирование')
        verbose_name_plural = _('Бронирования')
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['date', 'start_time']),
            models.Index(fields=['table', 'start_time']),
            models.Index(fields=['user', 'start_time']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Бронирование #{self.id} - {self.table} на {self.start_time.strftime('%d.%m.%Y %H:%M')}"
    
    def clean(self):
        """Валидация бронирования"""
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError(_('Время окончания должно быть позже времени начала'))
            
            if self.start_time < timezone.now():
                raise ValidationError(_('Нельзя создать бронирование в прошлом'))
            
            # Проверяем пересечения с другими бронированиями
            overlapping_bookings = Booking.objects.filter(
                table=self.table,
                status__in=['confirmed', 'active', 'pending']
            ).exclude(pk=self.pk)
            
            for booking in overlapping_bookings:
                if (self.start_time < booking.end_time and self.end_time > booking.start_time):
                    raise ValidationError(
                        _('Столик уже забронирован на это время. Конфликт с бронированием #{}'.format(booking.id))
                    )
        
        if self.guests_count and self.table:
            if self.guests_count > self.table.capacity:
                raise ValidationError(
                    _('Количество гостей ({}) превышает вместимость столика ({})').format(
                        self.guests_count, self.table.capacity
                    )
                )
            
            if self.guests_count < self.table.min_capacity:
                raise ValidationError(
                    _('Количество гостей ({}) меньше минимальной вместимости столика ({})').format(
                        self.guests_count, self.table.min_capacity
                    )
                )
    
    def save(self, *args, **kwargs):
        # Автоматически вычисляем продолжительность
        if self.start_time and self.end_time:
            self.duration = int((self.end_time - self.start_time).total_seconds() / 60)
            self.date = self.start_time.date()
        
        # Заполняем контактную информацию из профиля пользователя
        if not self.contact_name and self.user:
            self.contact_name = self.user.get_full_name()
        if not self.contact_phone and self.user:
            self.contact_phone = self.user.phone
        if not self.contact_email and self.user:
            self.contact_email = self.user.email
        
        # Вычисляем депозит
        if self.table and not self.deposit_amount:
            self.deposit_amount = self.table.deposit
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def can_be_cancelled(self):
        """Можно ли отменить бронирование"""
        if self.status in ['cancelled', 'completed', 'no_show']:
            return False
        
        from apps.restaurant.models import RestaurantSettings
        try:
            settings = RestaurantSettings.objects.first()
            cancellation_hours = settings.cancellation_hours if settings else 2
        except:
            cancellation_hours = 2
        
        cancellation_deadline = self.start_time - timedelta(hours=cancellation_hours)
        return timezone.now() < cancellation_deadline
    
    @property
    def is_active(self):
        """Активно ли бронирование сейчас"""
        now = timezone.now()
        return self.start_time <= now <= self.end_time and self.status in ['confirmed', 'active']
    
    def confirm(self):
        """Подтвердить бронирование"""
        if self.status == 'pending':
            self.status = 'confirmed'
            self.confirmed_at = timezone.now()
            self.save()
    
    def cancel(self, reason=''):
        """Отменить бронирование"""
        if self.can_be_cancelled:
            self.status = 'cancelled'
            self.cancelled_at = timezone.now()
            self.cancellation_reason = reason
            self.save()
    
    def activate(self):
        """Активировать бронирование (клиент пришел)"""
        if self.status == 'confirmed':
            self.status = 'active'
            self.save()
    
    def complete(self):
        """Завершить бронирование"""
        if self.status in ['confirmed', 'active']:
            self.status = 'completed'
            self.save()
            
            # Обновляем статистику пользователя
            if hasattr(self.user, 'profile'):
                profile = self.user.profile
                profile.total_visits += 1
                profile.save()

class BookingMenuItem(models.Model):
    """Предзаказанные блюда для бронирования"""
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='menu_items', verbose_name=_('Бронирование'))
    menu_item = models.ForeignKey('restaurant.MenuItem', on_delete=models.CASCADE, verbose_name=_('Блюдо'))
    quantity = models.PositiveIntegerField(_('Количество'), default=1)
    price = models.DecimalField(_('Цена за единицу'), max_digits=8, decimal_places=2)
    notes = models.TextField(_('Примечания'), blank=True)
    
    class Meta:
        verbose_name = _('Блюдо в бронировании')
        verbose_name_plural = _('Блюда в бронировании')
        unique_together = ['booking', 'menu_item']
    
    def __str__(self):
        return f"{self.menu_item.name} x{self.quantity} для бронирования #{self.booking.id}"
    
    @property
    def total_price(self):
        return self.price * self.quantity
    
    def save(self, *args, **kwargs):
        # Автоматически устанавливаем цену из меню
        if not self.price:
            self.price = self.menu_item.price
        super().save(*args, **kwargs)

class BookingHistory(models.Model):
    """История изменений бронирования"""
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='history', verbose_name=_('Бронирование'))
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name=_('Изменил'))
    action = models.CharField(_('Действие'), max_length=50)
    old_status = models.CharField(_('Старый статус'), max_length=20, blank=True)
    new_status = models.CharField(_('Новый статус'), max_length=20, blank=True)
    comment = models.TextField(_('Комментарий'), blank=True)
    created_at = models.DateTimeField(_('Дата'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('История бронирования')
        verbose_name_plural = _('История бронирований')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"История #{self.booking.id} - {self.action}"