from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from .models import Booking
import requests

@shared_task
def send_booking_confirmation_email(booking_id):
    """Отправка email подтверждения бронирования"""
    try:
        booking = Booking.objects.get(id=booking_id)
        
        # Формируем ссылку подтверждения
        confirmation_url = f"{settings.FRONTEND_URL}/confirm-email/{booking.email_confirmation_token}/"
        
        # Отправляем email
        subject = f'Подтверждение бронирования #{booking.booking_number}'
        html_message = render_to_string('emails/booking_confirmation.html', {
            'booking': booking,
            'confirmation_url': confirmation_url,
            'site_name': 'Restaurant Logan'
        })
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.contact_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        # Обновляем время отправки
        booking.email_sent_at = timezone.now()
        booking.save(update_fields=['email_sent_at'])
        
        return f"Email отправлен для бронирования #{booking.booking_number}"
        
    except Booking.DoesNotExist:
        return f"Бронирование с ID {booking_id} не найдено"
    except Exception as e:
        return f"Ошибка отправки email: {str(e)}"

@shared_task
def send_booking_status_notification(booking_id, status):
    """Отправка уведомления об изменении статуса бронирования"""
    try:
        booking = Booking.objects.get(id=booking_id)
        
        # Отправляем email
        subject = f'Изменение статуса бронирования #{booking.booking_number}'
        
        status_messages = {
            'confirmed': 'Ваше бронирование подтверждено!',
            'cancelled': 'Ваше бронирование отменено.',
            'active': 'Добро пожаловать! Ваше бронирование активно.',
            'completed': 'Спасибо за посещение! Ваше бронирование завершено.'
        }
        
        html_message = render_to_string('emails/booking_status_update.html', {
            'booking': booking,
            'status_message': status_messages.get(status, 'Статус бронирования изменен'),
            'site_name': 'Restaurant Logan'
        })
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.contact_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        # Отправляем SMS если есть номер телефона
        if booking.contact_phone:
            send_sms_notification.delay(booking.contact_phone, status_messages.get(status, 'Статус изменен'))
        
        return f"Уведомление отправлено для бронирования #{booking.booking_number}"
        
    except Booking.DoesNotExist:
        return f"Бронирование с ID {booking_id} не найдено"
    except Exception as e:
        return f"Ошибка отправки уведомления: {str(e)}"

@shared_task
def send_sms_notification(phone_number, message):
    """Отправка SMS уведомления"""
    try:
        # Интеграция с SMS провайдером (например, Eskiz.uz)
        sms_api_url = "https://notify.eskiz.uz/api/message/sms/send"
        
        payload = {
            'mobile_phone': phone_number,
            'message': f"Restaurant Logan: {message}",
            'from': '4546',  # Ваш номер отправителя
        }
        
        headers = {
            'Authorization': f'Bearer {settings.SMS_API_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(sms_api_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            return f"SMS отправлено на номер {phone_number}"
        else:
            return f"Ошибка отправки SMS: {response.text}"
            
    except Exception as e:
        return f"Ошибка отправки SMS: {str(e)}"

@shared_task
def send_booking_reminders():
    """Отправка напоминаний о предстоящих бронированиях"""
    from datetime import timedelta
    
    # Находим бронирования на завтра
    tomorrow = timezone.now().date() + timedelta(days=1)
    upcoming_bookings = Booking.objects.filter(
        date=tomorrow,
        status='confirmed',
        email_confirmed=True
    )
    
    for booking in upcoming_bookings:
        subject = f'Напоминание о бронировании #{booking.booking_number}'
        html_message = render_to_string('emails/booking_reminder.html', {
            'booking': booking,
            'site_name': 'Restaurant Logan'
        })
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.contact_email],
            html_message=html_message,
            fail_silently=True,
        )
        
        # Отправляем SMS напоминание
        if booking.contact_phone:
            message = f"Напоминание: завтра у вас бронирование в Restaurant Logan на {booking.start_time.strftime('%H:%M')}. Бронь #{booking.booking_number}"
            send_sms_notification.delay(booking.contact_phone, message)
    
    return f"Отправлено {len(upcoming_bookings)} напоминаний"
