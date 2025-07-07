from django.urls import path
from . import views

app_name = 'bookings'

urlpatterns = [
    # Основные операции с бронированиями
    path('', views.BookingListCreateView.as_view(), name='booking-list-create'),
    path('<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    
    # Управление бронированиями
    path('<int:pk>/confirm/', views.confirm_booking, name='confirm-booking'),
    path('<int:pk>/cancel/', views.cancel_booking, name='cancel-booking'),
    
    # Email подтверждение
    path('confirm-email/', views.confirm_email, name='confirm-email'),
    
    # Доступные слоты
    path('available-slots/', views.available_time_slots, name='available-slots'),
    
    # Платежи
    path('<int:booking_id>/payment/', views.create_payment, name='create-payment'),
    
    # Ст��тистика
    path('statistics/', views.booking_statistics, name='booking-statistics'),
]
