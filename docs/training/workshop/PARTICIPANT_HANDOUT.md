# Build your first AI-ready automation with n8n

You will run a small workflow that answers a list of common questions from an FAQ, writes them into one digest, and
lists the questions it could not answer. Then you will make it yours.

## Before the session (10 minutes)
Choose one way to run n8n:
- **On your laptop with Node.js** (version 20 or newer): open a terminal and run `npx n8n`, then open http://localhost:5678.
- **With Docker:** `docker run -it --rm -p 5678:5678 n8nio/n8n`, then open http://localhost:5678.
- **In the cloud:** sign up at n8n.io (check their site for the current free trial).

Then download `workshop-starter.json` from
https://github.com/Snehachowdary56/ai-enablement-mcp/tree/main/n8n

## During the session
1. **Import:** in n8n, create a new workflow, open the **...** menu, choose **Import from file** and pick `workshop-starter.json`.
2. **Run it:** click **Execute workflow**, then click **Build digest** to see the output. You should see **3 of 4 answered** and one gap: *How do I book a meeting room?*
3. **Your questions:** open **Questions** and replace the list with questions people ask *you* every week. Keep the quotes and commas. Run it again.
4. **Fix a gap:** open **Find answer in FAQ**, copy one line inside `faq = [ ... ]`, and change the keywords, answer and source to answer one of your gaps. Run it again: the gap is gone.

## Make it real (after the session)
- Replace **Run manually** with a **Schedule Trigger** (for example, every Monday at 9:00).
- Add a **Send Email**, **Microsoft Teams** or **Slack** node after **Build digest** and put `digest` in the message.
- In the full version, the FAQ is a company knowledge base behind an API and an MCP server, so AI assistants and workflows share the same answers. See `docs/training/02-build-your-first-n8n-automation.md`.

## Stuck?
- Red error in a Code node: check for a missing quote or comma on the line you changed.
- Nothing happens: make sure you clicked **Execute workflow**, not just **Save**.
