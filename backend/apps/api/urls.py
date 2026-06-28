from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import RegisterView

app_name = "api"

urlpatterns = [
    # Auth (M0). Login uses email + password via SimpleJWT.
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    # Game endpoints (/me/next, /lessons/{id}, /attempts, /me/progress) are added
    # in milestones M2-M4. See docs/api.md.
]
