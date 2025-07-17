from django.urls import path
from . import views

app_name = 'bookings'

urlpatterns = [
    path('', views.BookingListCreateView.as_view(), name='booking-list-create'),
    path('<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('available-slots/', views.available_time_slots, name='available-slots'),
    path('<int:booking_id>/cancel/', views.cancel_booking, name='cancel-booking'),
    path('<int:booking_id>/confirm/', views.confirm_booking, name='confirm-booking'),
    path('statistics/', views.booking_statistics, name='booking-statistics'),
]