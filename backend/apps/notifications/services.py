from apps.notifications.models import Notification


def create_notification(user, type: str, title: str, body: str = "", action_url: str = "") -> Notification:
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        body=body,
        action_url=action_url,
    )
