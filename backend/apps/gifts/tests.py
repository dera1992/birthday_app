from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.birthdays.models import BirthdayProfile
from apps.gifts.engine import validate_customization_data, validate_customization_schema_definition
from apps.gifts.models import AIGenerationJob, GiftProduct, GiftPurchase, GiftTemplate


class GiftEngineTests(TestCase):
    @staticmethod
    def _uploaded_image(name: str) -> SimpleUploadedFile:
        return SimpleUploadedFile(name=name, content=b"filecontent", content_type="image/png")

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(username="gift-owner", password="password123", email="owner@example.com")
        self.friend = User.objects.create_user(username="gift-friend", password="password123", email="friend@example.com")
        self.profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="gift-owner",
            day=12,
            month=8,
            hide_year=True,
            bio="Birthday profile",
            preferences={},
            visibility="PUBLIC",
        )
        self.template = GiftTemplate.objects.create(
            name="Confetti Birthday Card",
            slug="confetti-birthday-card",
            renderer_type=GiftTemplate.RendererType.CARD_TEMPLATE,
            template_asset=self._uploaded_image("confetti-card.png"),
            preview_asset=self._uploaded_image("confetti-preview.png"),
            config_schema={
                "fields": [
                    {"name": "recipient_name", "type": "text", "label": "Recipient Name", "required": True, "max_length": 80},
                    {"name": "message", "type": "textarea", "label": "Birthday Message", "required": True, "max_length": 300},
                    {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
                    {"name": "theme_color", "type": "select", "label": "Theme Color", "required": False, "options": ["pink", "gold", "blue"]},
                ]
            },
            default_config={
                "theme_color": "pink",
                "presentation": {
                    "preview_shell": "studio_card",
                    "aspect_ratio": "square",
                },
                "preview_defaults": {
                    "recipient_name": "Happy Birthday Emma",
                    "message": "Wishing you joy and laughter",
                    "sender_name": "From Alex",
                },
                "layout_config": {
                    "title": {"x": "50%", "y": "24%", "align": "center"},
                },
            },
            publication_status=GiftTemplate.PublicationStatus.PUBLISHED,
        )
        self.product = GiftProduct.objects.create(
            name="Luxury Gold Card",
            slug="luxury-gold-card",
            category=GiftProduct.Category.CARD,
            description="Premium card",
            price="6.99",
            currency="gbp",
            template=self.template,
            purchase_instructions="Keep it classy.",
        )
        self.legacy_product = GiftProduct.objects.create(
            name="Legacy Rose",
            slug="legacy-rose",
            category=GiftProduct.Category.FLOWER,
            description="Legacy gift",
            price="4.99",
            currency="gbp",
        )

    def test_schema_validation_success_and_failure(self):
        schema = validate_customization_schema_definition(self.template.config_schema)
        self.assertEqual(len(schema["fields"]), 4)

        valid = validate_customization_data(
            schema,
            {"recipient_name": "Ada", "message": "Happy birthday", "theme_color": "pink"},
        )
        self.assertEqual(valid["recipient_name"], "Ada")

        with self.assertRaisesMessage(Exception, "must be one of the configured options"):
            validate_customization_data(schema, {"recipient_name": "Ada", "message": "Hi", "theme_color": "silver"})

    def test_catalog_response_includes_resolved_schema(self):
        response = self.client.get("/api/gifts/products")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        current = next(item for item in payload if item["slug"] == self.product.slug)
        legacy = next(item for item in payload if item["slug"] == self.legacy_product.slug)
        self.assertEqual(current["renderer_type"], "CARD_TEMPLATE")
        self.assertEqual(current["template_asset_url"], self.template.template_asset.url)
        self.assertEqual(current["preview_asset_url"], self.template.preview_asset.url)
        self.assertEqual(current["default_config"]["presentation"]["preview_shell"], "studio_card")
        self.assertEqual(current["layout_config"]["title"]["y"], "24%")
        self.assertEqual(current["customization_schema"]["fields"][0]["name"], "recipient_name")
        self.assertEqual(current["purchase_instructions"], "Keep it classy.")
        self.assertTrue(current["allow_anonymous_sender"])
        self.assertEqual(legacy["renderer_type"], "FLOWER_GIFT")
        self.assertIn("layout_config", current)
        self.assertTrue(len(legacy["customization_schema"]["fields"]) >= 1)

    @patch("apps.gifts.services.stripe.PaymentIntent.create")
    def test_create_intent_stores_customization_data(self, payment_intent_create):
        payment_intent_create.return_value = {"id": "pi_gift_test", "client_secret": "gift_secret"}

        response = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/gifts/create-intent",
            {
                "product_slug": self.product.slug,
                "buyer_name": "Friend",
                "buyer_email": "friend@example.com",
                "visibility": "PUBLIC",
                "is_anonymous": False,
                "customization_data": {
                    "recipient_name": "Ada",
                    "message": "Happy birthday Ada",
                    "sender_name": "Mia",
                    "theme_color": "gold",
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        purchase = GiftPurchase.objects.get(product=self.product)
        self.assertEqual(purchase.customization_data["theme_color"], "gold")
        self.assertEqual(purchase.custom_message, "Happy birthday Ada")
        self.assertEqual(purchase.from_name, "Mia")
        self.assertFalse(purchase.is_anonymous)
        self.assertIn(f"/gifts/{purchase.id}?token=", response.json()["purchase"]["share_url"])
        self.assertIn(f"/api/gifts/purchases/{purchase.id}/download?token=", response.json()["purchase"]["download_url"])

    @patch("apps.gifts.services.stripe.PaymentIntent.create")
    def test_legacy_payload_still_maps_into_customization_data(self, payment_intent_create):
        payment_intent_create.return_value = {"id": "pi_gift_legacy", "client_secret": "gift_secret_legacy"}

        response = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/gifts/create-intent",
            {
                "product_slug": self.legacy_product.slug,
                "buyer_name": "Legacy Buyer",
                "buyer_email": "legacy@example.com",
                "from_name": "Legacy Sender",
                "custom_message": "A rose for you",
                "visibility": "PRIVATE",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        purchase = GiftPurchase.objects.get(product=self.legacy_product)
        self.assertEqual(purchase.customization_data["sender_name"], "Legacy Sender")
        self.assertEqual(purchase.customization_data["message"], "A rose for you")

    def test_gifts_endpoint_returns_renderer_metadata_for_owner(self):
        GiftPurchase.objects.create(
            product=self.product,
            celebrant=self.owner,
            birthday_profile=self.profile,
            buyer_user=self.friend,
            buyer_name="Friend",
            buyer_email="friend@example.com",
            custom_message="Message",
            from_name="Mia",
            customization_data={"recipient_name": "Ada", "message": "Message", "theme_color": "pink"},
            visibility=GiftPurchase.Visibility.PRIVATE,
            status=GiftPurchase.Status.SUCCEEDED,
            gross_amount="6.99",
            platform_amount="2.09",
            celebrant_amount="4.90",
        )
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(f"/api/birthday-profile/{self.profile.slug}/gifts")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["renderer_type"], "CARD_TEMPLATE")
        self.assertEqual(payload[0]["customization_data"]["theme_color"], "pink")
        self.assertIn("share_url", payload[0])
        self.assertIn("download_url", payload[0])

    def test_catalog_excludes_products_with_unpublished_templates(self):
        unpublished_template = GiftTemplate.objects.create(
            name="Draft Template",
            slug="draft-template",
            renderer_type=GiftTemplate.RendererType.CARD_TEMPLATE,
            publication_status=GiftTemplate.PublicationStatus.DRAFT,
        )
        unpublished_product = GiftProduct.objects.create(
            name="Draft Product",
            slug="draft-product",
            category=GiftProduct.Category.CARD,
            price="5.99",
            currency="gbp",
            template=unpublished_template,
        )

        response = self.client.get("/api/gifts/products")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(any(item["slug"] == unpublished_product.slug for item in payload))

    def test_purchase_detail_and_download_allow_token_access(self):
        purchase = GiftPurchase.objects.create(
            product=self.product,
            celebrant=self.owner,
            birthday_profile=self.profile,
            buyer_user=self.friend,
            buyer_name="Friend",
            buyer_email="friend@example.com",
            custom_message="Have a great day",
            from_name="Mia",
            customization_data={"recipient_name": "Ada", "message": "Have a great day", "theme_color": "pink"},
            visibility=GiftPurchase.Visibility.PRIVATE,
            status=GiftPurchase.Status.SUCCEEDED,
            gross_amount="6.99",
            platform_amount="2.09",
            celebrant_amount="4.90",
        )

        detail_response = self.client.get(f"/api/gifts/purchases/{purchase.id}?token={purchase.share_token}")
        download_response = self.client.get(f"/api/gifts/purchases/{purchase.id}/download?token={purchase.share_token}")

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["id"], purchase.id)
        self.assertEqual(download_response.status_code, 200)
        self.assertEqual(download_response["Content-Type"], "image/svg+xml")
        self.assertIn("attachment;", download_response["Content-Disposition"])


# ── AI Gift Tests ─────────────────────────────────────────────────────────────

_AI_PRODUCT_SCHEMA = {
    "fields": [
        {"name": "celebrant_name", "type": "text", "label": "Celebrant Name", "required": True, "max_length": 100},
        {"name": "message", "type": "textarea", "label": "Message", "required": True, "max_length": 300},
        {"name": "style", "type": "select", "label": "Style", "required": True, "options": ["Elegant", "Playful"]},
    ]
}


class AIGiftTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(username="ai-owner", password="pw", email="ai-owner@example.com")
        self.buyer = User.objects.create_user(username="ai-buyer", password="pw", email="ai-buyer@example.com")
        self.profile = BirthdayProfile.objects.create(
            user=self.owner,
            slug="ai-owner",
            day=1,
            month=6,
            hide_year=True,
            bio="",
            preferences={},
            visibility="PUBLIC",
        )
        self.ai_product = GiftProduct.objects.create(
            name="AI Birthday Card",
            slug="ai-birthday-card",
            category=GiftProduct.Category.CARD,
            description="AI generated card",
            price="7.99",
            currency="gbp",
            is_ai_generated_product=True,
            ai_generation_provider="NANO_BANANA",
            ai_generation_category="CARD",
            ai_option_count=2,
            customization_schema=_AI_PRODUCT_SCHEMA,
        )

    def _make_succeeded_ai_purchase(self, prompt_input=None):
        """Helper: create a SUCCEEDED AI purchase with generation_status=PENDING."""
        from apps.gifts.models import generate_share_token
        return GiftPurchase.objects.create(
            product=self.ai_product,
            celebrant=self.owner,
            birthday_profile=self.profile,
            buyer_user=self.buyer,
            buyer_name="Buyer",
            buyer_email="ai-buyer@example.com",
            status=GiftPurchase.Status.SUCCEEDED,
            generation_status=GiftPurchase.GenerationStatus.PENDING,
            gross_amount="7.99",
            platform_amount="2.39",
            celebrant_amount="5.60",
            ai_prompt_input=prompt_input or {"celebrant_name": "Ada", "message": "Happy birthday", "style": "Elegant"},
        )

    @patch("apps.gifts.services.stripe.PaymentIntent.create")
    def test_create_intent_stores_ai_prompt_input(self, mock_intent):
        mock_intent.return_value = {"id": "pi_ai_test", "client_secret": "ai_secret"}

        response = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/gifts/create-intent",
            {
                "product_slug": self.ai_product.slug,
                "buyer_name": "Buyer",
                "buyer_email": "buyer@example.com",
                "visibility": "PUBLIC",
                "is_anonymous": False,
                "ai_prompt_input": {
                    "celebrant_name": "Ada",
                    "sender_name": "Mia",
                    "message": "Happy birthday Ada!",
                    "style": "Elegant",
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        purchase = GiftPurchase.objects.get(product=self.ai_product)
        self.assertEqual(purchase.ai_prompt_input["celebrant_name"], "Ada")
        self.assertEqual(purchase.ai_prompt_input["style"], "Elegant")
        self.assertEqual(purchase.generation_status, GiftPurchase.GenerationStatus.PENDING)

    @patch("apps.gifts.services.stripe.PaymentIntent.create")
    @patch("apps.gifts.tasks.generate_ai_gift_options_task.delay")
    def test_payment_success_webhook_enqueues_generation_task(self, mock_delay, mock_intent):
        mock_intent.return_value = {"id": "pi_ai_wh", "client_secret": "ai_secret_wh"}

        # Create the purchase via API
        create_response = self.client.post(
            f"/api/birthday-profile/{self.profile.slug}/gifts/create-intent",
            {
                "product_slug": self.ai_product.slug,
                "buyer_name": "Buyer",
                "buyer_email": "buyer@example.com",
                "visibility": "PUBLIC",
                "is_anonymous": False,
                "ai_prompt_input": {"celebrant_name": "Ada", "message": "Happy birthday", "style": "Elegant"},
            },
            format="json",
        )
        purchase = GiftPurchase.objects.get(product=self.ai_product)

        # Simulate webhook
        from apps.payments.webhooks import handle_payment_intent_succeeded
        with patch("apps.wallet.services.credit_gift_earned"):
            handle_payment_intent_succeeded({
                "id": "pi_ai_wh",
                "metadata": {"type": "gift_purchase"},
                "latest_charge": "ch_test",
            })

        mock_delay.assert_called_once_with(purchase.id)

    def test_generation_task_generates_options(self):
        purchase = self._make_succeeded_ai_purchase()

        fake_options = [
            {"option_index": 0, "asset_url": "https://cdn.example.com/opt0.png", "preview_url": "https://cdn.example.com/opt0.png", "prompt_used": "test prompt", "provider_metadata": {}},
            {"option_index": 1, "asset_url": "https://cdn.example.com/opt1.png", "preview_url": "https://cdn.example.com/opt1.png", "prompt_used": "test prompt", "provider_metadata": {}},
        ]

        with patch("apps.gifts.ai_services.generate_ai_gift_options", return_value=fake_options):
            from apps.gifts.ai_services import run_generation_for_purchase
            updated = run_generation_for_purchase(purchase.id)

        self.assertEqual(updated.generation_status, GiftPurchase.GenerationStatus.GENERATED)
        self.assertEqual(len(updated.generated_options), 2)
        self.assertEqual(updated.generated_options[0]["asset_url"], "https://cdn.example.com/opt0.png")

    def test_generation_status_endpoint_returns_options(self):
        purchase = self._make_succeeded_ai_purchase()
        purchase.generation_status = GiftPurchase.GenerationStatus.GENERATED
        purchase.generated_options = [
            {"option_index": 0, "asset_url": "https://example.com/0.png", "preview_url": "", "prompt_used": "", "provider_metadata": {}},
            {"option_index": 1, "asset_url": "https://example.com/1.png", "preview_url": "", "prompt_used": "", "provider_metadata": {}},
        ]
        purchase.save()

        self.client.force_authenticate(user=self.buyer)
        response = self.client.get(f"/api/gifts/purchases/{purchase.id}/generation-status")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["generation_status"], "GENERATED")
        self.assertEqual(len(data["generated_options"]), 2)
        self.assertIsNone(data["selected_option_index"])

    def test_select_option_sets_asset_url_and_marks_downloadable(self):
        purchase = self._make_succeeded_ai_purchase()
        purchase.generation_status = GiftPurchase.GenerationStatus.GENERATED
        purchase.generated_options = [
            {"option_index": 0, "asset_url": "https://example.com/0.png", "preview_url": "", "prompt_used": "", "provider_metadata": {}},
            {"option_index": 1, "asset_url": "https://example.com/1.png", "preview_url": "", "prompt_used": "", "provider_metadata": {}},
        ]
        purchase.save()

        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            f"/api/gifts/purchases/{purchase.id}/select-option",
            {"option_index": 1},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        purchase.refresh_from_db()
        self.assertEqual(purchase.selected_option_index, 1)
        self.assertEqual(purchase.selected_asset_url, "https://example.com/1.png")
        self.assertTrue(purchase.is_downloadable)
        self.assertEqual(purchase.generation_status, GiftPurchase.GenerationStatus.SELECTED)

    def test_ai_gift_appears_in_birthday_gifts_wall(self):
        purchase = self._make_succeeded_ai_purchase()
        purchase.generation_status = GiftPurchase.GenerationStatus.SELECTED
        purchase.selected_asset_url = "https://example.com/final.png"
        purchase.ai_download_url = "https://example.com/final.png"
        purchase.is_downloadable = True
        purchase.save()

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/birthday-profile/{self.profile.slug}/gifts")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        gift = data[0]
        self.assertEqual(gift["selected_asset_url"], "https://example.com/final.png")
        self.assertTrue(gift["is_downloadable"])
        self.assertTrue(gift["product"]["is_ai_generated_product"])

    def test_download_endpoint_redirects_to_ai_asset_url(self):
        purchase = self._make_succeeded_ai_purchase()
        purchase.ai_download_url = "https://example.com/final.png"
        purchase.is_downloadable = True
        purchase.save()

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            f"/api/gifts/purchases/{purchase.id}/download",
            follow=False,
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "https://example.com/final.png")

    def test_catalog_includes_ai_product_fields(self):
        response = self.client.get("/api/gifts/products")

        self.assertEqual(response.status_code, 200)
        products = response.json()
        ai = next((p for p in products if p["slug"] == self.ai_product.slug), None)
        self.assertIsNotNone(ai)
        self.assertTrue(ai["is_ai_generated_product"])
        self.assertEqual(ai["ai_generation_category"], "CARD")
        self.assertEqual(ai["ai_option_count"], 2)

    def test_select_option_rejected_if_not_yet_generated(self):
        purchase = self._make_succeeded_ai_purchase()
        # generation_status is PENDING — options not ready

        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            f"/api/gifts/purchases/{purchase.id}/select-option",
            {"option_index": 0},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_non_ai_product_does_not_trigger_generation(self):
        regular_product = GiftProduct.objects.create(
            name="Regular Card",
            slug="regular-card",
            category=GiftProduct.Category.CARD,
            price="4.99",
            currency="gbp",
        )
        purchase = GiftPurchase.objects.create(
            product=regular_product,
            celebrant=self.owner,
            birthday_profile=self.profile,
            buyer_user=self.buyer,
            buyer_name="Buyer",
            buyer_email="buyer@example.com",
            status=GiftPurchase.Status.SUCCEEDED,
            gross_amount="4.99",
            platform_amount="1.49",
            celebrant_amount="3.50",
        )
        self.assertEqual(purchase.generation_status, GiftPurchase.GenerationStatus.NOT_REQUIRED)
        self.assertFalse(purchase.is_downloadable)
