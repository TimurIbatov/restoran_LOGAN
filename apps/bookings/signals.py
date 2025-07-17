from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Booking, BookingHistory

@receiver(pre_save, sender=Booking)
def track_booking_changes(sender, instance, **kwargs):
    """Отслеживание изменений статуса бронирования"""
    if instance.pk:
        try:
            old_instance = Booking.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Создаем запись в истории
                BookingHistory.objects.create(
                    booking=instance,
                    action='status_change',
                    old_status=old_instance.status,
                    new_status=instance.status,
                    comment=f'Статус изменен с "{old_instance.get_status_display()}" на "{instance.get_status_display()}"'
                )
        except Booking.DoesNotExist:
            pass

@receiver(post_save, sender=Booking)
def booking_created(sender, instance, created, **kwargs):
    """Действия при создании нового бронирования"""
    if created:
        BookingHistory.objects.create(
            booking=instance,
            action='created',
            new_status=instance.status,
            comment='Бронирование создано'
        )