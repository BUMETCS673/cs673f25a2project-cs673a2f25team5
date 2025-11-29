"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import hashlib
import secrets


def generate_token(n_bytes: int = 32) -> str:
    token = secrets.token_urlsafe(n_bytes)
    return token


def hash_token(token: str) -> str:
    h = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return h
