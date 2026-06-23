"""Auth webhook endpoint — receives Supabase auth events and sends transactional emails."""

import logging
import os

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

import email_service
import email_templates

logger = logging.getLogger(__name__)

router = APIRouter()

WEBHOOK_SECRET = os.environ.get("SUPABASE_AUTH_WEBHOOK_SECRET", "")


class _AuthWebhookPayload(BaseModel):
    type: str
    record: dict | None = None
    old_record: dict | None = None


@router.post("/webhooks/auth")
async def auth_webhook(request: Request):
    if WEBHOOK_SECRET:
        token = request.headers.get("authorization", "").removeprefix("Bearer ")
        if token != WEBHOOK_SECRET:
            raise HTTPException(401, "Invalid webhook secret")

    body = await request.json()
    event_type = body.get("type", "")
    record = body.get("record") or {}

    logger.info("Auth webhook: type=%s user=%s", event_type, record.get("id"))

    if event_type == "INSERT":
        email = record.get("email")
        if email:
            subject, html = email_templates.welcome(email)
            email_service.send(email, subject, html)

    return {"received": True}
