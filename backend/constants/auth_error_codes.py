"""Stable auth error codes shared with the frontend's error mapping.

These are the seam: the frontend keys its copy off `code`, never off the
human-readable message, so either side can reword its text without silently
breaking the other. Keep this list mirrored in
frontend/src/services/authErrorCodes.ts.
"""

INVALID_ROLE_SECRET = "INVALID_ROLE_SECRET"
EMAIL_TAKEN = "EMAIL_TAKEN"
INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
