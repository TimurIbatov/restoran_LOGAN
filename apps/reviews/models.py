from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Review(models.Model):
    """Отзывы о ресторане"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name=_('Пользователь'))
    booking = models.ForeignKey(
        'bookings.Booking', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviews',
        verbose_name=_('Бронирование')
    )
    
    # Оценки
    overall_rating = models.PositiveIntegerField(
        _('Общая оценка'), 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    food_rating = models.PositiveIntegerField(
        _('Оценка еды'), 
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    service_rating = models.PositiveIntegerField(
        _('Оценка сервиса'), 
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    atmosphere_rating = models.PositiveIntegerField(
        _('Оценка атмосферы'), 
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    
    # Текстовый отзыв
    title = models.CharField(_('Заголовок'), max_length=200, blank=True)
    comment = models.TextField(_('Комментарий'))
    
    # Дополнительная информация
    visit_date = models.DateField(_('Дата посещения'), blank=True, null=True)
    would_recommend = models.BooleanField(_('Рекомендует'), default=True)
    
    # Модерация
    is_published = models.BooleanField(_('Опубликован'), default=False)
    is_verified = models.BooleanField(_('Проверен'), default=False)
    moderation_comment = models.TextField(_('Комментарий модератора'), blank=True)
    
    # Системная информация
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    published_at = models.DateTimeField(_('Дата публикации'), blank=True, null=True)
    
    class Meta:
        verbose_name = _('Отзыв')
        verbose_name_plural = _('Отзывы')
        ordering = ['-created_at']
        unique_together = ['user', 'booking']  # Один отзыв на бронирование
    
    def __str__(self):
        return f"Отзыв от {self.user.get_full_name()} - {self.overall_rating}/5"
    
    @property
    def average_rating(self):
        """Средняя оценка по всем критериям"""
        ratings = [self.overall_rating]
        if self.food_rating:
            ratings.append(self.food_rating)
        if self.service_rating:
            ratings.append(self.service_rating)
        if self.atmosphere_rating:
            ratings.append(self.atmosphere_rating)
        
        return sum(ratings) / len(ratings)
    
    def publish(self):
        """Опубликовать отзыв"""
        from django.utils import timezone
        self.is_published = True
        self.published_at = timezone.now()
        self.save()
    
    def unpublish(self):
        """Снять с публикации"""
        self.is_published = False
        self.published_at = None
        self.save()

class ReviewImage(models.Model):
    """Изображения к отзывам"""
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images', verbose_name=_('Отзыв'))
    image = models.ImageField(_('Изображение'), upload_to='reviews/')
    caption = models.CharField(_('Подпись'), max_length=200, blank=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Изображение отзыва')
        verbose_name_plural = _('Изображения отзывов')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Изображение к отзыву #{self.review.id}"

class ReviewResponse(models.Model):
    """Ответы на отзывы от ресторана"""
    
    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name='response', verbose_name=_('Отзыв'))
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name=_('Автор ответа'))
    message = models.TextField(_('Сообщение'))
    is_published = models.BooleanField(_('Опубликован'), default=True)
    created_at = models.DateTimeField(_('Дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('Ответ на отзыв')
        verbose_name_plural = _('Ответы на отзывы')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Ответ на отзыв #{self.review.id}"