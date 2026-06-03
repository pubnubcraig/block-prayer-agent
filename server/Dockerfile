# Web UI + HTTP API for prayer_request.
# Build context = repo root (needs ./public and ./prayer_request).
#   docker build -f server/Dockerfile -t prayer-request-web .
FROM node:24-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS=--dns-result-order=ipv4first
ENV PROMPTS_DIR=/app/prompts
ENV PUBLIC_DIR=/app/public
ENV PORT=8080

COPY prayer_request/package.json prayer_request/package-lock.json ./
RUN npm ci --omit=dev && npm install tsx@4 && npm cache clean --force

COPY prayer_request/lib ./lib
COPY prayer_request/prompts ./prompts
COPY public ./public
COPY server/index.ts ./server.ts

EXPOSE 8080
CMD ["./node_modules/.bin/tsx", "server.ts"]
