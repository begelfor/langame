"""Development settings."""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = env.bool("DJANGO_DEBUG", default=True)

# Convenience: allow all hosts in local dev unless overridden.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["*"])

# Convenience: allow any origin in local dev (Expo web, devices on LAN, etc.).
CORS_ALLOW_ALL_ORIGINS = True
