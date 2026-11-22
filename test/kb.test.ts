import { describe, expect, it } from "vitest";
import path from "node:path";
import { KnowledgeBase, parseDoc, tokenize } from "../src/kb.js";

const kb = KnowledgeBase.fromDir(path.resolve(__dirname, "../kb"));

describe("knowledge base", () => {
  it("loads every document with its team and sections", () => {
    expect(kb.docs.map((d) => d.id)).toEqual(["ai-usage-policy", "expense-policy", "it-help", "onboarding", "procurement"]);
    expect(kb.get("expense-policy")).toMatchObject({ title: "Expense Policy", team: "Finance" });
    expect(kb.get("expense-policy")!.sections.map((s) => s.heading)).toEqual(["Meals while travelling", "Submitting a claim", "Mileage"]);
  });

  it("parses front matter and falls back when it is missing", () => {
    expect(parseDoc("x", "# Hello\n## Part\nSome text").title).toBe("x");
  });

  it("tokenizes with stop words removed and light stemming", () => {
    expect(tokenize("How do I submit my expense claims?")).toEqual(["submit", "expense", "claim"]);
  });
});

// A small labelled set: each question must find the right section first.
const EVAL: [string, string][] = [
  ["What is the meal limit when travelling?", "expense-policy.md#meals-while-travelling"],
  ["how do I submit an expense claim", "expense-policy.md#submitting-a-claim"],
  ["kilometre rate for driving my car", "expense-policy.md#mileage"],
  ["I forgot my password", "it-help.md#resetting-your-password"],
  ["VPN won't connect", "it-help.md#vpn-access"],
  ["when do I enrol in dental benefits", "onboarding.md#benefits-enrolment"],
  ["how many days in the office", "onboarding.md#hybrid-work"],
  ["can I paste customer data into ChatGPT", "ai-usage-policy.md#approved-ai-tools"],
  ["buy software under $500", "procurement.md#buying-software"],
  ["do I need three quotes for a purchase order", "procurement.md#purchase-orders"],
  ["workshops on prompt engineering", "ai-usage-policy.md#getting-help"],
  ["open a help desk ticket", "it-help.md#opening-a-ticket"],
];

describe("search quality", () => {
  it.each(EVAL)("%s", (question, source) => {
    expect(kb.search(question, 3)[0]?.source).toBe(source);
  });

  it("filters by team and returns nothing for unrelated questions", () => {
    expect(kb.search("approval", 5, "Finance").every((h) => h.docId === "expense-policy" || h.docId === "procurement")).toBe(true);
    expect(kb.search("quantum chromodynamics lattice")).toEqual([]);
    expect(kb.search("?? !!")).toEqual([]);
  });
});
