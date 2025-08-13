# Syntra Backend

Lightweight event-driven agent backend that ingests collaboration platform events (Slack messages, Notion task updates, Jira task creations), detects "chaos" signals (unanswered questions, blocked tasks, potential duplications), logs them, and triggers simple resolution actions (Slack nudges, Notion comments) while storing semantic memory via Chroma + OpenAI embeddings.

## Features

- Ingestion routes: `/api/slack`, `/api/notion`, `/api/jira`
- Detection agent surfaces chaos signals
- Resolver agent performs basic follow-up actions (stubbed integrations)
- Memory agent stores and retrieves embedded text (`/api/memory`, `/api/memory/search?q=`)
- Chroma vector store initialization on boot
- Structured logger + chaos / resolver log files

## Quick Start

1. Install deps:
```
npm install
```
2. Set env vars (create `.env`):
```
OPENAI_API_KEY=sk-...
PORT=8000
LOG_LEVEL=info
```
3. Run dev server:
```
npm run dev
```
4. Test health:
```
curl http://localhost:8000/
```
5. Send a Slack-style message:
```
curl -X POST http://localhost:8000/api/slack -H "Content-Type: application/json" -d '{"user":"alice","text":"How do I deploy?"}'
```

Check `chaos.log` for recorded signal.

## Memory Endpoints
Store text:
```
curl -X POST http://localhost:8000/api/memory -H "Content-Type: application/json" -d '{"text":"Deployment uses Terraform"}'
```
Search:
```
curl "http://localhost:8000/api/memory/search?q=terraform"
```

## Project Structure

`src/agents` – listener, detection, resolution, memory orchestration
`src/routes` – HTTP ingestion endpoints
`src/data` – Chroma client / collection helpers
`src/integrations` – Stubs for external services (Slack, Notion)
`src/utils` – logging, embedding helpers, chaos & resolution logs

## Next Steps

- Persist Chroma to disk (specify `path` when constructing client)
- Add authentication / signing for inbound webhooks
- Implement real Slack & Notion API calls
- Add unit tests and CI
- Extend detection heuristics (LLM-based classification)
- Rate limiting & retry policies

## License
ISC
