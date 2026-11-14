import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { buildDossier, extractContact } from "@/lib/ai/chat-dossier";
import { handleChat } from "@/lib/ai/chat-handler";
import { memoryLeadLedger } from "@/lib/ai/lead-sessions";
import { ownerNotifyConfig } from "@/lib/ai/notify-owners";
import { summarizeSession, type SummaryRequest } from "@/lib/ai/session-summary";
import { submitClosedLead } from "@/lib/ai/submit-lead";
import { staticSystemPrompt } from "@/lib/ai/system-prompt";
import { LEAD_ENV, SESSION, fakeFetch } from "./lead-helpers";

const quiet = { info() {}, warn() {}, error() {} };
const allow = { hit: () => true };
const ENV = { ...LEAD_ENV, ANTHROPIC_API_KEY: "k" };

const summary = (over: Partial<SummaryRequest> = {}): SummaryRequest => ({
  sessionId: SESSION,
  messageCount: 4,
  reason: "page_exit",
  messages: [
    { role: "user", text: "Can I add a second storey to my bungalow in Burlington? How long does the city take?" },
    { role: "assistant", text: "Often, yes. Final pricing and timelines are tailored by our senior permit team." },
    { role: "user", text: "I'm Priya, call me at 905-555-0142 or priya@example.com. It's at 12 Maple Avenue." },
    { role: "assistant", text: "Thank you, our team will be in touch." },
  ],
  visitorSnapshot: { currentPath: "/services/residential-additions/", pagesViewed: ["/", "/services/residential-additions/"], timeOnSiteSeconds: 240, viewedSections: [{ id: "praise", label: "Reviews", path: "/" }] },
  extractedScope: { projectType: "residential-addition", municipality: "Burlington", estimatedSqFt: null, structuralChanges: true, stage: "Planning and budgeting", summary: "Second storey over a bungalow." },
  ...over,
});

describe("contact details in the chat", () => {
  it("finds a name, phone, email and street address in the visitor's words", () => {
    expect(extractContact(["Hi, I'm Priya Shah, reach me at 905-555-0142 or priya@example.com", "It's 12 Maple Avenue"])).toEqual({
      name: "Priya Shah",
      phone: "905-555-0142",
      email: "priya@example.com",
      address: "12 Maple Avenue",
    });
    expect(extractContact(["I'm planning a deck in Oakville. This is Oakville by the lake."])).toEqual({ name: "", phone: "", email: "", address: "" });
  });

  it("builds the dossier from the scope first, then the chat", () => {
    const d = buildDossier({ sessionId: SESSION, messageCount: 2, transcript: [{ role: "visitor", text: "Do I need a permit for a deck in Mississauga?" }], snapshot: null, scopeInput: null });
    expect(d).toMatchObject({ projectType: "Deck", municipality: "Mississauga", questions: ["Do I need a permit for a deck in Mississauga?"] });
  });
});

