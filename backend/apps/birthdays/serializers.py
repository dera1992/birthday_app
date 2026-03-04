from apps.birthdays.read_serializers import (
    BirthdayProfileReadSerializer,
    SupportContributionReadSerializer,
    SupportMessageReadSerializer,
    WishlistItemReadSerializer,
    WishlistReservationReadSerializer,
)
from apps.birthdays.write_serializers import (
    BirthdayProfileWriteSerializer,
    SupportContributionWriteSerializer,
    SupportMessageWriteSerializer,
    WishlistItemWriteSerializer,
    WishlistReservationWriteSerializer,
)


BirthdayProfileSerializer = BirthdayProfileReadSerializer
WishlistItemSerializer = WishlistItemReadSerializer
WishlistReservationSerializer = WishlistReservationReadSerializer
SupportMessageSerializer = SupportMessageReadSerializer
SupportContributionSerializer = SupportContributionReadSerializer
