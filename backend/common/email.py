"""
Shared HTML email builder and sender for Celnoia.
Usage:
    from common.email import send_html_email, btn, detail_rows

    send_html_email(
        subject="Your subject",
        to="user@example.com",
        heading="Hello there",
        body_lines=["First paragraph.", "Second paragraph."],
        cta_text="View Event",
        cta_url="https://celnoia.com/events/1",
        details={"Event": "Birthday Bash", "Date": "1 Jan 2026"},
    )
"""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


_PRIMARY = "#E8294A"
_BG = "#F9F7F5"
_CARD = "#FFFFFF"
_TEXT = "#111118"
_MUTED = "#6B7280"
_BORDER = "#E8E8EC"


def _base_template(subject: str, body_html: str, frontend_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:{_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:20px;">
              <span style="font-size:24px;font-weight:800;color:{_PRIMARY};letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">celnoia</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:{_CARD};border-radius:16px;padding:40px 40px 36px;border:1px solid {_BORDER};">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;font-size:12px;color:{_MUTED};line-height:1.7;">
              <p style="margin:0 0 4px;">© 2026 Celnoia. All rights reserved.</p>
              <p style="margin:0;">
                <a href="{frontend_url}/privacy" style="color:{_MUTED};text-decoration:underline;">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="{frontend_url}/terms" style="color:{_MUTED};text-decoration:underline;">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _heading(text: str) -> str:
    return (
        f'<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;'
        f'color:{_TEXT};letter-spacing:-0.3px;line-height:1.3;">{text}</h1>'
    )


def _paragraph(text: str) -> str:
    return (
        f'<p style="margin:0 0 16px;font-size:15px;color:{_MUTED};line-height:1.65;">{text}</p>'
    )


def _button(text: str, url: str) -> str:
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">'
        f'<tr><td style="border-radius:10px;background:{_PRIMARY};">'
        f'<a href="{url}" style="display:inline-block;padding:13px 28px;font-size:14px;'
        f'font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;'
        f'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">{text}</a>'
        f'</td></tr></table>'
    )


def _divider() -> str:
    return f'<hr style="border:none;border-top:1px solid {_BORDER};margin:24px 0;" />'


def _detail_table(details: dict) -> str:
    rows = ""
    items = list(details.items())
    for i, (label, value) in enumerate(items):
        bg = "#F9F7F5" if i % 2 == 0 else "#FFFFFF"
        rows += (
            f'<tr>'
            f'<td style="padding:10px 14px;font-size:13px;font-weight:600;color:{_TEXT};'
            f'background:{bg};border-radius:6px 0 0 6px;white-space:nowrap;">{label}</td>'
            f'<td style="padding:10px 14px;font-size:13px;color:{_MUTED};'
            f'background:{bg};border-radius:0 6px 6px 0;width:100%;">{value}</td>'
            f'</tr>'
        )
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="2" border="0" '
        f'style="width:100%;border-collapse:separate;border-spacing:0 3px;margin:16px 0 24px;">'
        f'{rows}</table>'
    )


def _signature() -> str:
    return (
        f'<p style="margin:24px 0 0;font-size:14px;color:{_MUTED};line-height:1.6;">'
        f'Warm regards,<br />'
        f'<span style="font-weight:600;color:{_TEXT};">The Celnoia Team</span>'
        f'</p>'
    )


def build_email_html(
    subject: str,
    heading: str,
    body_lines: list[str],
    frontend_url: str,
    cta_text: str = "",
    cta_url: str = "",
    details: dict | None = None,
    footer_note: str = "",
) -> str:
    parts = [_heading(heading)]
    for line in body_lines:
        parts.append(_paragraph(line))
    if details:
        parts.append(_divider())
        parts.append(_detail_table(details))
    if cta_text and cta_url:
        parts.append(_button(cta_text, cta_url))
    if footer_note:
        parts.append(_divider())
        parts.append(_paragraph(f'<small style="font-size:12px;">{footer_note}</small>'))
    parts.append(_signature())
    body_html = "".join(parts)
    return _base_template(subject, body_html, frontend_url)


def send_html_email(
    subject: str,
    to: str | list[str],
    heading: str,
    body_lines: list[str],
    cta_text: str = "",
    cta_url: str = "",
    details: dict | None = None,
    footer_note: str = "",
    fail_silently: bool = True,
) -> None:
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Celnoia <no-reply@celnoia.com>")
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    recipients = [to] if isinstance(to, str) else to

    plain_text = f"{heading}\n\n" + "\n\n".join(body_lines)
    if details:
        plain_text += "\n\n" + "\n".join(f"{k}: {v}" for k, v in details.items())
    if cta_url:
        plain_text += f"\n\n{cta_text}: {cta_url}"
    plain_text += "\n\n— The Celnoia Team"

    html = build_email_html(
        subject=subject,
        heading=heading,
        body_lines=body_lines,
        frontend_url=frontend_url,
        cta_text=cta_text,
        cta_url=cta_url,
        details=details,
        footer_note=footer_note,
    )

    msg = EmailMultiAlternatives(subject, plain_text, from_email, recipients)
    msg.attach_alternative(html, "text/html")
    msg.send(fail_silently=fail_silently)
