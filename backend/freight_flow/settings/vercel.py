"""
Settings de Produção — Vercel
"""
from .base import *  # noqa: F401, F403
import dj_database_url
import os

SECRET_KEY = os.environ["SECRET_KEY"]

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",") + [
    ".vercel.app",
    "localhost",
]

# ── Banco de dados ────────────────────────────────────────────────────────────
# Se DATABASE_URL estiver definida (ex.: Neon, Supabase), usa ela.
# Caso contrário cai no SQLite (apenas para demo — configure um DB real).
_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    DATABASES = {"default": dj_database_url.config(default=_db_url, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": "/tmp/freight_vercel.sqlite3",
        }
    }

# ── Cache — sem Redis no Vercel ───────────────────────────────────────────────
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ── Static files — whitenoise ─────────────────────────────────────────────────
MIDDLEWARE = ["whitenoise.middleware.WhiteNoiseMiddleware"] + MIDDLEWARE  # noqa: F405
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
STATIC_ROOT = "/tmp/staticfiles"

# ── Segurança ─────────────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
