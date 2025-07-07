from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, EmailVerificationSerializer

User = get_user_model()

class UserProfileView(generics.RetrieveUpdateAPIView):
    """Просмотр и редактирование профиля пользователя"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    """Подтверждение email по токену"""
    serializer = EmailVerificationSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        user = get_object_or_404(User, email_verification_token=token, email_verified=False)
        user.verify_email()
        
        return Response({
            'message': 'Email успешно подтвержден',
            'user_id': user.id
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_email_verification(request):
    """Повторная отправка email подтверждения"""
    user = request.user
    
    if user.email_verified:
        return Response({'message': 'Email уже подтвержден'}, status=status.HTTP_400_BAD_REQUEST)
    
    from .tasks import send_email_verification
    send_email_verification.delay(user.id)
    
    return Response({'message': 'Email подтверждения отправлен повторно'})
