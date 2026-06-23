"""Generate VAPID keys for web push notifications.

Run once, then set the output as environment variables:
  VAPID_PRIVATE_KEY  — backend only (URL-safe base64)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY — frontend (URL-safe base64, exposed to browser)
"""

import base64

from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from py_vapid import Vapid

vapid = Vapid()
vapid.generate_keys()

raw_priv = vapid.private_key.private_numbers().private_value.to_bytes(32, "big")
priv_b64 = base64.urlsafe_b64encode(raw_priv).rstrip(b"=").decode()

pub_raw = vapid.public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
pub_b64 = base64.urlsafe_b64encode(pub_raw).rstrip(b"=").decode()

print("# Add these to your .env files\n")
print("# Backend (.env)")
print(f"VAPID_PRIVATE_KEY={priv_b64}")
print(f"VAPID_CONTACT_EMAIL=hello@pantry.app")
print()
print("# Frontend (.env.local)")
print(f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={pub_b64}")
