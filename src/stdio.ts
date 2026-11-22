import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KnowledgeBase } from "./kb.js";
import { createMcpServer } from "./mcp.js";
import { KB_DIR } from "./paths.js";
import { UsageLog } from "./usage.js";

// MCP over stdio, for desktop AI assistants (Claude Desktop, Cursor) that start the server themselves.
const server = createMcpServer(KnowledgeBase.fromDir(KB_DIR), new UsageLog(), process.env.USER ?? "desktop");
await server.connect(new StdioServerTransport());
console.error("company-knowledge-base MCP server running on stdio");
