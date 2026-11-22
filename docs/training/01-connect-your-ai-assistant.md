# Workshop 1: Connect your AI assistant to the company knowledge base (30 minutes)

**Who it's for:** anyone who uses an AI assistant at work. No coding needed.
**You will be able to:** ask your AI assistant about company policies and get answers with a source you can check.

## Why this matters
A general AI assistant does not know our policies, so it guesses. The knowledge base MCP server gives it our real documents.
MCP (Model Context Protocol) is a standard way to plug tools and data into AI assistants: one server works with Claude, Cursor, n8n and others.

## Step 1: Add the server
Ask IT to install Node.js, then add this to your assistant's MCP settings (Claude Desktop: Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "company-knowledge-base": {
      "command": "node",
      "args": ["C:/tools/ai-enablement-mcp/dist/stdio.js"]
    }
  }
}
```

Teams that use a shared server connect to `https://<server>/mcp` instead (Streamable HTTP).

## Step 2: Ask a question
Try: *"Using the company knowledge base, what is the meal limit when I travel?"*
The assistant calls `search_knowledge_base` and answers with a source such as `expense-policy.md#meals-while-travelling`.

## Step 3: Check the source
AI answers can be wrong. Open the source section before you act on a number or send it to a customer
(see the Responsible AI Usage Policy).

## Exercise (10 minutes)
1. Ask three questions from your own work.
2. For each answer, open the source and check it.
3. Note any question with no answer and share it in the AI Enablement channel: those become new knowledge base pages.

## Quick reference
| Tool | Use it for |
|---|---|
| `search_knowledge_base` | Questions in plain English; add `team: "Finance"` to narrow it |
| `get_document` | Reading a whole policy |
| `list_documents` | Seeing what the knowledge base covers |
