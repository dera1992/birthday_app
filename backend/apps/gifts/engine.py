from __future__ import annotations

from copy import deepcopy
from decimal import Decimal

from django.core.exceptions import ValidationError


SUPPORTED_FIELD_TYPES = {"text", "textarea", "select", "color", "number", "toggle"}

LEGACY_RENDERER_BY_CATEGORY = {
    "CARD": "CARD_TEMPLATE",
    "FLOWER": "FLOWER_GIFT",
    "MESSAGE": "ANIMATED_MESSAGE",
    "BADGE": "BADGE_GIFT",
    "VIDEO": "VIDEO_TEMPLATE",
}

RENDERER_ALIAS_MAP = {
    "LOTTIE_ANIMATION": "ANIMATED_MESSAGE",
    "SVG_BUNDLE": "FLOWER_GIFT",
    "AUDIO_DEDICATION": "ANIMATED_MESSAGE",
}

LEGACY_LAYOUT_BY_RENDERER = {
    "CARD_TEMPLATE": {
        "title": {"x": "50%", "y": "22%", "align": "center", "fontSize": 30, "fontWeight": 700, "color": "#ffffff"},
        "message": {"x": "50%", "y": "50%", "align": "center", "fontSize": 18, "fontWeight": 400, "color": "#ffffff", "maxWidth": "72%"},
        "sender": {"x": "50%", "y": "80%", "align": "center", "fontSize": 16, "fontWeight": 600, "color": "#ffffff"},
    },
    "FLOWER_GIFT": {
        "message": {"x": "50%", "y": "82%", "align": "center", "fontSize": 16, "fontWeight": 500, "color": "#ffffff", "maxWidth": "70%"},
        "sender": {"x": "50%", "y": "91%", "align": "center", "fontSize": 14, "fontWeight": 600, "color": "#ffffff"},
    },
    "ANIMATED_MESSAGE": {
        "message": {"x": "50%", "y": "58%", "align": "center", "fontSize": 20, "fontWeight": 600, "color": "#ffffff", "maxWidth": "70%"},
        "sender": {"x": "50%", "y": "83%", "align": "center", "fontSize": 14, "fontWeight": 500, "color": "#ffffff"},
    },
    "BADGE_GIFT": {
        "title": {"x": "50%", "y": "38%", "align": "center", "fontSize": 18, "fontWeight": 700, "color": "#ffffff"},
        "message": {"x": "50%", "y": "72%", "align": "center", "fontSize": 14, "fontWeight": 500, "color": "#ffffff", "maxWidth": "70%"},
    },
    "VIDEO_TEMPLATE": {
        "title": {"x": "50%", "y": "26%", "align": "center", "fontSize": 24, "fontWeight": 700, "color": "#ffffff"},
        "message": {"x": "50%", "y": "78%", "align": "center", "fontSize": 15, "fontWeight": 500, "color": "#ffffff", "maxWidth": "76%"},
    },
}

