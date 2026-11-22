import express, { type NextFunction, type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { KnowledgeBase } from "./kb.js";
import { createMcpServer } from "./mcp.js";
import type { UsageLog } from "./usage.js";

/** Who is asking: n8n and other integrations send X-Client: n8n and X-User headers. */
function caller(req: Request) {
  const channel = req.header("x-client") === "n8n" ? ("n8n" as const) : ("rest" as const);
  const user = (req.header("x-user") ?? "anonymous").slice(0, 80);
  return { channel, user };
}

export function createApp(kb: KnowledgeBase, usage: UsageLog) {
  const app = express();
  app.use(express.json({ limit: "50kb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", documents: kb.docs.length }));

  // REST API for integrations that do not speak MCP (n8n HTTP Request node, internal apps).
  app.get("/api/search", (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) return res.status(400).json({ error: "Add a question with ?q=, at least 2 characters." });
    const limit = Number(req.query.limit ?? 3) || 3;
    const team = req.query.team ? String(req.query.team) : undefined;
    const t0 = performance.now();
    const results = kb.search(q, limit, team);
    usage.record({ ...caller(req), tool: "search_knowledge_base", query: q, hits: results.length, ms: Math.round((performance.now() - t0) * 10) / 10 });
    res.json({ query: q, results });
  });

  app.get("/api/documents", (_req, res) => res.json(kb.list()));
  app.get("/api/documents/:id", (req, res) => {
    const doc = kb.get(req.params.id);
    if (!doc) return res.status(404).json({ error: `No document with id "${req.params.id}".` });
    res.json(doc);
  });

  // AI impact report: adoption, time saved and unanswered questions (used by the weekly n8n report).
  app.get("/api/impact", (req, res) => res.json(usage.report(req.query.since ? String(req.query.since) : undefined)));

  // MCP over Streamable HTTP (stateless): one server per request, as the SDK recommends for stateless mode.
  app.post("/mcp", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const server = createMcpServer(kb, usage, (req.header("x-user") ?? "mcp-client").slice(0, 80));
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      next(err);
    }
  });
  app.all("/mcp", (_req, res) => res.status(405).json({ error: "Use POST for MCP requests (stateless Streamable HTTP)." }));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Internal error" });
  });
  return app;
}
