import re

DEFAULT_COUNTRY_CODE = "39"
_ALLOWED = re.compile(r"^\+?[0-9\s().-]+$")


class InvalidPhoneError(ValueError):
    pass


def normalize_phone(raw: str) -> str:
    """Turns a guest-typed phone into E.164 (+393331234567); Italy is assumed
    when no international prefix is given. 8-15 digits, per E.164."""
    value = (raw or "").strip()
    if not value or not _ALLOWED.match(value):
        raise InvalidPhoneError("Invalid phone number.")

    digits = re.sub(r"\D", "", value)
    if value.startswith("+"):
        pass
    elif digits.startswith("00"):
        digits = digits[2:]
    else:
        digits = DEFAULT_COUNTRY_CODE + digits

    if not 8 <= len(digits) <= 15:
        raise InvalidPhoneError("Invalid phone number.")
    return f"+{digits}"
