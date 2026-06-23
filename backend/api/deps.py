"""FastAPI dependency providers."""

import os
from collections.abc import Generator
from uuid import UUID

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db.session import SessionLocal
from db.models import Profile

SUPABASE_URL = os.environ["SUPABASE_URL"]
_jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")

_bearer = HTTPBearer(auto_error=True)

PREMIUM_TIERS = {"premium_monthly", "premium_yearly"}


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UUID:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(creds.credentials)
        payload = jwt.decode(
            creds.credentials,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
        )
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication",
        )


def is_premium(
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
) -> bool:
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        return False
    return (
        profile.subscription_status == "active"
        and profile.subscription_tier in PREMIUM_TIERS
    )


def require_premium(premium: bool = Depends(is_premium)) -> None:
    if not premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required",
        )