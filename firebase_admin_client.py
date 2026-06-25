"""Firebase Admin SDK helpers for server-side Firestore access."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore


class FirebaseAdminConfigError(RuntimeError):
    pass


def _load_credentials() -> credentials.Base:
    path = (os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") or "").strip()
    if path:
        return credentials.Certificate(path)

    raw_json = (os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") or "").strip()
    if raw_json:
        return credentials.Certificate(json.loads(raw_json))

    project_id = (os.getenv("FIREBASE_PROJECT_ID") or "").strip()
    if project_id:
        return credentials.ApplicationDefault()

    raise FirebaseAdminConfigError(
        "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH "
        "or FIREBASE_SERVICE_ACCOUNT_JSON (and FIREBASE_PROJECT_ID)."
    )


@lru_cache(maxsize=1)
def get_firestore_client() -> firestore.Client:
    if not firebase_admin._apps:
        cred = _load_credentials()
        options: dict[str, Any] = {}
        project_id = (os.getenv("FIREBASE_PROJECT_ID") or "").strip()
        if project_id:
            options["projectId"] = project_id
        firebase_admin.initialize_app(cred, options or None)
    return firestore.client()
