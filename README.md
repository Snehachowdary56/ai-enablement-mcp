# AI Enablement Kit: knowledge base MCP server + n8n automations

![CI](https://github.com/Snehachowdary56/ai-enablement-mcp/actions/workflows/ci.yml/badge.svg)

Helps a company adopt AI safely: it connects AI assistants to the company knowledge base through an
**MCP (Model Context Protocol) server**, automates common lookups with **n8n workflows**, reports on **AI impact**
(adoption, time saved, knowledge gaps), and includes **training materials** for non-technical teams.

The knowledge base in `kb/` is a small sample (expenses, IT help, onboarding, purchasing, responsible AI use) for a made-up company.

## What's inside

| Part | What it does |
|---|---|
| MCP server (`src/mcp.ts`) | 3 read-only tools (`search_knowledge_base`, `get_document`, `list_documents`) and one resource per document. Runs over **stdio** (Claude Desktop, Cursor) and **Streamable HTTP** (`POST /mcp`, for shared servers and n8n AI agents). |
| Search (`src/kb.ts`) | BM25 keyword search over document sections; every answer has a source link such as `expense-policy.md#mileage`. |
| REST API (`src/app.ts`) | `/api/search`, `/api/documents`, `/api/impact` for integrations that don't speak MCP (n8n HTTP Request node, internal apps). |
| AI impact report (`src/usage.ts`) | Lookups by channel (MCP, REST, n8n), active users, answered rate, estimated time saved, unanswered questions. |
| n8n workflows (`n8n/`) | **Knowledge base question digest**: answers a list of questions with sources and flags gaps. **Weekly AI impact report**: every Monday, turns usage into a short report for leaders. |
| Training (`docs/training/`) | Workshop 1: connect your AI assistant (MCP). Workshop 2: build your first n8n automation. Prompt engineering cheat sheet. A ready-to-run **30-minute hands-on workshop kit** (`docs/training/workshop/`): facilitator guide, participant handout, feedback form and a starter workflow (`n8n/workshop-starter.json`) that runs without the API. |
| Best practices (`docs/automation-patterns.md`) | How automations are built, tested and measured. |

## Quality

- **29 tests** (Vitest): search quality on 12 labelled questions (all answered from the right section), MCP tools and resources
  through the official SDK client (in-memory, **stdio** and **Streamable HTTP**), REST API validation and the impact report.
- **n8n end to end** (`npm run n8n:test`): CI installs n8n, imports both workflows and runs them against the live API.
  The digest must answer 4 of 5 questions with sources and flag the 5th; the report must count those 5 lookups (80% answered).
- Strict TypeScript; Docker image.

## Run it

```bash
npm install
npm test                 # 29 tests
npm run build
npm start                # REST API + MCP endpoint on http://localhost:3000
npm run n8n:test         # needs n8n: npm i -g n8n
```

### Connect an AI assistant (stdio)

```json
{ "mcpServers": { "company-knowledge-base": { "command": "node", "args": ["/path/to/ai-enablement-mcp/dist/stdio.js"] } } }
```

### Try the API

```bash
curl "http://localhost:3000/api/search?q=meal%20limit%20when%20travelling"
curl "http://localhost:3000/api/impact"
```

### Use the n8n workflows
Import `n8n/*.json` in n8n, set `KB_URL` (default `http://localhost:3000`) and click **Execute workflow**.
Add a Slack, Teams or Email node at the end to send the digest or report.

## Design choices
- **Read-only tools** and a "do not guess" message when nothing matches, so assistants don't invent policy.
- **Stateless Streamable HTTP**: each MCP request gets a fresh server, so it scales behind a load balancer.
- **Usage is tagged by channel and user** (`X-Client`, `X-User`) so AI impact can be measured, not assumed.
  Time saved is an estimate (minutes per answered lookup, configurable) and should be confirmed with users.