describe("/api/chat/session-summary (possible_lead_abandoned)", () => {
  const deps = () => {
    const outbox = fakeFetch();
    return { outbox, deps: { env: ENV, ip: "1", rateLimiter: allow, ledger: memoryLeadLedger(), fetch: outbox.fetch, log: quiet } };
  };

  it("sends a POSSIBLE LEAD dossier to the team's inbox and webhook", async () => {
    const { outbox, deps: d } = deps();
    expect(await summarizeSession(summary(), d)).toEqual({ status: "sent" });

    const [email] = outbox.emails();
    expect(outbox.emails()).toHaveLength(1);
    expect(email.subject).toBe("[POSSIBLE LEAD — CHAT SUMMARY] Residential addition in Burlington (5E3C1D2A)");
    expect(email.to).toEqual(["team@permitguys.test"]);
    expect(email.reply_to).toBe("priya@example.com");
    expect(email.text).toMatch(/^POSSIBLE LEAD \(Visitor Chatted & Left Without Submitting Form\)/);
    expect(email.text).toMatch(/Phone: 905-555-0142/);
    expect(email.text).toMatch(/Address: 12 Maple Avenue/);
    expect(email.text).toMatch(/How long does the city take\?/);
    expect(email.text).toMatch(/Pages viewed: \/, \/services\/residential-additions\//);
    expect(email.text).toMatch(/Time on site: about 4 minutes/);
    expect(email.text).toMatch(/Visitor: I'm Priya/);

    const hook = outbox.webhooks()[0] as { leadStatus: string; reason: string; dossier: { sessionId: string; contact: { name: string }; municipality: string } };
    expect(hook.leadStatus).toBe("possible_lead_abandoned");
    expect(hook.reason).toBe("page_exit");
    expect(hook.dossier).toMatchObject({ sessionId: SESSION, municipality: "Burlington", contact: { name: "Priya" } });
  });

  it("sends each session and message count once, and a longer conversation again", async () => {
    const { outbox, deps: d } = deps();
    expect((await summarizeSession(summary({ reason: "idle" }), d)).status).toBe("sent");
    expect((await summarizeSession(summary({ reason: "page_exit" }), d)).status).toBe("duplicate");
    expect((await summarizeSession(summary({ messageCount: 6 }), d)).status).toBe("sent");
    expect(outbox.emails()).toHaveLength(2);
  });

  it("is upgraded to CLOSED LEAD when the visitor sends the card, and no more summaries follow", async () => {
    const { outbox, deps: d } = deps();
    await summarizeSession(summary(), d);
    const closed = await submitClosedLead(
      {
        submissionId: "0b8f3a3c-7f53-4b0f-9b5c-1d2e3f4a5b6c",
        sessionId: SESSION,
        startedAt: String(Date.now() - 60_000),
        contact: { name: "Priya Shah", email: "priya@example.com", phone: "905-555-0142" },
        consent: true,
        project: { projectType: "residential-addition", municipality: "Burlington", stage: "Planning and budgeting", scopeSummary: "A second storey over our bungalow.", recommendedAction: "Priority call back" },
      },
      { ...d, duplicates: new Set<string>() },
    );
    expect(closed.status).toBe("sent");
    const hook = outbox.webhooks().at(-1)!;
    expect(hook).toMatchObject({ leadStatus: "closed_handoff", upgradedFromPossibleLead: true, sessionId: SESSION });
    expect(outbox.emails().find((e) => e.subject.startsWith("[CLOSED LEAD]"))?.text).toMatch(/Upgraded from POSSIBLE LEAD/);
    expect((await summarizeSession(summary({ messageCount: 8 }), d)).status).toBe("closed");
  });

  it("ignores short or malformed conversations and works only with the assistant on", async () => {
    const { outbox, deps: d } = deps();
    expect((await summarizeSession(summary({ messageCount: 1, messages: [{ role: "user", text: "hi" }] }), d)).status).toBe("too_short");
    expect((await summarizeSession(summary({ sessionId: "not-a-session" }), d)).status).toBe("invalid");
    expect((await summarizeSession({ nonsense: true }, d)).status).toBe("invalid");
    expect((await summarizeSession(summary(), { ...d, env: LEAD_ENV })).status).toBe("not_configured");
    expect(outbox.sent).toHaveLength(0);
  });

  it("lets a failed delivery be retried by the next trigger", async () => {
    const { deps: d } = deps();
    const failing = (async () => new Response(null, { status: 500 })) as typeof fetch;
    expect((await summarizeSession(summary(), { ...d, fetch: failing })).status).toBe("failed");
    expect((await summarizeSession(summary(), d)).status).toBe("sent");
  });
});

describe("owner notification settings", () => {
  it("prefers the assistant's names and falls back to the inquiry form's", () => {
    expect(ownerNotifyConfig({ RESEND_API_KEY: "k", INQUIRY_EMAIL_FROM: "a@x.test", INQUIRY_EMAIL_TO: "b@x.test, c@x.test", INQUIRY_WEBHOOK_URL: "https://h.test" })).toMatchObject({
      resend: { from: "a@x.test", to: ["b@x.test", "c@x.test"] },
      webhook: { url: "https://h.test" },
      problems: [],
    });
    expect(ownerNotifyConfig({ RESEND_API_KEY: "k", LEAD_WEBHOOK_URL: "http://example.com" }).problems).toHaveLength(2);
    expect(ownerNotifyConfig({})).toEqual({ resend: null, webhook: null, problems: [] });
  });
});

describe("contact typed in /api/chat", () => {
  const model = () =>
    new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "Thank you, our team will be in touch." },
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage: { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } } },
          ],
        }),
      }),
    });
  const user = (id: string, text: string) => ({ id, role: "user", parts: [{ type: "text", text }] });
  const assistant = (id: string, text: string) => ({ id, role: "assistant", parts: [{ type: "text", text }] });

  it("sends a CLOSED LEAD in the background, once per session and details", async () => {
    const outbox = fakeFetch();
    const ledger = memoryLeadLedger();
    const tasks: (() => Promise<unknown>)[] = [];
    const deps = { env: ENV, ip: "1", rateLimiter: allow, log: quiet, model: model(), ledger, fetch: outbox.fetch, background: (t: () => Promise<unknown>) => tasks.push(t) };
    const messages = [user("1", "How much for a deck permit drawing in Whitby?"), assistant("2", "Our senior permit team tailors the quote."), user("3", "Ok call me 905 555 0199")];

    const res = await handleChat(JSON.stringify({ messages, sessionId: SESSION }), deps);
    expect(res.status).toBe(200);
    await res.text();
    expect(tasks).toHaveLength(1);
    await Promise.all(tasks.map((t) => t()));

    const [email] = outbox.emails();
    expect(email.subject).toMatch(/^\[CLOSED LEAD\] Deck in Whitby — 905 555 0199 \([0-9A-F]{8}\)$/);
    expect(email.text).toMatch(/contact details typed in the chat/);
    expect(outbox.webhooks()[0]).toMatchObject({ leadStatus: "closed_handoff", origin: "chat_message" });
    expect(ledger.closedReference(SESSION)).not.toBeNull();

    // The next turn carries the same details: nothing new is sent.
    await (await handleChat(JSON.stringify({ messages: [...messages, assistant("4", "Thanks."), user("5", "Also, do I need a survey?")], sessionId: SESSION }), deps)).text();
    expect(tasks).toHaveLength(1);
  });

  it("tells the model to stop before quoting and not to repeat typed details", () => {
    const p = staticSystemPrompt();
    expect(p).toMatch(/stop before quoting/i);
    expect(p).toMatch(/tailored by our senior permit team based on their property and municipality/);
    expect(p).toMatch(/do not repeat, confirm or ask again for those details/);
  });
});
