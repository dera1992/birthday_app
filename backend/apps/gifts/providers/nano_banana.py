"""
Nano Banana image generation provider.

Configuration (env vars):
  NANO_BANANA_API_KEY      — required
  NANO_BANANA_MODEL        — optional, defaults to "flux-schnell"
  NANO_BANANA_BASE_URL     — optional, defaults to https://api.nanabanana.ai/v1

The provider calls POST /images/generations and returns a list of image objects.
API is expected to follow an OpenAI-compatible images endpoint contract:
  {
    "data": [
      { "url": "...", ... },
      ...
    ]
  }

If the actual Nano Banana API differs, update `_parse_response` accordingly.

Uses stdlib urllib so no extra dependency is required.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from apps.gifts.providers.base import BaseImageProvider, ProviderError


_DEFAULT_BASE_URL = "https://api.nanabanana.ai/v1"
_DEFAULT_MODEL = "flux-schnell"
_REQUEST_TIMEOUT = 120  # seconds


class NanaBananaProvider(BaseImageProvider):
    def __init__(self):
        self.api_key: str = os.environ.get("NANO_BANANA_API_KEY", "")
        self.model: str = os.environ.get("NANO_BANANA_MODEL", _DEFAULT_MODEL)
        self.base_url: str = os.environ.get("NANO_BANANA_BASE_URL", _DEFAULT_BASE_URL).rstrip("/")

    def generate_images(self, prompt: str, count: int = 2, **kwargs) -> list[dict]:
        if not self.api_key:
            raise ProviderError("NANO_BANANA_API_KEY is not configured.")

        payload = json.dumps({
            "model": self.model,
            "prompt": prompt,
            "n": count,
            "size": kwargs.get("size", "1024x1024"),
            "response_format": "url",
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.base_url}/images/generations",
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise ProviderError(f"Nano Banana API error {exc.code}: {body}") from exc
        except urllib.error.URLError as exc:
            raise ProviderError(f"Nano Banana request failed: {exc.reason}") from exc
        except Exception as exc:
            raise ProviderError(f"Nano Banana unexpected error: {exc}") from exc

        return self._parse_response(data, prompt, count)

    def _parse_response(self, data: dict, prompt: str, count: int) -> list[dict]:
        images = data.get("data") or []
        options = []
        for index, image in enumerate(images[:count]):
            url = image.get("url", "")
            options.append(
                {
                    "option_index": index,
                    "asset_url": url,
                    "preview_url": url,
                    "prompt_used": prompt,
                    "provider_metadata": {k: v for k, v in image.items() if k != "url"},
                }
            )
        # Pad with placeholders if provider returned fewer than requested
        while len(options) < count:
            options.append(
                {
                    "option_index": len(options),
                    "asset_url": "",
                    "preview_url": "",
                    "prompt_used": prompt,
                    "provider_metadata": {},
                }
            )
        return options


def get_nano_banana_provider() -> NanaBananaProvider:
    return NanaBananaProvider()
