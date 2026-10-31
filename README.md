![alt text](image-1.png)

![alt text](image-3.png)
# SKillIssue
Stop searching for issues. Start shipping contributions.

OpenSource Matchmaker analyzes a public GitHub profile, builds an evidence-backed skill
profile, discovers real open issues, ranks them with a deterministic, explainable score, and
generates a grounded contribution blueprint for a selected issue.

## Stack

- React + Vite + TypeScript + Tailwind CSS + TanStack Query + React Router
- Node.js + Express + TypeScript + Zod
- Gemma 2 via Ollama (local) with an OpenRouter fallback adapter
- GitHub REST API
- In-memory persistence (MongoDB-ready seam in `apps/api/src/db/store.ts`)

## Repository layout

```text
apps/
  api/       Express API, GitHub client, AI providers, matching, jobs
  web/       React + Vite frontend
packages/
  shared/    Shared types and Zod schemas
docs/        Architecture and demo script
```

## Quick start

```bash
npm install

# AI (local)
ollama pull gemma2:9b
# smaller / faster dev option: ollama pull gemma2:2b

cp .env.example .env
# edit .env as needed

npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:5173
```

The Vite dev server proxies `/api` to the API on port 4000.

## Environment

See `.env.example`. Key variables:

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `ollama` or `openrouter` |
| `OLLAMA_BASE_URL` | Default `http://localhost:11434` |
| `OLLAMA_MODEL` | Default `gemma2:9b` |
| `OPENROUTER_API_KEY` | Enables hosted fallback |
| `OPENROUTER_MODEL` | Hosted model id |
| `GITHUB_TOKEN` | Optional; raises GitHub rate limits |
| `MONGODB_URI` | Reserved for persistence |

API keys stay server-side. Nothing provider-related is exposed to the browser.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/analyses` | Queue an analysis for `{ "username": "..." }` |
| `GET` | `/api/analyses/:id` | Status + profile + ranked issues |
| `GET` | `/api/analyses/:id/skills` | Skills and evidence bundle |
| `GET` | `/api/analyses/:id/issues` | Ranked issue recommendations |
| `POST` | `/api/analyses/:id/blueprints` | Generate a blueprint for `{ "issueId": "..." }` |
| `GET` | `/api/blueprints/:id` | Fetch a saved blueprint |
| `GET` | `/api/analyses/:id/blueprints` | List saved blueprints |
| `GET` | `/api/health` | Service and provider availability |

## Design principles

- GitHub supplies facts. Application code computes the score. The model explains.
- Skills are labeled `observed`, `demonstrated` or `inferred`; confidence is the system's
  certainty, not objective proficiency.
- Unknown information never receives a perfect score.
- The model never invents issue URLs, labels, file paths or repository contents.
- Every model response is validated with Zod before display.
- If AI is unavailable, deterministic fallbacks keep the end-to-end flow usable.

## Scoring

```text
Match = 0.35 × Skill Fit
      + 0.25 × Issue Clarity
      + 0.20 × Scope Fit
      + 0.10 × Activity Signal
      + 0.10 × Ecosystem Fit
```

Weights live in `apps/api/src/matching/engine.ts`.

## Local inference note

A hosted website cannot reach a visitor's `localhost` Ollama endpoint. For a local demo, run
the API and Ollama on the same machine. For a public deployment, configure OpenRouter or a
secured inference service.

## Build

```bash
npm run build        # shared + api + web
npm run start:api    # serve compiled API
```


