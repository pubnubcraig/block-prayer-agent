FROM node:24-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS=--dns-result-order=ipv4first
ENV PROMPTS_DIR=/app/prompts

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY agent-card.json handler.ts run.mts docker-entrypoint.sh ./
COPY lib ./lib
COPY prompts ./prompts

RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
