"""Web push notification sender — thin wrapper around pywebpush."""

import json
import logging
import os

from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {"sub": f"mailto:{os.environ.get('VAPID_CONTACT_EMAIL', 'hello@pantry.app')}"}


def send(endpoint: str, p256dh: str, auth: str, payload: dict) -> bool:
    """Send a push notification to a single subscription. Returns True on success."""
    if not VAPID_PRIVATE_KEY:
        logger.warning("VAPID_PRIVATE_KEY not set — skipping push to %s", endpoint[:60])
        return False
    try:
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return True
    except WebPushException as e:
        status = getattr(e, "response", None)
        status_code = status.status_code if status else None
        logger.warning("Push failed (status=%s) for endpoint %s: %s", status_code, endpoint[:60], e)
        return False
    except Exception:
        logger.exception("Unexpected push error for endpoint %s", endpoint[:60])
        return False