LEGACY_SCHEMA_BY_CATEGORY = {
    "CARD": {
        "fields": [
            {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
            {"name": "message", "type": "textarea", "label": "Birthday message", "required": False, "max_length": 300},
            {
                "name": "theme_color",
                "type": "select",
                "label": "Theme color",
                "required": False,
                "options": ["pink", "gold", "blue"],
            },
        ]
    },
    "FLOWER": {
        "fields": [
            {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
            {"name": "message", "type": "textarea", "label": "Card note", "required": False, "max_length": 200},
        ]
    },
    "MESSAGE": {
        "fields": [
            {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
            {"name": "message", "type": "textarea", "label": "Message", "required": True, "max_length": 500},
        ]
    },
    "BADGE": {
        "fields": [
            {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
            {"name": "message", "type": "text", "label": "Short dedication", "required": False, "max_length": 120},
        ]
    },
    "VIDEO": {
        "fields": [
            {"name": "sender_name", "type": "text", "label": "From", "required": False, "max_length": 80},
            {"name": "message", "type": "textarea", "label": "Video message", "required": False, "max_length": 300},
        ]
    },
}


def _merge_dicts(base: dict, override: dict) -> dict:
    merged = deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge_dicts(merged[key], value)
        else:
            merged[key] = deepcopy(value)
    return merged


def _coerce_schema(schema) -> dict:
    if schema in (None, ""):
        return {"fields": []}
    if not isinstance(schema, dict):
        raise ValidationError("Schema must be a JSON object.")
    fields = schema.get("fields", [])
    if not isinstance(fields, list):
        raise ValidationError("Schema fields must be a list.")
    return {"fields": fields}


def validate_customization_schema_definition(schema) -> dict:
    normalized = _coerce_schema(schema)
    validated_fields: list[dict] = []
    seen_names: set[str] = set()

    for index, field in enumerate(normalized["fields"]):
        if not isinstance(field, dict):
            raise ValidationError(f"Schema field at index {index} must be an object.")

        name = str(field.get("name", "")).strip()
        if not name:
            raise ValidationError(f"Schema field at index {index} must include a name.")
        if name in seen_names:
            raise ValidationError(f"Schema field name '{name}' is duplicated.")
        seen_names.add(name)

        field_type = str(field.get("type", "")).strip()
        if field_type not in SUPPORTED_FIELD_TYPES:
            raise ValidationError(
                f"Schema field '{name}' has unsupported type '{field_type}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_FIELD_TYPES))}."
            )

        label = str(field.get("label", "")).strip()
        if not label:
            raise ValidationError(f"Schema field '{name}' must include a label.")

        validated = {
            "name": name,
            "type": field_type,
            "label": label,
            "required": bool(field.get("required", False)),
        }

        if field_type in {"text", "textarea"} and field.get("max_length") is not None:
            try:
                max_length = int(field["max_length"])
            except (TypeError, ValueError) as exc:
                raise ValidationError(f"Schema field '{name}' max_length must be an integer.") from exc
            if max_length <= 0:
                raise ValidationError(f"Schema field '{name}' max_length must be greater than 0.")
            validated["max_length"] = max_length

        if field_type == "select":
            options = field.get("options")
            if not isinstance(options, list) or not options:
                raise ValidationError(f"Schema field '{name}' must include a non-empty options list.")
            cleaned_options = [str(option).strip() for option in options if str(option).strip()]
            if not cleaned_options:
                raise ValidationError(f"Schema field '{name}' must include at least one valid option.")
            validated["options"] = cleaned_options

        if field_type == "number":
            for key in ("min", "max"):
                if field.get(key) is not None:
                    try:
                        value = Decimal(str(field[key]))
                    except Exception as exc:
                        raise ValidationError(f"Schema field '{name}' {key} must be numeric.") from exc
                    validated[key] = float(value)

        if field.get("placeholder") is not None:
            validated["placeholder"] = str(field["placeholder"])

        validated_fields.append(validated)

    return {"fields": validated_fields}


def resolve_gift_renderer(product) -> str:
    if getattr(product, "renderer_type", ""):
        return RENDERER_ALIAS_MAP.get(product.renderer_type, product.renderer_type)
    template = getattr(product, "template", None)
    if template and template.renderer_type:
        return RENDERER_ALIAS_MAP.get(template.renderer_type, template.renderer_type)
    return LEGACY_RENDERER_BY_CATEGORY.get(product.category, "CARD_TEMPLATE")


def resolve_renderer_type(product) -> str:
    return resolve_gift_renderer(product)


def resolve_default_config(product) -> dict:
    template = getattr(product, "template", None)
    template_default = deepcopy(getattr(template, "default_config", None) or {})
    if not isinstance(template_default, dict):
        template_default = {}
    return template_default


def legacy_schema_for_product(product) -> dict:
    return deepcopy(LEGACY_SCHEMA_BY_CATEGORY.get(product.category, {"fields": []}))


def resolve_customization_schema(product) -> dict:
    raw_schema = getattr(product, "customization_schema", None) or getattr(getattr(product, "template", None), "config_schema", None)
    if raw_schema:
        return validate_customization_schema_definition(raw_schema)
    return legacy_schema_for_product(product)


def resolve_preview_asset_url(product) -> str:
    template = getattr(product, "template", None)
    if not template:
        return ""
    preview_asset = getattr(template, "preview_asset", None)
    if not preview_asset:
        return ""
    try:
        return preview_asset.url
    except ValueError:
        return ""


def resolve_catalog_preview_asset_url(product) -> str:
    template = getattr(product, "template", None)
    if not template:
        return resolve_preview_asset_url(product)
    catalog_preview_asset = getattr(template, "catalog_preview_asset", None)
    if catalog_preview_asset:
        try:
            return catalog_preview_asset.url
        except ValueError:
            pass
    return resolve_preview_asset_url(product)


def resolve_template_asset_url(product) -> str:
    template = getattr(product, "template", None)
    if not template:
        return ""
    template_asset = getattr(template, "template_asset", None)
    if not template_asset:
        return ""
    try:
        return template_asset.url
    except ValueError:
        return ""


def resolve_layout_config(product) -> dict:
    template = getattr(product, "template", None)
    template_default = deepcopy(getattr(template, "default_config", None) or {})
    template_layout = template_default.get("layout_config") or template_default.get("layout") or {}
    if not isinstance(template_layout, dict):
        template_layout = {}

    product_layout = deepcopy(getattr(product, "layout_config", None) or {})
    if not isinstance(product_layout, dict):
        product_layout = {}

    layout_config = _merge_dicts(template_layout, product_layout)
    if layout_config:
        return layout_config
    return deepcopy(LEGACY_LAYOUT_BY_RENDERER.get(resolve_renderer_type(product), {}))


def validate_customization_data(schema: dict, data) -> dict:
    normalized_schema = validate_customization_schema_definition(schema)
    if data in (None, ""):
        data = {}
    if not isinstance(data, dict):
        raise ValidationError("Customization data must be an object.")

    validated: dict = {}
    fields = normalized_schema["fields"]
    allowed_names = {field["name"] for field in fields}
    unexpected = sorted(set(data.keys()) - allowed_names)
    if unexpected:
        raise ValidationError(f"Unexpected customization fields: {', '.join(unexpected)}.")

    for field in fields:
        name = field["name"]
        value = data.get(name)

        if field.get("required") and value in (None, ""):
            raise ValidationError(f"Customization field '{name}' is required.")
        if value in (None, ""):
            continue

        field_type = field["type"]
        if field_type in {"text", "textarea"}:
            text = str(value).strip()
            max_length = field.get("max_length")
            if max_length and len(text) > max_length:
                raise ValidationError(f"Customization field '{name}' exceeds max length {max_length}.")
            validated[name] = text
        elif field_type == "select":
            choice = str(value).strip()
            if choice not in field.get("options", []):
                raise ValidationError(f"Customization field '{name}' must be one of the configured options.")
            validated[name] = choice
        elif field_type == "color":
            color = str(value).strip()
            if not color.startswith("#") or len(color) not in {4, 7}:
                raise ValidationError(f"Customization field '{name}' must be a valid hex color.")
            validated[name] = color
        elif field_type == "number":
            try:
                numeric = float(value)
            except (TypeError, ValueError) as exc:
                raise ValidationError(f"Customization field '{name}' must be numeric.") from exc
            if field.get("min") is not None and numeric < float(field["min"]):
                raise ValidationError(f"Customization field '{name}' must be at least {field['min']}.")
            if field.get("max") is not None and numeric > float(field["max"]):
                raise ValidationError(f"Customization field '{name}' must be at most {field['max']}.")
            validated[name] = numeric
        elif field_type == "toggle":
            if not isinstance(value, bool):
                raise ValidationError(f"Customization field '{name}' must be true or false.")
            validated[name] = value

    return validated


def map_legacy_fields_to_customization(product, payload: dict) -> dict:
    customization_data = payload.get("customization_data") or {}
    if customization_data:
        return customization_data

    schema = resolve_customization_schema(product)
    schema_fields = {field["name"] for field in schema.get("fields", [])}
    mapped: dict = {}

    from_name = str(payload.get("from_name", "") or "").strip()
    custom_message = str(payload.get("custom_message", "") or "").strip()

    if from_name:
        if "sender_name" in schema_fields:
            mapped["sender_name"] = from_name
        elif "from_name" in schema_fields:
            mapped["from_name"] = from_name

    if custom_message:
        if "message" in schema_fields:
            mapped["message"] = custom_message
        elif "custom_message" in schema_fields:
            mapped["custom_message"] = custom_message

    return mapped
