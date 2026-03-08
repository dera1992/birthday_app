from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from unittest.mock import patch

from apps.birthdays.models import BirthdayProfile, SupportContribution, SupportMessage, WishlistItem


class BirthdayApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(username="birthday-owner", password="password123")
        self.client.force_authenticate(user=self.owner)

    def test_profile_create_read_and_update(self):
        create = self.client.post(
            "/api/birthday-profile",
            {
                "day": 14,
                "month": 7,
                "hide_year": True,
                "bio": "Birthday week",
                "preferences": {"theme": "brunch"},
                "social_links": {"instagram": "https://instagram.com/birthday.owner"},
                "gender": "FEMALE",
                "date_of_birth": "1995-04-14",
                "marital_status": "SINGLE",
                "occupation": "Designer",
                "visibility": "PUBLIC",
            },
            format="json",
        )
        slug = create.json()["slug"]
        get_response = self.client.get(f"/api/birthday-profile/{slug}")
        patch_response = self.client.patch(
            f"/api/birthday-profile/{slug}",
            {
                "bio": "Updated bio",
                "social_links": {"instagram": "https://instagram.com/updated.owner"},
                "occupation": "Art Director",
            },
            format="json",
        )

        self.assertEqual(create.status_code, 201)
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["bio"], "Updated bio")
        self.assertEqual(patch_response.json()["social_links"]["instagram"], "https://instagram.com/updated.owner")
        self.assertEqual(patch_response.json()["gender"], "FEMALE")
        self.assertEqual(patch_response.json()["occupation"], "Art Director")
        self.assertTrue(create.json()["slug"])

    @patch("apps.payments.services.stripe.PaymentIntent.create")
    def test_wishlist_message_and_contribution_flows(self, payment_intent_create):
        payment_intent_create.return_value = {"id": "pi_support_test", "client_secret": "support_secret"}
        profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="wishlist-owner",
            day=10,
            month=5,
            hide_year=True,
            bio="Bio",
            preferences={},
            visibility="PUBLIC",
        )
        item_response = self.client.post(
            f"/api/birthday-profile/{profile.slug}/wishlist-items",
            {"title": "Flowers", "description": "Bouquet", "currency": "GBP"},
            format="json",
        )
        item_id = item_response.json()["id"]
        patch_item = self.client.patch(
            f"/api/wishlist-items/{item_id}",
            {"description": "Rose bouquet"},
            format="json",
        )
        reserve = APIClient().post(
            f"/api/wishlist-items/{item_id}/reserve",
            {"reserver_name": "Friend", "reserver_email": "friend@example.com"},
            format="json",
        )
        message = APIClient().post(
            f"/api/birthday-profile/{profile.slug}/messages",
            {"sender_name": "Sam", "body": "Happy birthday"},
            format="json",
        )
        approve = self.client.post(
            f"/api/support-messages/{SupportMessage.objects.first().id}/approve",
            format="json",
        )
        messages_public = APIClient().get(f"/api/birthday-profile/{profile.slug}/messages")
        contribution = self.client.post(
            f"/api/birthday-profile/{profile.slug}/contributions/create-intent",
            {"amount": "20.00", "currency": "GBP", "supporter_name": "Owner"},
            format="json",
        )

        self.assertEqual(item_response.status_code, 201)
        self.assertEqual(patch_item.status_code, 200)
        self.assertEqual(reserve.status_code, 201)
        self.assertEqual(message.status_code, 201)
        self.assertEqual(approve.status_code, 200)
        self.assertEqual(messages_public.status_code, 200)
        self.assertEqual(contribution.status_code, 201)
        self.assertTrue(WishlistItem.objects.get(pk=item_id).is_reserved)
        self.assertEqual(len(messages_public.json()), 1)
        self.assertEqual(SupportContribution.objects.count(), 1)

    def test_private_profile_hidden_from_non_owner(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="private-profile",
            day=10,
            month=5,
            hide_year=True,
            bio="Secret",
            preferences={},
            visibility=BirthdayProfile.VISIBILITY_PRIVATE,
        )

        response = APIClient().get(f"/api/birthday-profile/{profile.slug}")

        self.assertEqual(response.status_code, 403)

    def _make_profile_and_approved_message(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="react-reply-profile",
            day=1, month=1, hide_year=True, bio="Bio", preferences={}, visibility="PUBLIC",
        )
        msg = SupportMessage.objects.create(
            profile=profile,
            sender_name="Sam",
            body="Happy birthday!",
            moderation_status=SupportMessage.MODERATION_APPROVED,
        )
        return profile, msg

    def test_owner_cannot_send_message_to_own_profile(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner, slug="self-message-profile", day=1, month=1, hide_year=True, bio="Bio", preferences={}, visibility="PUBLIC",
        )
        response = self.client.post(
            f"/api/birthday-profile/{profile.slug}/messages",
            {"sender_name": "Me", "body": "Happy birthday to me"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_celebrant_can_react_to_approved_message(self):
        profile, msg = self._make_profile_and_approved_message()
        response = self.client.post(f"/api/support-messages/{msg.id}/react", {"reaction": "❤️"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["celebrant_reaction"], "❤️")
        msg.refresh_from_db()
        self.assertEqual(msg.celebrant_reaction, "❤️")

    def test_celebrant_can_reply_to_approved_message(self):
        profile, msg = self._make_profile_and_approved_message()
        response = self.client.post(f"/api/support-messages/{msg.id}/reply", {"reply_text": "Thank you!"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reply_text"], "Thank you!")
        self.assertIsNotNone(response.json()["reply_created_at"])
        msg.refresh_from_db()
        self.assertEqual(msg.reply_text, "Thank you!")
        self.assertIsNotNone(msg.reply_created_at)

    def test_react_rejected_if_message_not_approved(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner, slug="pending-msg-profile", day=1, month=1, hide_year=True, bio="Bio", preferences={}, visibility="PUBLIC",
        )
        msg = SupportMessage.objects.create(
            profile=profile, sender_name="Sam", body="Hello", moderation_status=SupportMessage.MODERATION_PENDING,
        )
        response = self.client.post(f"/api/support-messages/{msg.id}/react", {"reaction": "🎉"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_reply_rejected_if_message_not_approved(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner, slug="pending-reply-profile", day=1, month=1, hide_year=True, bio="Bio", preferences={}, visibility="PUBLIC",
        )
        msg = SupportMessage.objects.create(
            profile=profile, sender_name="Sam", body="Hello", moderation_status=SupportMessage.MODERATION_PENDING,
        )
        response = self.client.post(f"/api/support-messages/{msg.id}/reply", {"reply_text": "Thanks!"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_non_owner_cannot_react(self):
        profile, msg = self._make_profile_and_approved_message()
        stranger = User.objects.create_user(username="stranger-react", password="pw")
        stranger_client = APIClient()
        stranger_client.force_authenticate(user=stranger)
        response = stranger_client.post(f"/api/support-messages/{msg.id}/react", {"reaction": "❤️"}, format="json")
        self.assertEqual(response.status_code, 404)  # get_support_message_for_owner returns 404 for non-owners

    def test_non_owner_cannot_reply(self):
        profile, msg = self._make_profile_and_approved_message()
        stranger = User.objects.create_user(username="stranger-reply", password="pw")
        stranger_client = APIClient()
        stranger_client.force_authenticate(user=stranger)
        response = stranger_client.post(f"/api/support-messages/{msg.id}/reply", {"reply_text": "Thanks!"}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_messages_ordered_newest_first(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner, slug="ordering-profile", day=1, month=1, hide_year=True, bio="Bio", preferences={}, visibility="PUBLIC",
        )
        msg1 = SupportMessage.objects.create(
            profile=profile, sender_name="First", body="First message", moderation_status=SupportMessage.MODERATION_APPROVED,
        )
        msg2 = SupportMessage.objects.create(
            profile=profile, sender_name="Second", body="Second message", moderation_status=SupportMessage.MODERATION_APPROVED,
        )
        response = APIClient().get(f"/api/birthday-profile/{profile.slug}/messages")
        self.assertEqual(response.status_code, 200)
        ids = [m["id"] for m in response.json()]
        self.assertEqual(ids, [msg2.id, msg1.id])

    def test_reaction_and_reply_visible_in_public_response(self):
        profile, msg = self._make_profile_and_approved_message()
        msg.celebrant_reaction = "🎂"
        msg.reply_text = "Thank you so much!"
        from django.utils import timezone
        msg.reply_created_at = timezone.now()
        msg.save()
        response = APIClient().get(f"/api/birthday-profile/{profile.slug}/messages")
        self.assertEqual(response.status_code, 200)
        data = response.json()[0]
        self.assertEqual(data["celebrant_reaction"], "🎂")
        self.assertEqual(data["reply_text"], "Thank you so much!")
        self.assertIsNotNone(data["reply_created_at"])

    def test_owner_can_list_their_support_contributions(self):
        profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="owner-contributions",
            day=10,
            month=5,
            hide_year=True,
            bio="Bio",
            preferences={},
            visibility="PUBLIC",
        )
        SupportContribution.objects.create(
            profile=profile,
            amount="25.00",
            currency="GBP",
            supporter_name="Friend One",
            supporter_email="friend1@example.com",
        )
        SupportContribution.objects.create(
            profile=profile,
            amount="35.00",
            currency="GBP",
            supporter_name="Friend Two",
            supporter_email="friend2@example.com",
        )

        response = self.client.get(f"/api/birthday-profile/{profile.slug}/contributions")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(response.json()[0]["supporter_name"], "Friend Two")
