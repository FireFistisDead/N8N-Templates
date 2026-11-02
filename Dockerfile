# syntax=docker/dockerfile:1

# ---- Python catalog + gateway ------------------------------------------------
FROM python:3.12-slim AS python

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/services/python \
    N8N_REPO_ROOT=/app

WORKDIR /app

COPY services/python/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY services/python ./services/python
COPY client ./client
COPY context ./context

EXPOSE 8101 8000
CMD ["python3", "-m", "catalog"]

# ---- Node catalog + gateway --------------------------------------------------
FROM node:22-slim AS node

ENV NODE_ENV=production \
    N8N_REPO_ROOT=/app

WORKDIR /app

COPY services/node/catalog/package.json ./services/node/catalog/package.json
COPY services/node/gateway/package.json ./services/node/gateway/package.json
RUN cd services/node/catalog && npm install --omit=dev --no-audit --no-fund \
 && cd ../gateway && npm install --omit=dev --no-audit --no-fund

COPY services/node ./services/node
COPY client ./client
COPY context ./context

EXPOSE 8102 8001
CMD ["node", "services/node/catalog/src/index.js"]
