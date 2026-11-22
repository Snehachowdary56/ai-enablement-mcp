/**
 * Records every knowledge base lookup (from MCP clients, the REST API or n8n) so the team can report on
 * AI impact: adoption (users, calls by channel), estimated time saved, and questions with no answer.
 */
export interface UsageEvent {
  at: string; // ISO time
  channel: "mcp" | "rest" | "n8n";
  tool: string;
  user: string;
  query?: string;
  hits: number;
  ms: number;
}

export interface ImpactReport {
  totalLookups: number;
  activeUsers: number;
  byChannel: Record<string, number>;
  byTool: Record<string, number>;
  answeredRate: number; // share of searches that found at least one result
  minutesSaved: number;
  unanswered: string[]; // questions with no result: gaps to fill in the knowledge base
  avgLatencyMs: number;
}

export class UsageLog {
  private events: UsageEvent[] = [];
  /** Assumed minutes an employee saves per answered lookup, versus asking a colleague or searching drives. */
  constructor(private readonly minutesPerAnswer = Number(process.env.MINUTES_SAVED_PER_ANSWER ?? 4)) {}

  record(e: Omit<UsageEvent, "at"> & { at?: string }): void {
    this.events.push({ ...e, at: e.at ?? new Date().toISOString() });
    if (this.events.length > 10_000) this.events.shift();
  }

  all(): UsageEvent[] {
    return [...this.events];
  }

  report(since?: string): ImpactReport {
    const ev = since ? this.events.filter((e) => e.at >= since) : this.events;
    const count = (key: (e: UsageEvent) => string) =>
      ev.reduce<Record<string, number>>((m, e) => ((m[key(e)] = (m[key(e)] ?? 0) + 1), m), {});
    const searches = ev.filter((e) => e.tool === "search_knowledge_base");
    const answered = searches.filter((e) => e.hits > 0).length;
    return {
      totalLookups: ev.length,
      activeUsers: new Set(ev.map((e) => e.user)).size,
      byChannel: count((e) => e.channel),
      byTool: count((e) => e.tool),
      answeredRate: searches.length ? Math.round((answered / searches.length) * 100) / 100 : 0,
      minutesSaved: answered * this.minutesPerAnswer,
      unanswered: [...new Set(searches.filter((e) => e.hits === 0 && e.query).map((e) => e.query!))].slice(0, 20),
      avgLatencyMs: ev.length ? Math.round((ev.reduce((n, e) => n + e.ms, 0) / ev.length) * 10) / 10 : 0,
    };
  }

  clear(): void {
    this.events = [];
  }
}
