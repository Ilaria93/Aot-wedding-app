from services.rate_limit_service import SlidingWindowLimiter


def test_allows_up_to_limit_then_blocks():
    limiter = SlidingWindowLimiter(limit=3, window_seconds=3600)
    assert [limiter.hit("a", now=0) for _ in range(4)] == [True, True, True, False]


def test_keys_are_independent():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=3600)
    assert limiter.hit("a", now=0)
    assert limiter.hit("b", now=0)
    assert not limiter.hit("a", now=1)


def test_window_slides():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=60)
    assert limiter.hit("a", now=0)
    assert not limiter.hit("a", now=59)
    assert limiter.hit("a", now=61)


def test_reset_clears_everything():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=60)
    limiter.hit("a", now=0)
    limiter.reset()
    assert limiter.hit("a", now=1)
