from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.contrib import admin
from django.urls import path, include   # ← IMPORTANT
from accounts.views import home
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

schema_view = get_schema_view(
    openapi.Info(
        title="ERP API",
        default_version='v1',
        description="ERP Backend APIs",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)
from accounts.tokens import CustomTokenObtainPairView  # Custom Login View

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),

    path('api/accounts/', include('accounts.urls')),
    path('api/', include('employees.urls')),
    path('api/hr/', include('hr.urls')),

    path('api/login/', CustomTokenObtainPairView.as_view()),
    path('api/refresh/', TokenRefreshView.as_view()),

    # SWAGGER
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0)),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0)),
]
