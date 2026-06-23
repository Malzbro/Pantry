"""Push subscription management endpoints."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import push_service
from api.deps import get_db, current_user_id
from db.models import PushSubscription

logger = logging.getLogger(__name__)

router = APIRouter()


class SubscribeRequest(BaseModel):
    endpoint: str
    key_p256dh: str
    key_auth: str


class UnsubscribeRequest(BaseModel):
    endpoint: str


class SendRequest(BaseModel):
    title: str
    body: str
    url: str | None = None


@router.post("/push/subscribe")
def subscribe(
    body: SubscribeRequest,
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == body.endpoint
    ).first()

    if existing:
        existing.user_id = user_id
        existing.key_p256dh = body.key_p256dh
        existing.key_auth = body.key_auth
    else:
        db.add(PushSubscription(
            user_id=user_id,
            endpoint=body.endpoint,
            key_p256dh=body.key_p256dh,
            key_auth=body.key_auth,
        ))

    db.commit()
    logger.info("Push subscription saved for user %s", user_id)
    return {"ok": True}


@router.post("/push/unsubscribe")
def unsubscribe(
    body: UnsubscribeRequest,
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    deleted = db.query(PushSubscription).filter(
        PushSubscription.endpoint == body.endpoint,
        PushSubscription.user_id == user_id,
    ).delete()

    db.commit()
    logger.info("Push unsubscribe for user %s (deleted=%d)", user_id, deleted)
    return {"ok": True}


@router.get("/push/status")
def push_status(
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    count = db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id
    ).count()
    return {"subscribed": count > 0, "subscription_count": count}


def send_to_user(user_id: UUID, payload: dict, db: Session) -> int:
    """Send a push notification to all of a user's subscriptions. Returns count of successes."""
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    sent = 0
    for sub in subs:
        ok = push_service.send(sub.endpoint, sub.key_p256dh, sub.key_auth, payload)
        if ok:
            sent += 1
        else:
            db.delete(sub)
    if len(subs) != sent:
        db.commit()
    return sent
