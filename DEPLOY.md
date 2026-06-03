# Deployment

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
