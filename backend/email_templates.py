"""HTML templates for transactional emails."""

import os

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

_WRAPPER_START = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:8px;border:1px solid #E8E5DE;padding:40px;">
<tr><td>
"""

_WRAPPER_END = """\
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;padding:20px 0;">
<tr><td style="text-align:center;color:#6F6F73;font-size:12px;">
Pantry &mdash; Budget-smart meal planning<br>
<a href="{frontend}" style="color:#6F6F73;">pantryapp.co.uk</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
""".replace("{frontend}", FRONTEND_URL)

_HEADING = '<h1 style="margin:0 0 16px;font-size:24px;color:#0F0F10;font-weight:600;">{}</h1>'
_BODY = '<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3A3A3C;">{}</p>'
_BUTTON = (
    '<table cellpadding="0" cellspacing="0" style="margin:24px 0;">'
    '<tr><td style="background-color:#6B2737;border-radius:6px;padding:12px 28px;">'
    '<a href="{}" style="color:#FAFAF8;text-decoration:none;font-size:15px;font-weight:500;">{}</a>'
    '</td></tr></table>'
)
_DIVIDER = '<hr style="border:none;border-top:1px solid #E8E5DE;margin:24px 0;">'


def welcome(email: str) -> tuple[str, str]:
    """Returns (subject, html) for the welcome email."""
    subject = "Welcome to Pantry!"
    html = (
        _WRAPPER_START
        + _HEADING.format("Welcome to Pantry 🌿")
        + _BODY.format(
            "You're in. Pantry helps you plan a week of meals that fit your budget "
            "&mdash; no guesswork, no waste."
        )
        + _BODY.format(
            "Here's what you can do right now:"
        )
        + '<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.8;color:#3A3A3C;">'
        + "<li>Set your weekly budget and dietary preferences</li>"
        + "<li>Generate a 7-day meal plan in seconds</li>"
        + "<li>Get a ready-made shopping list</li>"
        + "</ul>"
        + _BUTTON.format(FRONTEND_URL, "Plan your first week")
        + _BODY.format(
            "Questions? Just reply to this email."
        )
        + _WRAPPER_END
    )
    return subject, html


def password_reset(email: str, reset_link: str) -> tuple[str, str]:
    """Returns (subject, html) for the password reset email."""
    subject = "Reset your Pantry password"
    html = (
        _WRAPPER_START
        + _HEADING.format("Reset your password")
        + _BODY.format(
            "We received a request to reset the password for your Pantry account. "
            "Click the button below to choose a new one."
        )
        + _BUTTON.format(reset_link, "Reset password")
        + _BODY.format(
            "This link expires in 1 hour. If you didn't request this, you can safely ignore this email."
        )
        + _WRAPPER_END
    )
    return subject, html


def subscription_receipt(
    email: str,
    tier: str,
    amount: str,
    period_end: str,
) -> tuple[str, str]:
    """Returns (subject, html) for the subscription receipt email."""
    subject = "Your Pantry Premium receipt"
    tier_label = "Monthly" if "monthly" in tier.lower() else "Yearly"
    html = (
        _WRAPPER_START
        + _HEADING.format("Thanks for subscribing!")
        + _BODY.format(
            f"You're now on Pantry Premium ({tier_label}). Here are your details:"
        )
        + '<table style="width:100%;font-size:14px;color:#3A3A3C;margin:16px 0;" cellpadding="8" cellspacing="0">'
        + f'<tr style="border-bottom:1px solid #E8E5DE;"><td style="color:#6F6F73;">Plan</td><td style="text-align:right;font-weight:500;">Premium {tier_label}</td></tr>'
        + f'<tr style="border-bottom:1px solid #E8E5DE;"><td style="color:#6F6F73;">Amount</td><td style="text-align:right;font-weight:500;">{amount}</td></tr>'
        + f'<tr><td style="color:#6F6F73;">Next billing date</td><td style="text-align:right;font-weight:500;">{period_end}</td></tr>'
        + "</table>"
        + _DIVIDER
        + _BODY.format(
            "You can manage your subscription any time from your account settings."
        )
        + _BUTTON.format(FRONTEND_URL, "Open Pantry")
        + _WRAPPER_END
    )
    return subject, html


def weekly_nudge(email: str, name: str | None = None) -> tuple[str, str]:
    """Returns (subject, html) for the weekly planning nudge email."""
    greeting = f"Hi {name}" if name else "Hi there"
    subject = "Time to plan your week!"
    html = (
        _WRAPPER_START
        + _HEADING.format("Your week starts here 🗓️")
        + _BODY.format(
            f"{greeting} &mdash; a new week means a fresh meal plan. "
            "Take 30 seconds to generate one and your shopping list is sorted."
        )
        + _BUTTON.format(FRONTEND_URL, "Plan this week")
        + _BODY.format(
            '<span style="font-size:13px;color:#6F6F73;">'
            "You're receiving this because you signed up for Pantry. "
            f'<a href="{FRONTEND_URL}" style="color:#6F6F73;">Unsubscribe</a>'
            "</span>"
        )
        + _WRAPPER_END
    )
    return subject, html
