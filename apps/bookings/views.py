from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta, time
from django.db.models import Q
from .models import Booking
from .serializers import (
    BookingSerializer, BookingCreateSerializer, AvailableTimeSlotsSerializer
)
from apps.restaurant.models import Table, RestaurantSettings

class BookingListCreateView(generics.ListCreateAPIView):
    """Список и создание бронирований"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            return Booking.objects.all().select_related('user', 'table', 'table__zone').prefetch_related('menu_items')
        return Booking.objects.filter(user=user).select_related('table', 'table__zone').prefetch_related('menu_items')

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали, обновление и удаление бронирования"""
    
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            return Booking.objects.all().select_related('user', 'table', 'table__zone').prefetch_related('menu_items')
        return Booking.objects.filter(user=user).select_related('table', 'table__zone').prefetch_related('menu_items')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_time_slots(request):
    """Получение доступных временных слотов для бронирования"""
    
    serializer = AvailableTimeSlotsSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    date = serializer.validated_data['date']
    table_id = serializer.validated_data['table_id']
    duration = serializer.validated_data.get('duration')
    
    try:
        table = Table.objects.get(id=table_id, is_active=True)
    except Table.DoesNotExist:
        return Response({'error': 'Столик не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    # Получаем настройки ресторана
    try:
        settings = RestaurantSettings.objects.first()
        if settings:
            opening_time = settings.opening_time
            closing_time = settings.closing_time
            booking_interval = settings.booking_interval
            default_duration = settings.default_booking_duration
        else:
            opening_time = time(10, 0)
            closing_time = time(23, 0)
            booking_interval = 30
            default_duration = 120
    except:
        opening_time = time(10, 0)
        closing_time = time(23, 0)
        booking_interval = 30
        default_duration = 120
    
    if not duration:
        duration = default_duration
    
    # Получаем существующие бронирования на эту дату
    existing_bookings = Booking.objects.filter(
        table=table,
        date=date,
        status__in=['confirmed', 'active', 'pending']
    ).order_by('start_time')
    
    # Генерируем временные слоты
    available_slots = []
    current_datetime = datetime.combine(date, opening_time)
    end_datetime = datetime.combine(date, closing_time)
    
    # Если дата сегодня, начинаем с текущего времени
    if date == timezone.now().date():
        now = timezone.now()
        if current_datetime < now:
            # Округляем до ближайшего интервала
            minutes_to_add = booking_interval - (now.minute % booking_interval)
            current_datetime = now.replace(second=0, microsecond=0) + timedelta(minutes=minutes_to_add)
    
    while current_datetime + timedelta(minutes=duration) <= end_datetime:
        slot_start = current_datetime
        slot_end = current_datetime + timedelta(minutes=duration)
        
        # Проверяем, не пересекается ли слот с существующими бронированиями
        is_available = True
        for booking in existing_bookings:
            booking_start = booking.start_time
            booking_end = booking.end_time
            
            if (slot_start < booking_end and slot_end > booking_start):
                is_available = False
                break
        
        if is_available:
            available_slots.append({
                'start_time': slot_start.time().strftime('%H:%M'),
                'end_time': slot_end.time().strftime('%H:%M'),
                'duration': duration
            })
        
        current_datetime += timedelta(minutes=booking_interval)
    
    return Response({
        'date': date,
        'table_id': table_id,
        'available_slots': available_slots
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking(request, booking_id):
    """Отмена бронирования"""
    
    try:
        if request.user.is_admin_user:
            booking = Booking.objects.get(id=booking_id)
        else:
            booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Бронирование не найдено'}, status=status.HTTP_404_NOT_FOUND)
    
    if not booking.can_be_cancelled:
        return Response(
            {'error': 'Бронирование нельзя отменить (слишком поздно или уже завершено)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    reason = request.data.get('reason', '')
    booking.cancel(reason)
    
    return Response({'message': 'Бронирование успешно отменено'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_booking(request, booking_id):
    """Подтверждение бронирования (только для администраторов)"""
    
    if not request.user.is_admin_user:
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Бронирование не найдено'}, status=status.HTTP_404_NOT_FOUND)
    
    if booking.status != 'pending':
        return Response(
            {'error': 'Можно подтвердить только ожидающие бронирования'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    booking.confirm()
    
    return Response({'message': 'Бронирование подтверждено'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def booking_statistics(request):
    """Статистика бронирований (только для администраторов)"""
    
    if not request.user.is_admin_user:
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    
    stats = {
        'total_bookings': Booking.objects.count(),
        'today_bookings': Booking.objects.filter(date=today).count(),
        'pending_bookings': Booking.objects.filter(status='pending').count(),
        'confirmed_bookings': Booking.objects.filter(status='confirmed').count(),
        'active_bookings': Booking.objects.filter(status='active').count(),
        'completed_bookings': Booking.objects.filter(status='completed').count(),
        'cancelled_bookings': Booking.objects.filter(status='cancelled').count(),
    }
    
    return Response(stats)