# Prayer Request (Blocks.ai agent)

## Local Docker

**Prerequisites:** Agent published to Blocks Network, `.env` configured.

```bash
cd prayer_request
cp .env.example .env
# Set BLOCKS_API_KEY (from `blocks login --write-env`), YOUVERSION_APP_KEY, OPENAI_API_KEY

export PATH="$HOME/.blocks/bin:$PATH"
blocks login --write-env
blocks publish --listing private --billing-mode free

docker compose up --build -d
docker compose logs -f
```

Stop:

```bash
docker compose down
```

**Image:** `prayer-request:local`  
**Container:** `prayer-request-agent`

### Env vars in Docker

Loaded from `prayer_request/.env` via `docker-compose.yml`. `PROMPTS_DIR` defaults to `/app/prompts` inside the container.

### Test (host, agent must be running)

```bash
npx tsx trigger.ts anxiety
npx tsx trigger.ts all
```
