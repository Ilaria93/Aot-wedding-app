from datetime import datetime
from zoneinfo import ZoneInfo

from settings import is_rsvp_editable


def test_is_rsvp_editable_before_deadline(monkeypatch):
    monkeypatch.setenv("RSVP_EDIT_DEADLINE", "2027-05-07T00:00:00+02:00")
    moment = datetime(2027, 5, 6, 23, 59, tzinfo=ZoneInfo("Europe/Rome"))
    assert is_rsvp_editable(moment) is True


def test_is_rsvp_editable_after_deadline(monkeypatch):
    monkeypatch.setenv("RSVP_EDIT_DEADLINE", "2027-05-07T00:00:00+02:00")
    moment = datetime(2027, 5, 7, 0, 0, 1, tzinfo=ZoneInfo("Europe/Rome"))
    assert is_rsvp_editable(moment) is False


def test_is_rsvp_editable_at_exact_deadline_is_closed(monkeypatch):
    monkeypatch.setenv("RSVP_EDIT_DEADLINE", "2027-05-07T00:00:00+02:00")
    moment = datetime(2027, 5, 7, 0, 0, 0, tzinfo=ZoneInfo("Europe/Rome"))
    assert is_rsvp_editable(moment) is False


def test_is_rsvp_editable_accepts_naive_deadline_as_rome_time(monkeypatch):
    monkeypatch.setenv("RSVP_EDIT_DEADLINE", "2027-05-07T00:00:00")
    just_before = datetime(2027, 5, 6, 23, 0, tzinfo=ZoneInfo("Europe/Rome"))
    just_after = datetime(2027, 5, 7, 1, 0, tzinfo=ZoneInfo("Europe/Rome"))
    assert is_rsvp_editable(just_before) is True
    assert is_rsvp_editable(just_after) is False
