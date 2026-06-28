from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import RegisterView

from .views import AttemptsView, LessonDetailView, NextView, ProgressView

app_name = "api"

urlpatterns = [
    # Auth (M0). Login uses email + password via SimpleJWT.
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    # Playable loop (M2).
    path("me/next", NextView.as_view(), name="me-next"),
    path("lessons/<int:pk>", LessonDetailView.as_view(), name="lesson-detail"),
    path("attempts", AttemptsView.as_view(), name="attempts"),
    # Progress (M3).
    path("me/progress", ProgressView.as_view(), name="me-progress"),
]
