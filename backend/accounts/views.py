from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AccessConfirmationSerializer, AccessRequestSerializer
from .services import confirm_access, request_access

NEUTRAL_MESSAGE = 'Se possível, enviaremos um link de acesso para este endereço.'


class AccessRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AccessRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = request_access(serializer.validated_data['email'])
        if result == 'delivery_failed':
            return Response(
                {'detail': 'Não foi possível enviar o link agora. Tente novamente.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({'detail': NEUTRAL_MESSAGE}, status=status.HTTP_202_ACCEPTED)


class AccessConfirmationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AccessConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = confirm_access(serializer.validated_data['token'])
        if payload is None:
            return Response({'detail': 'Este link não é válido. Solicite um novo acesso.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(payload)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)
