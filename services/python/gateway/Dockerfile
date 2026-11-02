# syntax=docker/dockerfile:1
# Standalone image for the gateway service (Render deploy target).
# Build context must be the repository root.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/services/python \
    N8N_REPO_ROOT=/app

WORKDIR /app

COPY services/python/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY services/python ./services/python
COPY client ./client

EXPOSE 8000
CMD ["python3", "-m", "gateway"]
