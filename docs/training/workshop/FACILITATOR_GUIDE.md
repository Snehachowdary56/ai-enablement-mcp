# Facilitator guide: "Build your first AI-ready automation with n8n" (30 minutes)

**Audience:** 5 to 12 people, no coding needed (classmates, teammates, staff who repeat the same lookups).
**Goal:** everyone leaves having run, changed and fixed a real n8n workflow, and knowing one task of their own to automate.
**You need:** a laptop with n8n running and `n8n/workshop-starter.json` imported; the slides; a screen; the feedback form link.

## One week before
- Book a room or a Teams call and send the invite with the **setup steps** from `PARTICIPANT_HANDOUT.md`.
- Ask people to bring a laptop with n8n ready. Setup is the main risk: ask them to try it before the day.
- Create the feedback form (questions in `FEEDBACK_FORM.md`) and paste its link into the last slide.

## Run of show

| Time | What happens | What you say or do |
|---|---|---|
| 0:00 to 0:03 | **Why automate** | "Think of a question people ask you every week. Today we build something that answers it for you." Ask 2 people for their example. |
| 0:03 to 0:08 | **Demo** | Show the finished digest running: questions in, answers with sources out, gaps flagged. Point at each node and say what it does in one sentence. |
| 0:08 to 0:12 | **Import** | Everyone imports `workshop-starter.json` and clicks **Execute workflow**. Walk the room. Ask: "Who sees 3 of 4 answered?" |
| 0:12 to 0:18 | **Exercise 1: your questions** | Open **Questions**, replace the 4 questions with their own, run again. Expect more gaps; that is the point. |
| 0:18 to 0:23 | **Exercise 2: fix a gap** | Open **Find answer in FAQ**, copy one line, change the keywords, answer and source, run again. The gap disappears. This is the "aha" moment: give it time. |
| 0:23 to 0:26 | **Make it real** | Show (do not build) how to swap **Run manually** for a **Schedule Trigger** and add an email or Teams node after **Build digest**. Mention the full version calls a knowledge base API and an MCP server. |
| 0:26 to 0:30 | **Wrap up and feedback** | "What would you automate first?" Then everyone fills in the feedback form before leaving. |

## If something goes wrong
- **Someone has no n8n:** pair them with a neighbour. Do not spend workshop time on installs.
- **Import fails:** they may have copied the file wrongly. Share the file again, or open it from GitHub with **Raw** and paste the JSON into n8n.
- **"Unexpected token" in a Code node:** a missing quote or comma. Compare their line with the line above it.
- **Running late:** skip "Make it real", never skip Exercise 2 or the feedback form.

## After the workshop
Record the results while they are fresh:
- number of attendees, and how many ran the workflow successfully
- feedback form results (how many say they could build one alone, average usefulness)
- the tasks people want to automate (these are automation opportunities)
- what confused people, to improve the next session
