# The test server's image (DigitalOcean App Platform, task 3.16, .do/app.yaml): the new system run with `next start`,
# the legacy screens from frontend/, and the job run before each deploy (tools/deploy-migrate.mjs). Node as in CI.
#
#   docker build -t drivego .
#   docker run -p 8080:8080 -e DATABASE_URL=… [-e DATABASE_CA_CERT=…] drivego
#   docker run -e MIGRATE_DATABASE_URL=… [-e SEED_DEMO_SHOPS=1] drivego node tools/deploy-migrate.mjs
FROM node:22.22.0-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --workspace server --include-workspace-root=false --no-audit --no-fund
COPY server server
RUN npm run build --workspace server && rm -rf server/.next/cache

FROM node:22.22.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 FRONTEND_DIR=/app/frontend FILE_STORE=postgres PORT=8080
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --workspace server --include-workspace-root=false --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server server
COPY --from=build --chown=node:node /app/server/.next server/.next
COPY frontend frontend
COPY tools/deploy-migrate.mjs tools/demo-shops.mjs tools/
COPY tests/fixtures/biz-trial.json tests/fixtures/prox-trial.json tests/fixtures/franchise-trial.json tests/fixtures/
USER node
EXPOSE 8080
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start server -p \"$PORT\" -H 0.0.0.0"]
