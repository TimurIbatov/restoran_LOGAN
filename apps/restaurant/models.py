from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator

class Zone(models.Model):
    """Зоны ресторана"""
    
    name = models.CharField(_('Название'), max_length=100)
    slug = models.SlugField(_('Слаг'), unique=True)
    description = models.TextField(_('Описание'), blank=True)
    image = models.ImageField(_('Изображение'), upload_to='zones/', blank=True, null=True)
    is_active = models.BooleanField(_('Активна'), default=True)
    sort_order = models.PositiveIntegerField(_('Порядок сортировки'), default=0)
    
    class Meta:
        verbose_name = _('Зона')
        verbose_name_plural = _('Зоны')
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        return self.name

class Table(models.Model):
    """Столики ресторана"""
    
    STATUS_CHOICES = [
        ('available', _('Доступен')),
        ('occupied', _('Занят')),
        ('reserved', _('Забронирован')),
        ('maintenance', _('На обслуживании')),
    ]
    
    name = models.CharField(_('Название'), max_length=50)
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='tables', verbose_name=_('Зона'))
    capacity = models.PositiveIntegerField(_('Вместимость'), validators=[MinValueValidator(1), MaxValueValidator(20)])
    min_capacity = models.PositiveIntegerField(_('Минимальная вместимость'), default=1)
    description = models.TextField(_('Описание'), blank=True)
    image = models.ImageField(_('Изображение'), upload_to='tables/', blank=True, null=True)
    price_per_hour = models.DecimalField(_('Цена за столик'), max_digits=8, decimal_places=2, default=0)
    deposit = models.DecimalField(_('Депозит'), max_digits=8, decimal_places=2, default=0)
    is_active = models.BooleanField(_('Активен'), default=True)
    is_vip = models.BooleanField(_('VIP столик'), default=False)
    features = models.JSONField(_('Особенности'), default=list, blank=True, help_text=_('Список особенностей столика'))
    position_x = models.FloatField(_('Позиция X'), default=0, help_text=_('Координата X на плане зала'))
    position_y = models.FloatField(_('Позиция Y'), default=0, help_text=_('Координата Y на плане зала'))
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('Столик')
        verbose_name_plural = _('Столики')
        ordering = ['zone', 'name']
        unique_together = ['zone', 'name']
    
    def __str__(self):
        return f"{self.zone.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Автоматически устанавливаем депозит как 50% от цены столика
        if self.price_per_hour and not self.deposit:
            self.deposit = self.price_per_hour / 2
        super().save(*args, **kwargs)
    
    @property
    def current_status(self):
        """Текущий статус столика"""
        from apps.bookings.models import Booking
        from django.utils import timezone
        
        now = timezone.now()
        current_booking = Booking.objects.filter(
            table=self,
            status__in=['confirmed', 'active'],
            start_time__lte=now,
            end_time__gte=now
        ).first()
        
        if current_booking:
            return 'occupied' if current_booking.status == 'active' else 'reserved'
        
        return 'available' if self.is_active else 'maintenance'

class MenuCategory(models.Model):
    """Категории меню"""
    
    name = models.CharField(_('Название'), max_length=100)
    slug = models.SlugField(_('Слаг'), unique=True)
    description = models.TextField(_('Описание'), blank=True)
    image = models.ImageField(_('Изображение'), upload_to='menu/categories/', blank=True, null=True)
    is_active = models.BooleanField(_('Активна'), default=True)
    sort_order = models.PositiveIntegerField(_('Порядок сортировки'), default=0)
    
    class Meta:
        verbose_name = _('Категория меню')
        verbose_name_plural = _('Категории меню')
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        return self.name

class MenuItem(models.Model):
    """Блюда меню"""
    
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='items', verbose_name=_('Категория'))
    name = models.CharField(_('Название'), max_length=200)
    slug = models.SlugField(_('Слаг'), unique=True)
    description = models.TextField(_('Описание'), blank=True)
    ingredients = models.TextField(_('Состав'), blank=True)
    image = models.ImageField(_('Изображение'), upload_to='menu/items/', blank=True, null=True)
    price = models.DecimalField(_('Цена'), max_digits=8, decimal_places=2)
    weight = models.PositiveIntegerField(_('Вес (г)'), blank=True, null=True)
    calories = models.PositiveIntegerField(_('Калории'), blank=True, null=True)
    cooking_time = models.PositiveIntegerField(_('Время приготовления (мин)'), default=15)
    is_available = models.BooleanField(_('Доступно'), default=True)
    is_special = models.BooleanField(_('Спецпредложение'), default=False)
    is_vegetarian = models.BooleanField(_('Вегетарианское'), default=False)
    is_vegan = models.BooleanField(_('Веганское'), default=False)
    is_gluten_free = models.BooleanField(_('Без глютена'), default=False)
    allergens = models.JSONField(_('Аллергены'), default=list, blank=True)
    sort_order = models.PositiveIntegerField(_('Порядок сортировки'), default=0)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('Блюдо')
        verbose_name_plural = _('Блюда')
        ordering = ['category', 'sort_order', 'name']
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"

class RestaurantSettings(models.Model):
    """Настройки ресторана"""
    
    name = models.CharField(_('Название ресторана'), max_length=200, default='Ресторан "LOGAN"')
    description = models.TextField(_('Описание'), blank=True)
    address = models.TextField(_('Адрес'))
    phone = models.CharField(_('Телефон'), max_length=20)
    email = models.EmailField(_('Email'))
    website = models.URLField(_('Веб-сайт'), blank=True)
    
    # Время работы
    opening_time = models.TimeField(_('Время открытия'), default='10:00')
    closing_time = models.TimeField(_('Время закрытия'), default='23:00')
    
    # Настройки бронирования
    booking_advance_days = models.PositiveIntegerField(_('Дней вперед для бронирования'), default=30)
    min_booking_duration = models.PositiveIntegerField(_('Мин. время бронирования (мин)'), default=60)
    max_booking_duration = models.PositiveIntegerField(_('Макс. время бронирования (мин)'), default=240)
    default_booking_duration = models.PositiveIntegerField(_('Стандартное время бронирования (мин)'), default=120)
    booking_interval = models.PositiveIntegerField(_('Интервал между бронированиями (мин)'), default=30)
    cancellation_hours = models.PositiveIntegerField(_('Часов до отмены'), default=2)
    
    # Социальные сети
    facebook_url = models.URLField(_('Facebook'), blank=True)
    instagram_url = models.URLField(_('Instagram'), blank=True)
    telegram_url = models.URLField(_('Telegram'), blank=True)
    
    # Изображения
    logo = models.ImageField(_('Логотип'), upload_to='restaurant/', blank=True, null=True)
    hero_image = models.ImageField(_('Главное изображение'), upload_to='restaurant/', blank=True, null=True)
    
    class Meta:
        verbose_name = _('Настройки ресторана')
        verbose_name_plural = _('Настройки ресторана')
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Обеспечиваем единственность записи
        if not self.pk and RestaurantSettings.objects.exists():
            raise ValueError('Может существовать только одна запись настроек ресторана')
        super().save(*args, **kwargs)
