# syntax=docker/dockerfile:1
# Standalone image for the gateway service (Render deploy target).
# Can also run catalog in-process (RENDER_COMBINED=true) to avoid Render
# free-tier services spinning down independently - see start.sh.
# Build context must be the repository root.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/services/python \
    N8N_REPO_ROOT=/app

WORKDIR /app

COPY services/python/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --only-binary=:all: -r /tmp/requirements.txt

COPY services/python ./services/python
COPY client ./client
COPY context ./context
COPY workflows ./workflows

RUN chmod +x services/python/gateway/start.sh \
    && useradd --no-create-home --shell /sbin/nologin appuser \
    && mkdir -p /app/data/python \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["services/python/gateway/start.sh"]
