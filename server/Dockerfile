# syntax=docker/dockerfile:1

# ---- build stage: compile TypeScript with dev dependencies available ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy manifests first so `npm ci` is cached until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Drop dev dependencies so only runtime packages are copied forward.
RUN npm prune --omit=dev

# ---- runtime stage: no compiler, no dev dependencies, non-root ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# The container's own port mapping is the security boundary; inside the
# container the listener must accept the Docker network, so bind all
# interfaces here and publish to 127.0.0.1 on the host (see docker-compose.yml).
ENV HOST=0.0.0.0
ENV PORT=4000

# `node` is an unprivileged user that ships with the official image.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node schema.sql ./

USER node
EXPOSE 4000

# Hits the liveness probe, so an unhealthy container is restarted rather than
# silently serving errors.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
