import { describe, expect, it } from "vitest";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// The same way Claude Desktop or Cursor start the server: as a child process speaking MCP over stdio.
describe("MCP over stdio", () => {
  it("starts as a process and answers a search", async () => {
    const root = path.resolve(__dirname, "..");
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.join(root, "node_modules/tsx/dist/cli.mjs"), path.join(root, "src/stdio.ts")],
      cwd: root,
      stderr: "ignore",
    });
    const client = new Client({ name: "stdio-test", version: "1.0.0" });
    await client.connect(transport);
    try {
      const res = await client.callTool({ name: "search_knowledge_base", arguments: { query: "VPN fails to connect" } });
      expect((res.content as { text: string }[])[0].text).toMatch(/it-help\.md#vpn-access/);
    } finally {
      await client.close();
    }
  }, 20_000);
});
