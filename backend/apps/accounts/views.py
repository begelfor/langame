from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PlayerSerializer, RegisterSerializer, tokens_for_user


class RegisterView(APIView):
    """Create a new account and player profile, returning JWT tokens."""

    permission_classes = [permissions.AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: None})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = tokens_for_user(user)
        return Response(
            {**tokens, "player": PlayerSerializer(user.player).data},
            status=status.HTTP_201_CREATED,
        )
