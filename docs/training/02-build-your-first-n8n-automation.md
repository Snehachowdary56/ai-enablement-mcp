# Workshop 2: Build your first n8n automation (45 minutes)

**Who it's for:** team leads and analysts who repeat the same lookups or reports every week.
**You will build:** a workflow that answers a list of questions from the knowledge base and sends the digest to your team.

## How the workflow works
`Questions` (Code) → `Search knowledge base` (HTTP Request to `/api/search`) → `Build digest` (Code)

1. **Questions** returns one item per question. n8n runs the next node once for each item.
2. **Search knowledge base** calls the REST API with `X-Client: n8n`, so usage shows up in the AI impact report.
3. **Build digest** keeps the best answer and its source, and flags questions with no answer.

## Steps
1. In n8n, choose **Import from file** and pick `n8n/kb-question-digest.json`.
2. Open **Questions** and replace the list with questions your team gets every week.
3. Click **Execute workflow** and open the output of **Build digest**.
4. Add a **Send email**, **Slack** or **Microsoft Teams** node after **Build digest** and map `digest` into the message.
5. Swap **Run manually** for a **Schedule Trigger** when you are happy with it.

## Check your work
- Every answer has a source link.
- Unanswered questions appear under `gaps`; send them to the AI Enablement team.

## Next step
Import `n8n/weekly-ai-impact-report.json` to see how many lookups your team made and the time saved.
