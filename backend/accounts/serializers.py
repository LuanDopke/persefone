from rest_framework import serializers


class AccessRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class AccessConfirmationSerializer(serializers.Serializer):
    token = serializers.CharField()
