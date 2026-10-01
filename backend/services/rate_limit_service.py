import time
from collections import defaultdict, deque
from threading import Lock
from typing import Optional


class SlidingWindowLimiter:
    """At most `limit` hits per key in any `window_seconds` span.

    ponytail: in-process memory — counts reset on restart and are per worker;
    fine for a wedding's traffic, move to Redis/DB if it ever runs multi-instance.
    """

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str, now: Optional[float] = None) -> bool:
        current = time.monotonic() if now is None else now
        with self._lock:
            hits = self._hits[key]
            while hits and current - hits[0] >= self.window_seconds:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(current)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()
