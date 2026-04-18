FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache iw
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY server/ server/
COPY --from=builder /app/dist dist/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/index.js"]
