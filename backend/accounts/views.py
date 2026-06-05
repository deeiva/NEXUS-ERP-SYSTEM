# accounts/views.py
from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.views import APIView
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from accounts.permissions import IsAdmin, IsHR, IsHRorAdmin, IsAnyUser, IsProfileOwnerOrAdmin

# ----------------- HOME -----------------
def home(request):
    return HttpResponse("ERP Backend Running")

from rest_framework.parsers import MultiPartParser, FormParser

# ----------------- REGISTRATION -----------------
class RegisterView(generics.CreateAPIView):
    """
    Single registration endpoint:
    - Admin can create HR only
    - HR can create Employee only
    """
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        requested_role = request.data.get('role')

        # ---------- PERMISSION CHECK ----------
        if request.user.role == 'ADMIN':
            if requested_role not in ['HR', 'EMPLOYEE']:
                return Response({"error": "Admin can only create HR or Employee accounts"}, status=400)
        elif request.user.role == 'HR':
            if requested_role != 'EMPLOYEE':
                return Response({"error": "HR can only create Employee accounts"}, status=400)
        else:
            return Response({"error": "You do not have permission to create users"}, status=403)

        # ---------- CREATE USER ----------
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            "message": f"{requested_role} registered successfully",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

# ----------------- USER LIST -----------------
class AdminUserListView(generics.ListAPIView):
    """
    Admin can view all HR + Employees
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsHRorAdmin]

    def get_queryset(self):
        return User.objects.filter(role__in=['HR', 'EMPLOYEE'])


class HRUserListView(generics.ListAPIView):
    """
    Admin and HR can view Employees only
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsHRorAdmin]

    def get_queryset(self):
        return User.objects.filter(role='EMPLOYEE')


# ----------------- USER DETAIL -----------------
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin can view/update/delete any HR or Employee
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAdmin]
    lookup_field = 'username'
    lookup_url_kwarg = 'username'

# ----------------- CURRENT USER -----------------
class CurrentUserView(APIView):
    """
    Returns the currently logged-in user's profile and role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
