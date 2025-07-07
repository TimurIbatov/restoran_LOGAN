from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Booking, BookingMenuItem, Payment
from .serializers import (
    BookingSerializer, BookingCreateSerializer, AvailableTimeSlotsSerializer,
    EmailConfirmationSerializer
)

class BookingListCreateView(generics.ListCreateAPIView):
    """Список и создание бронирований"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Booking.objects.all().select_related('user', 'table').prefetch_related('menu_items', 'payments')
        return Booking.objects.filter(user=user).select_related('table').prefetch_related('menu_items', 'payments')

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали, обновление и удаление бронирования"""
    
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Booking.objects.all()
        return Booking.objects.filter(user=user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_booking(request, pk):
    """Подтверждение бронирования"""
    booking = get_object_or_404(Booking, pk=pk)
    
    if not request.user.is_staff:
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    
    if booking.status == 'pending':
        booking.confirm()
        
        # Отправляем SMS/Email уведомление
        from .tasks import send_booking_status_notification
        send_booking_status_notification.delay(booking.id, 'confirmed')
        
        return Response({'message': 'Бронирование подтверждено'})
    
    return Response({'error': 'Бронирование нельзя подтвердить'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking(request, pk):
    """Отмена бронирования"""
    booking = get_object_or_404(Booking, pk=pk)
    
    # Проверяем права доступа
    if booking.user != request.user and not request.user.is_staff:
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    
    if booking.can_be_cancelled:
        reason = request.data.get('reason', 'Отменено пользователем')
        booking.cancel(reason)
        
        # Отправляем SMS/Email уведомление
        from .tasks import send_booking_status_notification
        send_booking_status_notification.delay(booking.id, 'cancelled')
        
        return Response({'message': 'Бронирование отменено'})
    
    return Response({'error': 'Бронирование нельзя отменить'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def confirm_email(request):
    """Подтверждение email по токену"""
    serializer = EmailConfirmationSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        booking = get_object_or_404(Booking, email_confirmation_token=token, email_confirmed=False)
        booking.confirm_email()
        
        return Response({
            'message': 'Email успешно подтвержден',
            'booking_number': booking.booking_number,
            'payment_url': f'/payment/{booking.id}/'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def available_time_slots(request):
    """Получение доступных временных слотов"""
    serializer = AvailableTimeSlotsSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    date = serializer.validated_data['date']
    table_id = serializer.validated_data['table_id']
    duration = serializer.validated_data.get('duration', 120)
    
    try:
        from apps.restaurant.models import Table, RestaurantSettings
        table = Table.objects.get(id=table_id, is_active=True)
        
        # Получаем настройки ресторана
        try:
            settings = RestaurantSettings.objects.first()
            opening_time = settings.opening_time if settings else datetime.strptime('10:00', '%H:%M').time()
            closing_time = settings.closing_time if settings else datetime.strptime('22:00', '%H:%M').time()
            booking_interval = settings.booking_interval if settings else 30
        except:
            opening_time = datetime.strptime('10:00', '%H:%M').time()
            closing_time = datetime.strptime('22:00', '%H:%M').time()
            booking_interval = 30
        
        # Получаем существующие бронирования на эту дату
        existing_bookings = Booking.objects.filter(
            table=table,
            date=date,
            status__in=['confirmed', 'active', 'pending']
        ).order_by('start_time')
        
        # Генерируем доступные слоты
        available_slots = []
        current_time = datetime.combine(date, opening_time)
        end_of_day = datetime.combine(date, closing_time)
        
        while current_time + timedelta(minutes=duration) <= end_of_day:
            slot_end = current_time + timedelta(minutes=duration)
            
            # Проверяем, не пересекается ли слот с существующими бронированиями
            is_available = True
            for booking in existing_bookings:
                if (current_time < booking.end_time and slot_end > booking.start_time):
                    is_available = False
                    break
            
            if is_available:
                available_slots.append({
                    'start_time': current_time.strftime('%H:%M'),
                    'end_time': slot_end.strftime('%H:%M'),
                    'datetime_start': current_time.isoformat(),
                    'datetime_end': slot_end.isoformat()
                })
            
            current_time += timedelta(minutes=booking_interval)
        
        return Response({
            'date': date,
            'table': table.name,
            'available_slots': available_slots
        })
        
    except Table.DoesNotExist:
        return Response({'error': 'Столик не найден'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment(request, booking_id):
    """Создание платежа для бронирования"""
    booking = get_object_or_404(Booking, id=booking_id)
    
    # Проверяем права доступа
    if booking.user != request.user and not request.user.is_staff:
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    
    method = request.data.get('method', 'click')
    amount = request.data.get('amount', booking.deposit_amount)
    
    # Создаем платеж
    payment = Payment.objects.create(
        booking=booking,
        payment_id=f"PAY_{booking.booking_number}_{timezone.now().strftime('%Y%m%d%H%M%S')}",
        amount=amount,
        method=method
    )
    
    # Интеграция с платежными системами
    if method == 'click':
        payment_url = create_click_payment(payment)
    elif method == 'payme':
        payment_url = create_payme_payment(payment)
    else:
        payment_url = f"/payment/manual/{payment.id}/"
    
    return Response({
        'payment_id': payment.payment_id,
        'payment_url': payment_url,
        'amount': payment.amount
    })

def create_click_payment(payment):
    """Создание платежа через Click"""
    # Здесь будет интеграция с Click API
    return f"https://my.click.uz/services/pay?service_id=YOUR_SERVICE_ID&merchant_id=YOUR_MERCHANT_ID&amount={payment.amount}&transaction_param={payment.payment_id}"

def create_payme_payment(payment):
    """Создание платежа через Payme"""
    # Здесь будет интеграция с Payme API
    import base64
    import json
    
    params = {
        'merchant': 'YOUR_MERCHANT_ID',
        'amount': int(payment.amount * 100),  # Payme работает в тийинах
        'account': {
            'booking_id': payment.booking.id
        }
    }
    
    encoded_params = base64.b64encode(json.dumps(params).encode()).decode()
    return f"https://checkout.paycom.uz/{encoded_params}"

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def booking_statistics(request):
    """Статистика бронирований"""
    today = timezone.now().date()
    
    stats = {
        'total_bookings': Booking.objects.count(),
        'today_bookings': Booking.objects.filter(date=today).count(),
        'pending_bookings': Booking.objects.filter(status='pending').count(),
        'confirmed_bookings': Booking.objects.filter(status='confirmed').count(),
        'active_bookings': Booking.objects.filter(status='active').count(),
        'completed_bookings': Booking.objects.filter(status='completed').count(),
        'cancelled_bookings': Booking.objects.filter(status='cancelled').count(),
        'total_revenue': sum(b.total_amount for b in Booking.objects.filter(status='completed')),
        'pending_payments': Booking.objects.filter(payment_status='pending').count(),
        'deposit_paid': Booking.objects.filter(payment_status='deposit_paid').count(),
    }
    
    return Response(stats)
