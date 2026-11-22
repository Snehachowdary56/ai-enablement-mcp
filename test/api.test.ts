import { beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createApp } from "../src/app.js";
import { KnowledgeBase } from "../src/kb.js";
import { UsageLog } from "../src/usage.js";

const kb = KnowledgeBase.fromDir(path.resolve(__dirname, "../kb"));
let usage: UsageLog;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  usage = new UsageLog(4);
  app = createApp(kb, usage);
});

describe("REST API", () => {
  it("searches and records who asked and through which channel", async () => {
    const res = await request(app).get("/api/search").query({ q: "password reset" }).set("X-Client", "n8n").set("X-User", "asha");
    expect(res.status).toBe(200);
    expect(res.body.results[0].source).toBe("it-help.md#resetting-your-password");
    expect(usage.report()).toMatchObject({ byChannel: { n8n: 1 }, activeUsers: 1 });
  });

  it("validates input and returns 404 for unknown documents", async () => {
    expect((await request(app).get("/api/search")).status).toBe(400);
    expect((await request(app).get("/api/documents/nope")).status).toBe(404);
    expect((await request(app).get("/api/documents/procurement")).body.title).toBe("Purchasing and Vendor Requests");
  });

  it("reports AI impact: adoption, answered rate, time saved and knowledge gaps", async () => {
    await request(app).get("/api/search").query({ q: "meal limit" }).set("X-User", "asha");
    await request(app).get("/api/search").query({ q: "VPN" }).set("X-User", "ben");
    await request(app).get("/api/search").query({ q: "parental leave top-up" }).set("X-User", "ben");
    const res = await request(app).get("/api/impact");
    expect(res.body).toMatchObject({ totalLookups: 3, activeUsers: 2, answeredRate: 0.67, minutesSaved: 8, unanswered: ["parental leave top-up"] });
  });
});

describe("MCP over Streamable HTTP", () => {
  it("an MCP client connects to POST /mcp, lists tools and searches", async () => {
    const server = app.listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      const client = new Client({ name: "http-test", version: "1.0.0" });
      await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(3);
      const res = await client.callTool({ name: "search_knowledge_base", arguments: { query: "purchase order quotes" } });
      expect((res.content as { text: string }[])[0].text).toMatch(/three quotes/);
      await client.close();
    } finally {
      server.close();
    }
  });

  it("GET /mcp is not allowed in stateless mode", async () => {
    expect((await request(app).get("/mcp")).status).toBe(405);
  });
});
