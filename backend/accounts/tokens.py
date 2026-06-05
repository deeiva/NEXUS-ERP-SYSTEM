from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate # Import django auth
from rest_framework import exceptions
from django.db.models import Q
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the username field optional so we can submit email instead
        self.fields[self.username_field].required = False

    def validate(self, attrs):
        # Determine if the user sent 'email' or 'username'
        password = attrs.get("password")
        username = attrs.get("username")
        email = attrs.get("email") or self.initial_data.get('email')

        if email:
            username = email
        
        if not username or not password:
             raise exceptions.AuthenticationFailed('Must include "username" or "email" and "password".')

        # Find user by email or username
        user = User.objects.filter(Q(username=username) | Q(email=username)).first()

        if not user:
            raise exceptions.AuthenticationFailed('this user doesnt exist')

        if not user.check_password(password):
            raise exceptions.AuthenticationFailed('incorrect password')

        if not user.is_active:
            raise exceptions.AuthenticationFailed('User account is disabled.')

        # If we reach here, credentials are correct
        self.user = user
        
        # Get tokens
        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Add custom data to the response
        data['role'] = user.role
        data['username'] = user.username
        data['email'] = user.email
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
