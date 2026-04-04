# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim

ARG PNPM_VERSION=10.7.0
ARG QMD_COMMIT=1fb2e2819e4024045203b4ea550ec793683baf2b
ARG SUPERGATEWAY_VERSION=3.4.3

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update && \
  apt-get install -y --no-install-recommends \
    curl git python3 build-essential ca-certificates

# Install pnpm
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Build QMD from source (pinned commit for reproducibility)
RUN git clone https://github.com/tobi/qmd /opt/qmd \
    && cd /opt/qmd \
    && git checkout ${QMD_COMMIT} \
    && NODE_ENV=development pnpm install --no-frozen-lockfile \
    && BSQLITE_DIR=$(find node_modules/.pnpm -path '*/better-sqlite3/binding.gyp' -printf '%h' -quit) \
    && if [ -z "$BSQLITE_DIR" ]; then echo "ERROR: better-sqlite3 not found" >&2; exit 1; fi \
    && cd "$BSQLITE_DIR" && npx --yes node-gyp rebuild \
    && cd /opt/qmd \
    && pnpm run build \
    && touch package-lock.json \
    && pnpm link --global

# supergateway (stdio → streamable-http bridge, pinned version)
RUN --mount=type=cache,target=/root/.npm \
    npm install -g supergateway@${SUPERGATEWAY_VERSION}

# Fix ownership so node user can read QMD files at runtime
RUN chown -R node:node /opt/qmd

USER node
WORKDIR /opt/qmd
EXPOSE 3001

COPY --chown=node:node entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
