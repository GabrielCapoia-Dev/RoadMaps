FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS dependencies
WORKDIR /workspace/API
RUN chown node:node /workspace /workspace/API
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS development
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM dependencies AS build
COPY --chown=node:node . .
RUN npm run build

FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS production-dependencies
WORKDIR /workspace/API
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS production
ENV NODE_ENV=production
WORKDIR /workspace/API
COPY --from=production-dependencies --chown=node:node /workspace/API/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/API/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts/migrate.mjs ./scripts/migrate.mjs
USER node
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
