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

SUPABASE_URL = os.environ["SUPABASE_URL"]
_jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")

_bearer = HTTPBearer(auto_error=True)


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
            algorithms=["RS256"],
            audience="authenticated",
        )
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication",
        )