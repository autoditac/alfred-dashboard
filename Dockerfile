FROM node:22-alpine AS builder
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-trixie-slim
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends gpsd python3-gps iw \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY server/ server/
COPY --from=builder /app/dist dist/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/index.js"]
