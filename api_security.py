import os
import time
from collections import defaultdict
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


def env_int(name: str, default: int) -> int:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return default
    try:
        return max(int(raw), 1)
    except ValueError:
        return default


def get_allowed_origins() -> list[str]:
    raw = (
        os.getenv("ALLOWED_ORIGINS")
        or "http://localhost:5173,http://127.0.0.1:5173"
    )
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return _expand_local_dev_origins(origins)


def _expand_local_dev_origins(origins: list[str]) -> list[str]:
    """Mirror localhost <-> 127.0.0.1 so either dev URL works."""
    expanded: list[str] = []
    for origin in origins:
        expanded.append(origin)
        if origin.startswith("http://localhost:"):
            port = origin.rsplit(":", 1)[-1]
            expanded.append(f"http://127.0.0.1:{port}")
        elif origin.startswith("http://127.0.0.1:"):
            port = origin.rsplit(":", 1)[-1]
            expanded.append(f"http://localhost:{port}")
    return list(dict.fromkeys(expanded))


def get_app_api_key() -> str:
    return (os.getenv("APP_API_KEY") or "").strip()


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            hits = [timestamp for timestamp in self._hits[key] if timestamp > cutoff]
            if len(hits) >= self.max_requests:
                self._hits[key] = hits
                return False
            hits.append(now)
            self._hits[key] = hits
            return True


def client_ip(request: Request) -> str:
    forwarded = (request.headers.get("x-forwarded-for") or "").strip()
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


class ApiSecurityMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        allowed_origins: list[str],
        app_api_key: str,
        rate_limiter: RateLimiter,
        internal_rate_limiter: RateLimiter | None = None,
    ) -> None:
        super().__init__(app)
        self.allowed_origins = allowed_origins
        self.app_api_key = app_api_key
        self.rate_limiter = rate_limiter
        self.internal_rate_limiter = internal_rate_limiter or RateLimiter(
            max_requests=env_int("INTERNAL_RATE_LIMIT_REQUESTS", 6),
            window_seconds=env_int("INTERNAL_RATE_LIMIT_WINDOW_SECONDS", 3600),
        )

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        if not path.startswith("/api/") or path == "/api/health":
            return await call_next(request)

        is_internal = path.startswith("/api/internal/")
        limiter = self.internal_rate_limiter if is_internal else self.rate_limiter
        if not limiter.allow(client_ip(request)):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )

        if is_internal:
            # Cron/server callers authenticate per-route; skip browser origin/app key checks.
            return await call_next(request)

        origin = (request.headers.get("origin") or "").strip()
        if origin and origin not in self.allowed_origins:
            return JSONResponse(status_code=403, content={"detail": "Origin not allowed."})

        if self.app_api_key:
            provided = (request.headers.get("x-app-key") or "").strip()
            if provided != self.app_api_key:
                return JSONResponse(status_code=403, content={"detail": "Forbidden."})

        return await call_next(request)
