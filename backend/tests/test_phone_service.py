import pytest

from services.phone_service import InvalidPhoneError, normalize_phone


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("+39 333 123 4567", "+393331234567"),
        ("333 1234567", "+393331234567"),
        ("0039 333 1234567", "+393331234567"),
        ("+39 (333) 123-4567", "+393331234567"),
        ("+33 6 12 34 56 78", "+33612345678"),
    ],
)
def test_normalizes_to_e164(raw, expected):
    assert normalize_phone(raw) == expected


@pytest.mark.parametrize("raw", ["", "+39", "+39 12", "333 abc 4567", "+39 3331234567890123"])
def test_rejects_invalid_numbers(raw):
    with pytest.raises(InvalidPhoneError):
        normalize_phone(raw)
