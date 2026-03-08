from __future__ import annotations

import base64
import mimetypes
import textwrap
from html import escape

from apps.gifts.engine import resolve_layout_config


ASPECT_RATIO_BY_RENDERER = {
    "CARD_TEMPLATE": (1080, 1080),
    "FLOWER_GIFT": (1080, 1350),
    "ANIMATED_MESSAGE": (1080, 1080),
    "BADGE_GIFT": (1080, 1080),
    "VIDEO_TEMPLATE": (1280, 720),
}


def _inline_asset_data_uri(field_file) -> str:
    if not field_file:
        return ""
    try:
        with field_file.open("rb") as handle:
            encoded = base64.b64encode(handle.read()).decode("ascii")
    except Exception:
        return ""
    mime_type, _ = mimetypes.guess_type(getattr(field_file, "name", ""))
    mime_type = mime_type or "image/png"
    return f"data:{mime_type};base64,{encoded}"


def _split_lines(text: str, max_chars: int) -> list[str]:
    content = " ".join(str(text or "").split())
    if not content:
        return []
    return textwrap.wrap(content, width=max_chars, break_long_words=False) or [content]


def _svg_text_block(*, text: str, x: str, y: str, align: str, font_size: int, font_weight: int, color: str, max_width: str) -> str:
    lines = _split_lines(text, 18 if font_size >= 28 else 28)
    if not lines:
        return ""

    anchor = {"left": "start", "center": "middle", "right": "end"}.get(align, "middle")
    start_dx = {"left": "0", "center": "0", "right": "0"}.get(align, "0")
    width_value = max_width if isinstance(max_width, str) else "70%"
    tspan_markup = "".join(
        f'<tspan x="{escape(x)}" dx="{start_dx}" dy="{font_size * (1.25 if index else 0)}">{escape(line)}</tspan>'
        for index, line in enumerate(lines)
    )
    return (
        f'<text x="{escape(x)}" y="{escape(y)}" text-anchor="{anchor}" '
        f'font-family="Inter, Arial, sans-serif" font-size="{font_size}" font-weight="{font_weight}" '
        f'fill="{escape(color)}" style="max-width:{escape(width_value)}">{tspan_markup}</text>'
    )


def resolve_purchase_text(purchase) -> dict[str, str]:
    data = purchase.customization_data or {}
    recipient_name = str(data.get("recipient_name") or data.get("title") or "Happy Birthday").strip()
    message = str(data.get("message") or purchase.custom_message or "").strip()
    sender_name = str(data.get("sender_name") or data.get("from_name") or purchase.from_name or "").strip()
    if sender_name and not sender_name.lower().startswith("from "):
        sender_name = f"From {sender_name}"
    return {
        "title": recipient_name or "Happy Birthday",
        "message": message or "Wishing you joy and laughter",
        "sender": sender_name or "From someone special",
    }


def build_purchase_snapshot_svg(purchase) -> str:
    renderer_type = purchase.product.renderer_type or getattr(getattr(purchase.product, "template", None), "renderer_type", "") or "CARD_TEMPLATE"
    width, height = ASPECT_RATIO_BY_RENDERER.get(renderer_type, (1080, 1080))
    layout = resolve_layout_config(purchase.product)
    text = resolve_purchase_text(purchase)

    template = getattr(purchase.product, "template", None)
    background_data_uri = ""
    if template:
        background_data_uri = _inline_asset_data_uri(getattr(template, "template_asset", None)) or _inline_asset_data_uri(getattr(template, "preview_asset", None))

    title_cfg = layout.get("title", {}) if isinstance(layout, dict) else {}
    message_cfg = layout.get("message", {}) if isinstance(layout, dict) else {}
    sender_cfg = layout.get("sender", {}) if isinstance(layout, dict) else {}

    background_markup = (
        f'<image href="{background_data_uri}" x="0" y="0" width="{width}" height="{height}" preserveAspectRatio="xMidYMid slice" />'
        if background_data_uri
        else '<rect width="100%" height="100%" fill="url(#fallback)" />'
    )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <linearGradient id="fallback" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.14" />
    </filter>
  </defs>
  <rect width="100%" height="100%" rx="40" fill="#ffffff" />
  <g filter="url(#softShadow)">
    <clipPath id="cardClip">
      <rect x="28" y="28" width="{width - 56}" height="{height - 56}" rx="30" />
    </clipPath>
    <g clip-path="url(#cardClip)">
      {background_markup}
      <rect x="0" y="0" width="{width}" height="{height}" fill="#0f172a" fill-opacity="0.10" />
      {_svg_text_block(
          text=text["title"],
          x=str(title_cfg.get("x", "50%")),
          y=str(title_cfg.get("y", "22%")),
          align=str(title_cfg.get("align", "center")),
          font_size=int(title_cfg.get("fontSize", 30)),
          font_weight=int(title_cfg.get("fontWeight", 700)),
          color=str(title_cfg.get("color", "#ffffff")),
          max_width=str(title_cfg.get("maxWidth", "70%")),
      )}
      {_svg_text_block(
          text=text["message"],
          x=str(message_cfg.get("x", "50%")),
          y=str(message_cfg.get("y", "50%")),
          align=str(message_cfg.get("align", "center")),
          font_size=int(message_cfg.get("fontSize", 18)),
          font_weight=int(message_cfg.get("fontWeight", 500)),
          color=str(message_cfg.get("color", "#ffffff")),
          max_width=str(message_cfg.get("maxWidth", "72%")),
      )}
      {_svg_text_block(
          text=text["sender"],
          x=str(sender_cfg.get("x", "50%")),
          y=str(sender_cfg.get("y", "80%")),
          align=str(sender_cfg.get("align", "center")),
          font_size=int(sender_cfg.get("fontSize", 16)),
          font_weight=int(sender_cfg.get("fontWeight", 600)),
          color=str(sender_cfg.get("color", "#ffffff")),
          max_width=str(sender_cfg.get("maxWidth", "60%")),
      )}
    </g>
  </g>
</svg>"""
