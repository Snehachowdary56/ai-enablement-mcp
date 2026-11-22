import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { KnowledgeBase } from "./kb.js";
import type { UsageLog } from "./usage.js";

/**
 * MCP (Model Context Protocol) server that connects AI assistants (Claude, Cursor, n8n AI agents, ...)
 * to the company knowledge base. Every tool is read-only.
 */
export function createMcpServer(kb: KnowledgeBase, usage: UsageLog, user = "mcp-client"): McpServer {
  const server = new McpServer({ name: "company-knowledge-base", version: "1.0.0" });

  const timed = <T>(tool: string, fn: () => T, query?: string, hitsOf: (r: T) => number = () => 1): T => {
    const t0 = performance.now();
    const result = fn();
    usage.record({ channel: "mcp", tool, user, query, hits: hitsOf(result), ms: Math.round((performance.now() - t0) * 10) / 10 });
    return result;
  };

  server.registerTool(
    "search_knowledge_base",
    {
      title: "Search the company knowledge base",
      description:
        "Search company policies and guides (expenses, IT help, onboarding, purchasing, responsible AI use). " +
        "Returns the best matching sections with a source link. Quote the source when you answer.",
      inputSchema: {
        query: z.string().min(2).max(300).describe("The question or keywords, e.g. 'meal limit when travelling'"),
        limit: z.number().int().min(1).max(10).optional().describe("How many results to return (default 3)"),
        team: z.string().optional().describe("Only search one team's documents, e.g. Finance or IT"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit, team }) => {
      const hits = timed("search_knowledge_base", () => kb.search(query, limit ?? 3, team), query, (h) => h.length);
      if (hits.length === 0) {
        return { content: [{ type: "text", text: `No knowledge base results for "${query}". Say you could not find it; do not guess.` }] };
      }
      const text = hits.map((h, i) => `${i + 1}. ${h.title} > ${h.heading} (source: ${h.source})\n${h.snippet}`).join("\n\n");
      return { content: [{ type: "text", text }], structuredContent: { results: hits } };
    },
  );

  server.registerTool(
    "get_document",
    {
      title: "Read a full knowledge base document",
      description: "Get the full text of one document by id (from search results or list_documents).",
      inputSchema: { id: z.string().describe("Document id, e.g. expense-policy") },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const doc = timed("get_document", () => kb.get(id), id, (d) => (d ? 1 : 0));
      if (!doc) return { isError: true, content: [{ type: "text", text: `No document with id "${id}". Use list_documents.` }] };
      return { content: [{ type: "text", text: `# ${doc.title} (team: ${doc.team}, updated ${doc.updated})\n\n${doc.body}` }] };
    },
  );

  server.registerTool(
    "list_documents",
    {
      title: "List knowledge base documents",
      description: "List every document with its id, team, last update and section headings.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const docs = timed("list_documents", () => kb.list(), undefined, (d) => d.length);
      return {
        content: [{ type: "text", text: docs.map((d) => `${d.id}: ${d.title} [${d.team}, ${d.updated}] - ${d.sections.join("; ")}`).join("\n") }],
        structuredContent: { documents: docs },
      };
    },
  );

  // Each document is also exposed as an MCP resource, so clients can attach it as context.
  for (const doc of kb.docs) {
    server.registerResource(doc.id, `kb://docs/${doc.id}`, { title: doc.title, mimeType: "text/markdown" }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: doc.body }],
    }));
  }

  return server;
}
