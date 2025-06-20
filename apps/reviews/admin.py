from django.contrib import admin
from django.utils.html import format_html
from .models import Review, ReviewImage, ReviewResponse

class ReviewImageInline(admin.TabularInline):
    """Инлайн для изображений отзывов"""
    model = ReviewImage
    extra = 0

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Админ-панель для отзывов"""
    
    list_display = [
        'id', 'user_name', 'overall_rating', 'rating_display', 'is_published', 
        'is_verified', 'would_recommend', 'created_at'
    ]
    list_filter = [
        'overall_rating', 'is_published', 'is_verified', 'would_recommend', 
        'visit_date', 'created_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'title', 'comment']
    readonly_fields = ['created_at', 'updated_at', 'average_rating']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'booking', 'title', 'comment', 'visit_date')
        }),
        ('Оценки', {
            'fields': ('overall_rating', 'food_rating', 'service_rating', 'atmosphere_rating', 'average_rating')
        }),
        ('Дополнительно', {
            'fields': ('would_recommend',)
        }),
        ('Модерация', {
            'fields': ('is_published', 'is_verified', 'moderation_comment'),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ReviewImageInline]
    actions = ['publish_reviews', 'unpublish_reviews', 'verify_reviews']
    
    def user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_name.short_description = 'Пользователь'
    
    def rating_display(self, obj):
        stars = '★' * obj.overall_rating + '☆' * (5 - obj.overall_rating)
        return format_html('<span style="color: gold;">{}</span>', stars)
    rating_display.short_description = 'Рейтинг'
    
    def publish_reviews(self, request, queryset):
        count = queryset.filter(is_published=False).update(is_published=True)
        self.message_user(request, f'Опубликовано {count} отзывов')
    publish_reviews.short_description = 'Опубликовать выбранные отзывы'
    
    def unpublish_reviews(self, request, queryset):
        count = queryset.filter(is_published=True).update(is_published=False)
        self.message_user(request, f'Снято с публикации {count} отзывов')
    unpublish_reviews.short_description = 'Снять с публикации выбранные отзывы'
    
    def verify_reviews(self, request, queryset):
        count = queryset.filter(is_verified=False).update(is_verified=True)
        self.message_user(request, f'Проверено {count} отзывов')
    verify_reviews.short_description = 'Отметить как проверенные'

@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    """Админ-панель для изображений отзывов"""
    
    list_display = ['review', 'caption', 'created_at']
    list_filter = ['created_at']
    search_fields = ['review__user__email', 'caption']

@admin.register(ReviewResponse)
class ReviewResponseAdmin(admin.ModelAdmin):
    """Админ-панель для ответов на отзывы"""
    
    list_display = ['review', 'author', 'is_published', 'created_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['review__user__email', 'message']
    readonly_fields = ['created_at', 'updated_at']