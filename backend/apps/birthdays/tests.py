import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from unittest.mock import patch

from apps.birthdays.models import BirthdayProfile, ReferralProduct, SupportContribution, SupportMessage, WishlistContribution, WishlistItem


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


class WishlistExtensionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(username="wishlist-owner", password="pw")
        self.client.force_authenticate(user=self.owner)
        # Birthday on March 1 so we can control whether it has passed
        self.profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="wl-test-profile",
            day=1,
            month=3,
            hide_year=True,
            bio="Bio",
            preferences={},
            visibility="PUBLIC",
        )

    # ---- helpers ----

    def _make_item(self, **kwargs):
        defaults = dict(
            profile=self.profile,
            title="AirPods",
            description="",
            currency="GBP",
        )
        defaults.update(kwargs)
        return WishlistItem.objects.create(**defaults)

    def _make_referral(self, **kwargs):
        defaults = dict(
            name="Sony Headphones",
            slug="sony-headphones",
            category="TECH",
            affiliate_url="https://example.com",
            is_active=True,
        )
        defaults.update(kwargs)
        return ReferralProduct.objects.create(**defaults)

    # ---- visibility tests ----

    def test_private_item_not_in_public_wishlist(self):
        self._make_item(visibility=WishlistItem.VISIBILITY_PRIVATE)
        resp = APIClient().get(f"/api/birthday-profile/{self.profile.slug}/public-wishlist")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 0)

    def test_public_item_visible_before_birthday(self):
        # Profile birthday is March 1. Simulate today as February 28 by using a past-year value
        # We can't mock date easily in a DB query, so we instead set the profile birthday to
        # a future date relative to today by computing it.
        today = datetime.date.today()
        future = today + datetime.timedelta(days=10)
        self.profile.day = future.day
        self.profile.month = future.month
        self.profile.save()
        self._make_item(visibility=WishlistItem.VISIBILITY_PUBLIC)
        resp = APIClient().get(f"/api/birthday-profile/{self.profile.slug}/public-wishlist")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 1)

    def test_public_item_hidden_after_birthday_passes(self):
        # Set birthday to a past date this year
        today = datetime.date.today()
        past = today - datetime.timedelta(days=2)
        self.profile.day = past.day
        self.profile.month = past.month
        self.profile.save()
        self._make_item(visibility=WishlistItem.VISIBILITY_PUBLIC)
        resp = APIClient().get(f"/api/birthday-profile/{self.profile.slug}/public-wishlist")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 0)

    # ---- creation with new fields ----

    def test_create_wishlist_item_with_visibility_and_source(self):
        resp = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/wishlist-items",
            {"title": "Book", "currency": "GBP", "visibility": "PRIVATE", "source_type": "CUSTOM"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["visibility"], "PRIVATE")

    def test_create_item_with_contribution_requires_target(self):
        resp = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/wishlist-items",
            {"title": "Book", "currency": "GBP", "allow_contributions": True},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_target_amount_max_100(self):
        resp = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/wishlist-items",
            {"title": "Laptop", "currency": "GBP", "allow_contributions": True, "target_amount": "150.00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_create_item_with_valid_contribution_target(self):
        resp = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/wishlist-items",
            {"title": "Flowers", "currency": "GBP", "allow_contributions": True, "target_amount": "50.00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data["allow_contributions"])
        self.assertEqual(data["target_amount"], "50.00")
        self.assertEqual(data["amount_raised"], "0.00")
        self.assertFalse(data["is_fully_funded"])

    # ---- contribution intent ----

    @patch("apps.payments.services.stripe.PaymentIntent.create")
    def test_contribution_intent_created(self, mock_create):
        mock_create.return_value = {"id": "pi_wl_test", "client_secret": "wl_secret"}
        item = self._make_item(allow_contributions=True, target_amount="50.00", currency="GBP")
        resp = APIClient().post(
            f"/api/wishlist-items/{item.id}/contributions/create-intent",
            {"amount": "20.00", "currency": "GBP", "contributor_name": "Ade"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["client_secret"], "wl_secret")
        self.assertEqual(WishlistContribution.objects.count(), 1)

    @patch("apps.payments.services.stripe.PaymentIntent.create")
    def test_contribution_rejected_when_disabled(self, mock_create):
        item = self._make_item(allow_contributions=False)
        resp = APIClient().post(
            f"/api/wishlist-items/{item.id}/contributions/create-intent",
            {"amount": "10.00", "currency": "GBP", "contributor_name": "Sam"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    @patch("apps.payments.services.stripe.PaymentIntent.create")
    def test_no_overfunding(self, mock_create):
        mock_create.return_value = {"id": "pi_over", "client_secret": "sec"}
        item = self._make_item(allow_contributions=True, target_amount="30.00", amount_raised="25.00", currency="GBP")
        resp = APIClient().post(
            f"/api/wishlist-items/{item.id}/contributions/create-intent",
            {"amount": "10.00", "currency": "GBP", "contributor_name": "Sam"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    @patch("apps.payments.services.stripe.PaymentIntent.create")
    def test_fully_funded_item_rejected(self, mock_create):
        item = self._make_item(allow_contributions=True, target_amount="50.00", amount_raised="50.00", currency="GBP")
        resp = APIClient().post(
            f"/api/wishlist-items/{item.id}/contributions/create-intent",
            {"amount": "1.00", "currency": "GBP", "contributor_name": "Sam"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    # ---- referral products ----

    def test_list_referral_products(self):
        self._make_referral(name="Prod A", slug="prod-a", category="TECH")
        self._make_referral(name="Prod B", slug="prod-b", category="BEAUTY")
        resp = APIClient().get("/api/referral-products")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 2)

    def test_filter_referral_products_by_category(self):
        self._make_referral(name="Tech", slug="tech", category="TECH")
        self._make_referral(name="Beauty", slug="beauty", category="BEAUTY")
        resp = APIClient().get("/api/referral-products?category=TECH")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 1)
        self.assertEqual(resp.json()[0]["category"], "TECH")

    def test_inactive_referral_products_excluded(self):
        self._make_referral(is_active=False)
        resp = APIClient().get("/api/referral-products")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 0)

    def test_referral_product_click_tracking(self):
        product = self._make_referral()
        self.assertEqual(product.click_count, 0)
        resp = self.client.post(f"/api/referral-products/{product.id}/click")
        self.assertEqual(resp.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.click_count, 1)

    # ---- serializer computed fields ----

    def test_remaining_amount_and_is_fully_funded_serializer(self):
        item = self._make_item(allow_contributions=True, target_amount="60.00", amount_raised="40.00", currency="GBP")
        # check via the profile detail endpoint
        detail = self.client.get(f"/api/birthday-profile/{self.profile.slug}").json()
        wl = next((d for d in detail["wishlist_items"] if d["id"] == item.id), None)
        self.assertIsNotNone(wl)
        self.assertEqual(float(wl["remaining_amount"]), 20.0)
        self.assertFalse(wl["is_fully_funded"])

    def test_is_fully_funded_true_when_raised_equals_target(self):
        item = self._make_item(allow_contributions=True, target_amount="50.00", amount_raised="50.00", currency="GBP")
        detail = self.client.get(f"/api/birthday-profile/{self.profile.slug}").json()
        wl = next((d for d in detail["wishlist_items"] if d["id"] == item.id), None)
        self.assertIsNotNone(wl)
        self.assertTrue(wl["is_fully_funded"])
