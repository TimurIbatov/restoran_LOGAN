from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task
def send_email_verification(user_id):
    """Отправка email подтверждения при регистрации"""
    try:
        user = User.objects.get(id=user_id)
        
        # Формируем ссылку подтверждения
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{user.email_verification_token}/"
        
        # Отправляем email
        subject = 'Подтверждение регистрации в Restaurant Logan'
        html_message = render_to_string('emails/email_verification.html', {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'Restaurant Logan'
        })
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return f"Email подтверждения отправлен пользователю {user.email}"
        
    except User.DoesNotExist:
        return f"Пользователь с ID {user_id} не найден"
    except Exception as e:
        return f"Ошибка отправки email: {str(e)}"
