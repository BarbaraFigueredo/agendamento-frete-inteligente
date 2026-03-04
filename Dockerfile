# ─────────────────────────────────────────────
# Stage 1 – base  (Python 3.12 slim)
# ─────────────────────────────────────────────
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependências do sistema (psycopg2 binário + utilitários)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─────────────────────────────────────────────
# Stage 2 – builder  (instala dependências Python)
# ─────────────────────────────────────────────
FROM base AS builder

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install -r requirements.txt

# ─────────────────────────────────────────────
# Stage 3 – runtime
# ─────────────────────────────────────────────
FROM base AS runtime

# Copia pacotes instalados no builder
COPY --from=builder /install /usr/local

# Cria usuário não-root para segurança
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

# Entrypoint: aguarda o Postgres subir, aplica migrations e inicia o servidor
CMD ["sh", "-c", \
     "python manage.py wait_for_db && \
      python manage.py migrate --noinput && \
      python manage.py runserver 0.0.0.0:8000"]
