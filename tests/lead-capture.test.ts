import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { buildDossier, extractContact } from "@/lib/ai/chat-dossier";
import { handleChat } from "@/lib/ai/chat-handler";
import { memoryLeadLedger } from "@/lib/ai/lead-sessions";
import { ownerNotifyConfig } from "@/lib/ai/notify-owners";
import { waLink, whatsappDisplay } from "@/lib/ai/owner-contact";
import { scopeWhatsappText } from "@/components/ai/AdvisorCards";
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
    expect(email.subject).toBe("👀 [POSSIBLE LEAD — CHAT SUMMARY] Residential addition in Burlington (Visitor Left)");
    expect(email.to).toEqual(["team@permitguys.test"]);
    expect(email.reply_to).toBe("priya@example.com");
    expect(email.text).toMatch(/^👀 POSSIBLE LEAD \(Visitor Chatted & Left Without Submitting Form\)/);
    expect(email.html).toContain("https://wa.me/19055550142?text=");
    expect(email.html).toContain("Scoped drawing set");
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
    expect(outbox.emails().find((e) => e.subject.startsWith("🔥 [CLOSED LEAD]"))?.text).toMatch(/Upgraded from POSSIBLE LEAD/);
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

describe("owner notifications", () => {
  it("defaults to the owners' inbox and WhatsApp, overridable by env", () => {
    expect(ownerNotifyConfig({ RESEND_API_KEY: "k" })).toMatchObject({
      resend: { to: ["Mzaman@permitguys.ca"], from: "PermitGuys AI Strategist <advisor@permitguys.ca>", fallbackFrom: "PermitGuys AI <onboarding@resend.dev>" },
      whatsapp: null,
      webhook: null,
      problems: [],
    });
    expect(ownerNotifyConfig({ RESEND_API_KEY: "k", LEAD_NOTIFICATION_EMAIL: "a@x.test, b@x.test", RESEND_FROM_EMAIL: "Me <me@x.test>", INQUIRY_WEBHOOK_URL: "https://h.test" })).toMatchObject({
      resend: { from: "Me <me@x.test>", to: ["a@x.test", "b@x.test"] },
      webhook: { url: "https://h.test" },
    });
    expect(ownerNotifyConfig({ WHATSAPP_CALLMEBOT_API_KEY: "cb" }).whatsapp).toEqual({ to: "16479686284", meta: null, callmebotKey: "cb" });
    expect(ownerNotifyConfig({ WHATSAPP_CALLMEBOT_API_KEY: "cb", OWNER_WHATSAPP_NUMBER: "(416) 555-0100" }).whatsapp?.to).toBe("14165550100");
    expect(ownerNotifyConfig({ WHATSAPP_ACCESS_TOKEN: "t", LEAD_WEBHOOK_URL: "http://example.com" }).problems).toHaveLength(2);
    expect(ownerNotifyConfig({})).toEqual({ resend: null, whatsapp: null, webhook: null, problems: [] });
  });

  it("retries from onboarding@resend.dev when the sender's domain is not verified", async () => {
    const outbox = fakeFetch((url, body) =>
      url.includes("api.resend.com") && String(body.from).includes("advisor@permitguys.ca") ? Response.json({ message: "The permitguys.ca domain is not verified." }, { status: 403 }) : undefined,
    );
    const d = { env: { ANTHROPIC_API_KEY: "k", RESEND_API_KEY: "k" }, ip: "1", rateLimiter: allow, ledger: memoryLeadLedger(), fetch: outbox.fetch, log: quiet };
    expect((await summarizeSession(summary(), d)).status).toBe("sent");
    expect(outbox.emails().map((e) => [e.from, e.to])).toEqual([
      ["PermitGuys AI Strategist <advisor@permitguys.ca>", ["Mzaman@permitguys.ca"]],
      ["PermitGuys AI <onboarding@resend.dev>", ["Mzaman@permitguys.ca"]],
    ]);
  });

  it("pushes a short summary to the owner's WhatsApp through the Cloud API and CallMeBot, all in parallel", async () => {
    const outbox = fakeFetch();
    const env = { ...ENV, WHATSAPP_ACCESS_TOKEN: "tok", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_CALLMEBOT_API_KEY: "cb" };
    expect((await summarizeSession(summary(), { env, ip: "1", rateLimiter: allow, ledger: memoryLeadLedger(), fetch: outbox.fetch, log: quiet })).status).toBe("sent");
    const [cloud, callmebot] = outbox.whatsapp();
    expect(cloud.url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect(cloud.headers.authorization).toBe("Bearer tok");
    expect(cloud.body).toMatchObject({ messaging_product: "whatsapp", to: "16479686284", type: "text" });
    const text = (cloud.body.text as { body: string }).body;
    expect(text).toMatch(/^👀 POSSIBLE LEAD/);
    expect(text).toMatch(/Phone: 905-555-0142/);
    expect(text).toMatch(/Municipality: Burlington/);
    expect(text).toMatch(/Drawings: /);
    expect(text.length).toBeLessThanOrEqual(1500);
    expect(callmebot.url).toMatch(/^https:\/\/api\.callmebot\.com\/whatsapp\.php\?phone=16479686284&text=.+&apikey=cb$/);
    expect(outbox.webhooks()[0]).toMatchObject({ leadStatus: "possible_lead_abandoned", whatsappSummary: text });
  });

  it("counts the lead as delivered when WhatsApp alone works", async () => {
    const outbox = fakeFetch((url) => (url.includes("api.resend.com") ? new Response(null, { status: 500 }) : undefined));
    const env = { ANTHROPIC_API_KEY: "k", RESEND_API_KEY: "k", WHATSAPP_CALLMEBOT_API_KEY: "cb" };
    expect((await summarizeSession(summary(), { env, ip: "1", rateLimiter: allow, ledger: memoryLeadLedger(), fetch: outbox.fetch, log: quiet })).status).toBe("sent");
  });

  it("writes the visitor's WhatsApp message from the closing card", () => {
    expect(scopeWhatsappText({ reference: "0B8F3A3C", projectLabel: "Deck", municipality: "Toronto", drawings: ["A site plan.", "A framing plan."] })).toBe(
      "Hi PermitGuys, I'd like my project scoped and quoted.\nReference: 0B8F3A3C\nProject: Deck\nMunicipality: Toronto\nDrawings needed: A site plan; A framing plan",
    );
    expect(waLink("16479686284", "Hi there")).toBe("https://wa.me/16479686284?text=Hi%20there");
    expect(whatsappDisplay("16479686284")).toBe("+1 (647) 968-6284");
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
    expect(email.subject).toBe("🔥 [CLOSED LEAD] Deck in Whitby — Visitor (905 555 0199)");
    expect(email.text).toMatch(/contact details typed in the chat/);
    expect(email.text).toMatch(/Reference: [0-9A-F]{8}/);
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
