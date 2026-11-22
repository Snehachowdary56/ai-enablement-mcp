// Reads `n8n execute --rawOutput` from stdin and prints the first output item of the last node that ran.
import fs from "node:fs";
const raw = fs.readFileSync(0, "utf8");
const start = raw.indexOf("{");
const run = JSON.parse(raw.slice(start));
const runData = run.data.resultData.runData;
const last = run.data.resultData.lastNodeExecuted;
if (run.data.resultData.error) throw new Error(`workflow failed: ${run.data.resultData.error.message}`);
console.log(JSON.stringify(runData[last][0].data.main[0][0].json));
