"""
Base provider interface for AI image generation.

All providers must implement `generate_images` and return a list of dicts:
  [
    {
      "asset_url": str,       # Full URL to generated image
      "preview_url": str,     # URL to preview (may equal asset_url)
      "prompt_used": str,     # The actual prompt sent to the provider
      "provider_metadata": dict,  # Optional raw provider response metadata
      "option_index": int,    # 0-based index
    },
    ...
  ]
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class BaseImageProvider(ABC):
    """Abstract base class for AI image generation providers."""

    @abstractmethod
    def generate_images(self, prompt: str, count: int = 2, **kwargs) -> list[dict]:
        """
        Generate `count` images from `prompt`.

        Returns a list of option dicts (see module docstring).
        Raises ProviderError on failure.
        """
        raise NotImplementedError


class ProviderError(Exception):
    """Raised when a provider call fails."""
