#!/usr/bin/env bash
# End-to-end test of the n8n workflows against the running knowledge base API.
# Needs: npm run build, and the n8n CLI (npx n8n). CI installs n8n; locally: npm i -g n8n.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=${PORT:-3123}
export KB_URL="http://127.0.0.1:${PORT}"
export N8N_USER_FOLDER="${N8N_USER_FOLDER:-$(mktemp -d)}"
export N8N_BLOCK_ENV_ACCESS_IN_NODE=false N8N_DIAGNOSTICS_ENABLED=false N8N_RUNNERS_ENABLED=true
N8N=${N8N_BIN:-npx --yes n8n}

PORT=$PORT node dist/http.js > /tmp/kb-server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do curl -sf "$KB_URL/api/health" >/dev/null && break; sleep 0.5; done

$N8N import:workflow --separate --input=n8n > /dev/null

run() { # prints the JSON output of the workflow's last node
  $N8N execute --id="$1" --rawOutput 2>/tmp/n8n-exec.err | node scripts/last-output.mjs
}

echo "== Knowledge base question digest"
DIGEST=$(run kbQuestionDigest1)
echo "$DIGEST" | node -e '
  const d = JSON.parse(require("fs").readFileSync(0, "utf8"));
  console.log(d.digest);
  if (d.total !== 5 || d.answered !== 4) throw new Error(`expected 4 of 5 answered, got ${d.answered} of ${d.total}`);
  if (!d.rows[0].source.startsWith("it-help.md#resetting-your-password")) throw new Error("wrong source for password question");
  if (d.gaps[0] !== "Is there a parental leave top-up?") throw new Error("gap not flagged");
  console.log("OK: 4 of 5 answered with sources, 1 gap flagged");'

echo "== Weekly AI impact report"
REPORT=$(run weeklyAiImpact01)
echo "$REPORT" | node -e '
  const r = JSON.parse(require("fs").readFileSync(0, "utf8"));
  console.log(r.report);
  if (r.lookups !== 5) throw new Error(`expected 5 lookups from the digest, got ${r.lookups}`);
  if (!/n8n: 5/.test(r.report) && /by 1 person/.test(r.report) || !/80% of searches/.test(r.report)) throw new Error("report numbers are wrong");
  if (r.gaps[0] !== "Is there a parental leave top-up?") throw new Error("gap missing from report");
  console.log("OK: report counts the digest lookups, answered rate and gaps");'

echo "== Workshop starter (runs without the API)"
STARTER=$(run workshopStarter1)
echo "$STARTER" | node -e '
  const d = JSON.parse(require("fs").readFileSync(0, "utf8"));
  if (d.total !== 4 || d.answered !== 3) throw new Error(`expected 3 of 4 answered, got ${d.answered} of ${d.total}`);
  if (d.gaps[0] !== "How do I book a meeting room?") throw new Error("meeting room gap not flagged");
  console.log("OK: workshop starter answers 3 of 4 and flags the meeting room gap");'
