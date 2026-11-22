import fs from "node:fs";
import path from "node:path";

/** One section of a knowledge base document (split on "## " headings). */
export interface Section {
  docId: string;
  title: string;
  team: string;
  heading: string;
  text: string;
}

export interface Doc {
  id: string;
  title: string;
  team: string;
  updated: string;
  body: string;
  sections: Section[];
}

export interface SearchHit {
  docId: string;
  title: string;
  heading: string;
  snippet: string;
  score: number;
  source: string; // e.g. "expense-policy.md#meals-while-travelling"
}

const STOP = new Set("a an and are at be by can do for from how i in is it my of on or the to what when where which who with you your".split(" "));

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9$.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t)); // light stemming: claims -> claim
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Parses a markdown file with a small front-matter block (title, team, updated). */
export function parseDoc(id: string, raw: string): Doc {
  const meta: Record<string, string> = {};
  let body = raw;
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const [k, ...v] = line.split(":");
      if (k && v.length) meta[k.trim()] = v.join(":").trim();
    }
    body = raw.slice(fm[0].length);
  }
  const title = meta.title ?? id;
  const team = meta.team ?? "General";
  const sections: Section[] = [];
  for (const part of body.split(/^## /m).slice(1)) {
    const [heading, ...rest] = part.split("\n");
    sections.push({ docId: id, title, team, heading: heading.trim(), text: rest.join(" ").replace(/\s+/g, " ").trim() });
  }
  return { id, title, team, updated: meta.updated ?? "", body: body.trim(), sections };
}

/** A small keyword search index (BM25 scoring) over document sections. */
export class KnowledgeBase {
  readonly docs: Doc[];
  private readonly sections: Section[];
  private readonly tokens: string[][];
  private readonly df = new Map<string, number>();
  private readonly avgLen: number;

  constructor(docs: Doc[]) {
    this.docs = docs;
    this.sections = docs.flatMap((d) => d.sections);
    this.tokens = this.sections.map((s) => tokenize(`${s.title} ${s.heading} ${s.heading} ${s.text}`));
    for (const toks of this.tokens) for (const t of new Set(toks)) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    this.avgLen = this.tokens.reduce((n, t) => n + t.length, 0) / Math.max(this.tokens.length, 1);
  }

  static fromDir(dir: string): KnowledgeBase {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
    return new KnowledgeBase(files.map((f) => parseDoc(f.replace(/\.md$/, ""), fs.readFileSync(path.join(dir, f), "utf8"))));
  }

  search(query: string, limit = 3, team?: string): SearchHit[] {
    const q = [...new Set(tokenize(query))];
    if (q.length === 0) return [];
    const N = this.sections.length;
    const k1 = 1.4;
    const b = 0.75;
    const hits: SearchHit[] = [];
    this.sections.forEach((s, i) => {
      if (team && s.team.toLowerCase() !== team.toLowerCase()) return;
      const toks = this.tokens[i];
      let score = 0;
      for (const term of q) {
        const tf = toks.filter((t) => t === term).length;
        if (!tf) continue;
        const idf = Math.log(1 + (N - (this.df.get(term) ?? 0) + 0.5) / ((this.df.get(term) ?? 0) + 0.5));
        score += (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * toks.length) / this.avgLen));
      }
      if (score > 0) {
        hits.push({
          docId: s.docId,
          title: s.title,
          heading: s.heading,
          snippet: s.text.length > 280 ? `${s.text.slice(0, 277)}...` : s.text,
          score: Math.round(score * 100) / 100,
          source: `${s.docId}.md#${slug(s.heading)}`,
        });
      }
    });
    return hits.sort((a, b2) => b2.score - a.score).slice(0, Math.max(1, Math.min(limit, 10)));
  }

  get(id: string): Doc | undefined {
    return this.docs.find((d) => d.id === id);
  }

  list() {
    return this.docs.map(({ id, title, team, updated, sections }) => ({ id, title, team, updated, sections: sections.map((s) => s.heading) }));
  }
}
