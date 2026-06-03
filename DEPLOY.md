# Deployment

## AWS EC2 (all-in-one: web UI + HTTP API + always-on Blocks worker)

Single low-cost instance running both containers via Docker Compose. This is the
primary always-on deployment.

- **URL:** http://3.20.42.21/  (Elastic IP)
- **API:** `POST /api/prayer` with `{ "text": "...", "bible_version": "ESV" }`
- **Region:** us-east-2 (Ohio)

### Resources (account 693209594492)

| Resource | ID |
|----------|-----|
| EC2 instance (`t4g.small`, AL2023 arm64) | `i-0020aa484ca07d354` |
| Elastic IP | `3.20.42.21` (`eipalloc-05d87e827d949c11c`) |
| Security group | `sg-0ed45b13431caca26` (22 from admin IP, 80, 443) |
| SSH key pair | `prayer-request-key` (private key at `~/.ssh/prayer-request-key.pem`) |

### Operate

```bash
ssh -i ~/.ssh/prayer-request-key.pem ec2-user@3.20.42.21
cd /opt/app
sudo docker compose -f docker-compose.aws.yml ps          # status
sudo docker logs prayer-request-worker --tail 50          # Blocks worker
sudo docker logs prayer-request-web --tail 50             # web/API
sudo docker compose -f docker-compose.aws.yml up -d --build  # redeploy
```

Secrets live in `/opt/app/.env` (chmod 600): `OPENAI_API_KEY`,
`YOUVERSION_APP_KEY`, `BLOCKS_API_KEY`, `PROMPTS_DIR`. Containers use
`restart: unless-stopped` and Docker is enabled at boot, so they survive reboots.

### HTTPS / custom domain
Point an A record at `3.20.42.21` and follow the instructions in `Caddyfile`.

## Vercel (web UI + HTTP API)

- **URL:** https://block-prayer-request.vercel.app
- **API:** `POST /api/prayer` with `{ "text": "...", "bible_version": "ESV" }`

### Required environment variables

In [Vercel project settings](https://vercel.com/pubnubcraigs-projects/block-prayer-request/settings/environment-variables):

| Variable | Required for |
|----------|----------------|
| `OPENAI_API_KEY` | Verse selection and pastoral response |
| `YOUVERSION_APP_KEY` | Scripture text |

Redeploy after adding variables.

## Blocks Network (Active status on blocks.ai)

Blocks does **not** run provider agents on Vercel. The dashboard shows **Active** only while `blocks run` is connected (outbound PubNub control channel).

### Option A — Render worker (recommended)

1. [Render](https://render.com) → **New** → **Blueprint** → connect `pubnubcraig/block-prayer-request`
2. Set `BLOCKS_API_KEY`, `OPENAI_API_KEY`, `YOUVERSION_APP_KEY` on the **prayer-request-blocks** worker
3. Deploy. The worker uses `prayer_request/Dockerfile` (`blocks-run` entrypoint).

### Option B — Local or Docker

```bash
cd prayer_request
blocks login --write-env
blocks publish --listing private --billing-mode free
blocks run
# or: docker compose up --build -d
```

### Publish checklist

- `blocks login --write-env` must write a valid **Blocks** API key (not an OpenAI key)
- `blocks publish` registers the agent card
- `blocks run` must stay running; if it exits, the agent shows **Inactive**
