import { beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { KnowledgeBase } from "../src/kb.js";
import { createMcpServer } from "../src/mcp.js";
import { UsageLog } from "../src/usage.js";

const kb = KnowledgeBase.fromDir(path.resolve(__dirname, "../kb"));
let usage: UsageLog;

async function connect() {
  const server = createMcpServer(kb, usage, "sneha");
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

const text = (r: { content: unknown }) => (r.content as { type: string; text: string }[])[0].text;

beforeEach(() => {
  usage = new UsageLog(4);
});

describe("MCP server", () => {
  it("lists 3 read-only tools and one resource per document", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["get_document", "list_documents", "search_knowledge_base"]);
    expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true);
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain("kb://docs/expense-policy");
  });

  it("search_knowledge_base answers with a source an AI assistant can quote", async () => {
    const client = await connect();
    const res = await client.callTool({ name: "search_knowledge_base", arguments: { query: "meal limit when travelling", limit: 2 } });
    expect(text(res)).toMatch(/\$75 CAD per day/);
    expect(text(res)).toMatch(/source: expense-policy\.md#meals-while-travelling/);
    const { results } = res.structuredContent as { results: { docId: string }[] };
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0].docId).toBe("expense-policy");
  });

  it("tells the assistant not to guess when nothing matches", async () => {
    const client = await connect();
    const res = await client.callTool({ name: "search_knowledge_base", arguments: { query: "quantum chromodynamics" } });
    expect(text(res)).toMatch(/do not guess/);
  });

  it("rejects invalid input through the tool schema", async () => {
    const client = await connect();
    const res = await client.callTool({ name: "search_knowledge_base", arguments: { query: "x" } });
    expect(res.isError).toBe(true);
  });

  it("get_document returns the full text, or a clear error", async () => {
    const client = await connect();
    expect(text(await client.callTool({ name: "get_document", arguments: { id: "it-help" } }))).toMatch(/Resetting your password/);
    const missing = await client.callTool({ name: "get_document", arguments: { id: "nope" } });
    expect(missing.isError).toBe(true);
  });

  it("reads a document as a resource", async () => {
    const client = await connect();
    const r = await client.readResource({ uri: "kb://docs/onboarding" });
    expect((r.contents[0] as { text: string }).text).toMatch(/onboarding buddy/);
  });

  it("records each tool call for the AI impact report", async () => {
    const client = await connect();
    await client.callTool({ name: "search_knowledge_base", arguments: { query: "VPN" } });
    await client.callTool({ name: "list_documents", arguments: {} });
    const report = usage.report();
    expect(report.byChannel).toEqual({ mcp: 2 });
    expect(report.activeUsers).toBe(1);
    expect(report.minutesSaved).toBe(4);
  });
});
