from rest_framework import serializers

from drf_spectacular.utils import inline_serializer


def detail_response_serializer(name: str = "DetailResponse"):
    return inline_serializer(
        name=name,
        fields={
            "detail": serializers.CharField(),
        },
    )
