from django.shortcuts import get_object_or_404

from apps.events.models import BirthdayEvent


def get_ratable_event(event_id: int) -> BirthdayEvent:
    return get_object_or_404(BirthdayEvent, pk=event_id)
