import { createApp } from "./app.js";
import { KnowledgeBase } from "./kb.js";
import { KB_DIR } from "./paths.js";
import { UsageLog } from "./usage.js";

const kb = KnowledgeBase.fromDir(KB_DIR);
const port = Number(process.env.PORT ?? 3000);
createApp(kb, new UsageLog()).listen(port, () => {
  console.log(`Knowledge base API and MCP server on http://localhost:${port} (${kb.docs.length} documents; MCP endpoint POST /mcp)`);
});
