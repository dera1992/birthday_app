from rest_framework import serializers

from apps.events.models import CuratedPack


class CuratedPackReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuratedPack
        fields = ("id", "name", "slug", "description", "icon_emoji", "defaults")
