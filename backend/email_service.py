"""Resend email client — thin wrapper for transactional emails."""

import logging
import os

import resend

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")


def send(to: str, subject: str, html: str) -> str | None:
    """Send a transactional email. Returns the Resend email ID, or None on failure."""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set — skipping email to %s", to)
        return None
    try:
        result = resend.Emails.send(
            {
                "from": f"Pantry <{FROM_EMAIL}>",
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info("Email sent to %s (id=%s, subject=%s)", to, email_id, subject)
        return email_id
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return None
