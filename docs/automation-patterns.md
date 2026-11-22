# Automation patterns and best practices

How we build automations so they are safe to run and easy to hand over.

| Pattern | What we do | Example in this repo |
|---|---|---|
| Manual first, then schedule | Every workflow has a manual trigger for testing next to its schedule | Weekly AI impact report |
| One item per record | Code nodes return one item per question or record, so later nodes run once per item | Question digest |
| Tag the caller | Integrations send `X-Client` and `X-User` headers so usage and impact can be measured | `/api/search` calls from n8n |
| Fail loudly | Errors stop the workflow and show in n8n's execution list; no silent empty reports | `scripts/last-output.mjs` fails the test on a workflow error |
| Flag gaps, don't guess | No result means "not found", sent to a person, never a made-up answer | `gaps` in the digest; MCP tool says "do not guess" |
| Read-only by default | AI tools can read the knowledge base but not change it | MCP tools are marked `readOnlyHint` |
| No secrets in workflows | Use n8n credentials or environment variables, never keys inside nodes | `KB_URL` environment variable |
| Test in CI | Workflows are imported and run against the real API on every change | `npm run n8n:test` in GitHub Actions |
| Measure impact | Report lookups, active users, answered rate, time saved and unanswered questions | `/api/impact` |

## Measuring AI impact
- **Adoption:** lookups and active users per channel (MCP assistants, REST, n8n).
- **Quality:** share of searches answered; unanswered questions become new knowledge base pages.
- **Time saved:** answered lookups × minutes saved per answer (default 4, set with `MINUTES_SAVED_PER_ANSWER`).
  This is an estimate; confirm it with a short survey of users before reporting it to leaders.
