"""Minimal signed-token authentication for the PolarOps prototype.

This module deliberately uses a small configured demo-user set so the SIH
prototype has deterministic authentication. It is not production identity
management; replace it with an identity provider and server-side session
revocation before deployment.
"""

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Annotated, Literal

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

Role = Literal["ADMIN", "PHC", "DOCTOR"]
TOKEN_TTL_SECONDS = 60 * 60 * 8
_bearer_scheme = HTTPBearer(auto_error=False)
_secret = os.environ.get("POLAROPS_AUTH_SECRET", "polarops-prototype-change-me")


class DemoUser(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    station: str
    password: str


class LoginRequest(BaseModel):
    identifier: str
    password: str


class AuthenticatedUser(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    station: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: AuthenticatedUser


# Configured credentials for the prototype only. Do not use these in a
# deployed system; an environment-backed identity provider is required there.
DEMO_USERS = (
    DemoUser(id="NCPOR-DIR-4401", name="Dr. Rajesh Sharma", email="r.sharma@ncpor.gov.in", role="ADMIN", station="Headquarters · Goa", password="PolarOps2026!"),
    DemoUser(id="NCPOR-PHC-210", name="Dr. Ananya Rao", email="a.rao@ncpor.gov.in", role="PHC", station="Polar Health Centre · Maitri", password="PolarOps2026!"),
    DemoUser(id="NCPOR-DOC-317", name="Dr. Vivek Menon", email="v.menon@maitri.aq", role="DOCTOR", station="Maitri Station · Schirmacher Oasis", password="PolarOps2026!"),
)


def public_user(user: DemoUser) -> AuthenticatedUser:
    return AuthenticatedUser(**user.model_dump(exclude={"password"}))


def authenticate(identifier: str, password: str) -> DemoUser | None:
    normalized_identifier = identifier.strip().casefold()
    for user in DEMO_USERS:
        if (
            hmac.compare_digest(normalized_identifier, user.email.casefold())
            or hmac.compare_digest(normalized_identifier, user.id.casefold())
        ) and hmac.compare_digest(password, user.password):
            return user
    return None


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_access_token(user: DemoUser) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(_secret.encode(), encoded_payload.encode(), hashlib.sha256).digest()
    return f"{encoded_payload}.{_b64encode(signature)}"


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Valid authentication credentials are required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()
    try:
        encoded_payload, encoded_signature = credentials.credentials.split(".", 1)
        expected_signature = hmac.new(_secret.encode(), encoded_payload.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64decode(encoded_signature), expected_signature):
            raise ValueError("invalid signature")
        payload = json.loads(_b64decode(encoded_payload))
        if not isinstance(payload.get("exp"), int) or payload["exp"] < time.time():
            raise ValueError("expired token")
        user = next((user for user in DEMO_USERS if user.id == payload.get("sub")), None)
        if user is None or user.role != payload.get("role") or user.email != payload.get("email"):
            raise ValueError("unknown user")
        return public_user(user)
    except (ValueError, KeyError, json.JSONDecodeError, UnicodeDecodeError):
        raise _unauthorized() from None


def require_roles(*roles: Role):
    def dependency(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your role is not authorized for this operation.")
        return user

    return dependency
