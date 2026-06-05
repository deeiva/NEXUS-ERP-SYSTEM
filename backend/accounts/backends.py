from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # If username is passed as an email, use it
        if username is None:
            username = kwargs.get('email')
        
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            # If standard username auth failed, we might want to try looking up by email 
            # even if 'username' arg was used but contains an email string.
            try:
                 user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
