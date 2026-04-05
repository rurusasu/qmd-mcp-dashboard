# QMD MCP Dashboard

[![CI](https://github.com/rurusasu/qmd-mcp-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/rurusasu/qmd-mcp-dashboard/actions/workflows/ci.yml)
[![Docker Build & Publish](https://github.com/rurusasu/qmd-mcp-dashboard/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/rurusasu/qmd-mcp-dashboard/actions/workflows/docker-publish.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/rurusasu/qmd-mcp-dashboard)](https://hub.docker.com/r/rurusasu/qmd-mcp-dashboard)
[![Docker Image Size](https://img.shields.io/docker/image-size/rurusasu/qmd-mcp-dashboard/latest)](https://hub.docker.com/r/rurusasu/qmd-mcp-dashboard)

Docker containerized application that serves as a **dashboard and MCP gateway** for [QMD](https://github.com/tobi/qmd) — a local knowledge base indexing and semantic search tool.

---

## Features

| Feature | Description |
|---|---|
| **Next.js Dashboard** | Real-time status visualization with stats cards, document list, and semantic search |
| **MCP Server** | QMD Model Context Protocol server via supergateway (streamable HTTP) |
| **Health Monitoring** | System health check with database status, file count, and disk usage |
| **Non-root Container** | Runs as `node` (UID 1000) for security best practices |
| **Multi-stage Build** | Optimized 3-stage Docker image (dashboard builder → QMD builder → runtime) |
| **Data Persistence** | PVC mount verification prevents silent data loss to ephemeral storage |

---

## Architecture

```
┌───────────────────────────────────────���──────────────┐
│                  Docker Container                     │
│                                                      │
│  ┌────────────────┐      ┌─────────────────────────┐ │
│  │  MCP Server     │      │  Next.js Dashboard      │ │
│  │  :3001          │      │  :3003                  │ │
│  │  supergateway   │      │  /dashboard/api/*       │ │
│  │  + qmd mcp      │      │  - health, documents    │ │
│  └───────┬────────┘      │  - search               │ │
│          │                └───────────┬─────────────┘ │
│  ┌───────┴────��───────────────────────┴─────────────┐ │
│  │              QMD Core (tobi/qmd)                  │ │
│  │       index.sqlite  ·  markdown files             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## CI Pipeline

| Workflow | Trigger | What it does |
|---|---|---|
| **CI** | PR to `main` | Lint (hadolint · ESLint · Prettier) → Test (Vitest · tsc · build) |
| **Docker** | push to `main` / `v*` tag / weekly | Security → Build + Smoke test (main)。Security → Build → Image scan → Push (tag)。Security のみ (weekly) |

```
PR to main
  └─► CI ─────► Lint (parallel) ─► Test (parallel) ─► ✅
                ├ hadolint          ├ Vitest + tsc
                ├ ESLint            └ Next.js build
                └ Prettier

push to main (merge)
  └─► Docker ─► Security (parallel) ─► Build → Smoke Test ─► ✅
                ├ Trivy config
                ├ Trivy filesystem
                └ npm audit

v* tag
  └─► Docker ─► Security (parallel) ─► Build ─► Trivy image ─► Push
                ├ Trivy config
                ├ Trivy filesystem
                └ npm audit

weekly (Monday 09:00 UTC)
  └─► Docker ─► Security only → GitHub Security tab
```

---

## Quick Start

### Docker

```bash
docker pull rurusasu/qmd-mcp-dashboard:latest
docker run -p 3001:3001 -p 3003:3003 \
  -v qmd-data:/data/qmd \
  rurusasu/qmd-mcp-dashboard:latest
```

### Docker Compose

```yaml
services:
  qmd:
    image: rurusasu/qmd-mcp-dashboard:latest
    ports:
      - "3001:3001"
      - "3003:3003"
    volumes:
      - qmd-data:/data/qmd

volumes:
  qmd-data:
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qmd-mcp-dashboard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qmd-mcp-dashboard
  template:
    spec:
      containers:
        - name: qmd
          image: rurusasu/qmd-mcp-dashboard:latest
          ports:
            - containerPort: 3001
            - containerPort: 3003
          volumeMounts:
            - name: qmd-data
              mountPath: /data/qmd
          livenessProbe:
            httpGet:
              path: /dashboard/api/health
              port: 3003
            periodSeconds: 30
            timeoutSeconds: 5
      volumes:
        - name: qmd-data
          persistentVolumeClaim:
            claimName: qmd-data
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `QMD_DATA_DIR` | `/data/qmd` | Persistent data directory for QMD database |

---

## Ports

| Port | Service | Description |
|---|---|---|
| `3001` | MCP Server | QMD MCP via supergateway (streamable HTTP) |
| `3003` | Dashboard | Next.js web UI and REST API |

---

## Volume Mounts

| Path | Description |
|---|---|
| `/data/qmd` | Persistent data — QMD `index.sqlite` and indexed files |

---

## Build Args

| Arg | Default | Description |
|---|---|---|
| `QMD_COMMIT` | `1fb2e28...` | Pinned QMD commit SHA |
| `PNPM_VERSION` | `10.7.0` | pnpm version for QMD build |
| `SUPERGATEWAY_VERSION` | `3.4.3` | supergateway npm package version |

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | System health check (status, database, files, disk) |
| `GET /api/documents` | List indexed documents |
| `GET /api/search?q=` | Semantic search across indexed documents |

### Examples

```bash
# Health check
curl http://localhost:3003/dashboard/api/health

# List documents
curl http://localhost:3003/dashboard/api/documents

# Semantic search
curl "http://localhost:3003/dashboard/api/search?q=hello"
```

---

## Development

### Prerequisites

- Node.js 22+
- Docker (for container builds)

### Local Setup

```bash
cd dashboard
npm ci
npm run dev          # Start dev server
```

### Running Tests

```bash
cd dashboard
npm test             # Vitest
npx tsc --noEmit     # Type check
```

### Linting

```bash
# Dashboard
cd dashboard
npm run lint         # ESLint
npm run format:check # Prettier

# Dockerfile
hadolint Dockerfile
```

### Build Docker Image Locally

```bash
docker build -t qmd-mcp-dashboard .
docker run --rm -p 3001:3001 -p 3003:3003 \
  -v qmd-data:/data/qmd \
  qmd-mcp-dashboard
```

---

## Security

- Container runs as non-root user `node` (UID 1000)
- `v*` tag リリース時: Trivy (config + filesystem + image) + npm audit が全て通過しないと Docker Hub に push されない
- Weekly Trivy scans (config + filesystem) + npm audit — SARIF → GitHub Security tab
- No secrets stored in image — all config via environment variables
- PVC mount verification at startup prevents silent data loss
