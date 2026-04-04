# qmd-mcp-dashboard

QMD MCP server container with built-in health & data dashboard.

## Quick Start

```bash
docker pull rurusasu/qmd-mcp-dashboard:latest
docker run -p 3001:3001 \
  -v qmd-data:/data/qmd \
  rurusasu/qmd-mcp-dashboard:latest
```

## Dashboard

Access at `http://localhost:3003/dashboard` (available after Phase 4 implementation).

## Build Args

| Arg | Default | Description |
|---|---|---|
| QMD_COMMIT | 1fb2e28... | Pinned QMD commit SHA |
| PNPM_VERSION | 10.7.0 | pnpm version |
| SUPERGATEWAY_VERSION | 3.4.3 | Supergateway version |

## Architecture

- **MCP Server**: QMD via supergateway on port 3001
- **Dashboard**: Next.js App Router on port 3003 (coming soon)
- **Base**: GitHub `tobi/qmd` + npm `supergateway` (wrapper, not fork)
