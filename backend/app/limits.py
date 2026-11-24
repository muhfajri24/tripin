"""Bounded single-process guest API protection; no forwarded-IP trust."""

from collections import OrderedDict, deque
from time import monotonic
from uuid import uuid4
from starlette.responses import JSONResponse


class GuestLimits:
    def __init__(self, app, max_body_bytes=262144, writes_per_minute=30):
        self.app = app
        self.max_body_bytes = max_body_bytes
        self.writes_per_minute = writes_per_minute
        self.clients = OrderedDict()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST":
            return await self.app(scope, receive, send)

        async def reject(status, code, message, headers=None):
            rid = str(uuid4())
            response = JSONResponse(
                {
                    "error": {
                        "code": code,
                        "message": message,
                        "fields": {},
                        "retryable": status == 429,
                    },
                    "requestId": rid,
                },
                status_code=status,
                headers={"X-Request-ID": rid, **(headers or {})},
            )
            await response(scope, receive, send)

        key = (scope.get("client") or ("unknown",))[0]
        now = monotonic()
        recent = self.clients.pop(key, deque())
        while recent and now - recent[0] >= 60:
            recent.popleft()
        self.clients[key] = recent
        if len(self.clients) > 1024:
            self.clients.popitem(last=False)
        if len(recent) >= self.writes_per_minute:
            return await reject(
                429,
                "RATE_LIMITED",
                "Terlalu banyak permintaan. Coba satu menit lagi.",
                {"Retry-After": "60"},
            )
        recent.append(now)
        headers = dict(scope.get("headers", []))
        try:
            length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            return await reject(400, "INVALID_LENGTH", "Content-Length tidak valid.")
        if length < 0 or length > self.max_body_bytes:
            return await reject(
                413, "REQUEST_TOO_LARGE", "Request melebihi batas 256 KiB."
            )
        # Bound actual bytes too, including requests without Content-Length.
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > self.max_body_bytes:
                return await reject(
                    413, "REQUEST_TOO_LARGE", "Request melebihi batas 256 KiB."
                )
            if not message.get("more_body", False):
                break
        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, replay, send)
