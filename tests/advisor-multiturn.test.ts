import { createAnthropic } from "@ai-sdk/anthropic";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { describe, expect, it } from "vitest";
import { handleChat } from "@/lib/ai/chat-handler";
import type { AdvisorMessage } from "@/lib/ai/types";
import { fakeAnthropicFetch } from "./fake-anthropic";

/*
 * Three turns with the strategist, through the same client the widget uses
 * (the AI SDK's Chat) and the real Anthropic provider, against a stand-in
 * API that enforces the Messages API's rules (tests/fake-anthropic.ts).
 */

type Log = { info(...a: unknown[]): void; warn(...a: unknown[]): void; error(...a: unknown[]): void };
const quiet: Log = { info() {}, warn() {}, error() {} };

function conversation(modelId = "claude-opus-5-5", live?: { env: Record<string, string>; unavailableModels: string[]; invalidKey?: boolean; log: Log }) {
  const api = {
    requests: [] as Record<string, unknown>[],
    rejected: [] as string[],
  };
  const apiFetch = fakeAnthropicFetch(api, { unavailableModels: live?.unavailableModels, invalidKey: live?.invalidKey }) as typeof fetch;
  // With `live`, the handler builds its own models from env (main + fallback), as in production.
  const model = live ? undefined : createAnthropic({ apiKey: "test", fetch: apiFetch })(modelId);
  const posted: { messages: AdvisorMessage[] }[] = [];
  const statuses: number[] = [];
  const chat = new Chat<AdvisorMessage>({
    transport: new DefaultChatTransport<AdvisorMessage>({
      api: "http://localhost/api/chat/",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, sessionId: "s".repeat(24) },
      }),
      fetch: (async (_url: RequestInfo | URL, init?: RequestInit) => {
        const body = String(init?.body);
        posted.push(JSON.parse(body));
        const res = await handleChat(body, {
          env: live?.env ?? {},
          ip: "1",
          rateLimiter: { hit: () => true },
          model,
          anthropicFetch: apiFetch,
          log: live?.log ?? quiet,
          background: () => {},
        });
        statuses.push(res.status);
        return res;
      }) as typeof fetch,
    }),
  });
  return { chat, api, posted, statuses };
}

const lastReply = (chat: Chat<AdvisorMessage>) => {
  const m = chat.messages[chat.messages.length - 1];
  expect(m.role).toBe("assistant");
  return m;
};
const replyText = (m: AdvisorMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
const quickReplies = (m: AdvisorMessage) => {
  for (const p of m.parts) if (p.type === "tool-suggestReplies" && p.state === "output-available") return p.output.replies;
  return [];
};

describe("permit strategist, three turns", () => {
  it("answers a question, a quick-reply tap and a typed follow-up", async () => {
    const { chat, api, posted, statuses } = conversation();

    // Turn 1: the first question gets a reply, the scope card and quick replies.
    await chat.sendMessage({
      text: "I want to remove a load-bearing wall in Toronto",
    });
    expect(chat.error).toBeUndefined();
    const first = lastReply(chat);
    expect(replyText(first)).toContain("needs a building permit");
    expect(first.parts.some((p) => p.type === "tool-generateProjectScope" && p.state === "output-available")).toBe(true);
    const chips = quickReplies(first);
    expect(chips.length).toBeGreaterThan(0);

    // Turn 2: tapping a quick reply sends the whole conversation and gets an answer.
    await chat.sendMessage({ text: chips[0] });
    expect(chat.error).toBeUndefined();
    expect(posted[1].messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    const second = lastReply(chat);
    expect(replyText(second)).toContain("structural information");
    expect(quickReplies(second).length).toBeGreaterThan(0);

    // Turn 3: a typed follow-up about getting started and cost gets the closing card, never a price.
    await chat.sendMessage({
      text: "How do we get started and what does it cost?",
    });
    expect(chat.error).toBeUndefined();
    expect(posted[2].messages.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant", "user"]);
    const third = lastReply(chat);
    expect(third.parts.some((p) => p.type === "tool-presentDealCloserCard" && p.state === "output-available")).toBe(true);
    expect(replyText(third)).not.toMatch(/\$\s?\d/);

    expect(statuses).toEqual([200, 200, 200]);
    expect(api.rejected).toEqual([]);
    expect(chat.status).toBe("ready");
  });

  it("gives the model the cards already shown as text, in a clean alternating history", async () => {
    const { chat, api } = conversation();
    await chat.sendMessage({
      text: "I want to remove a load-bearing wall in Toronto",
    });
    await chat.sendMessage({ text: "What drawings do I need?" });
    const turn2 = api.requests[api.requests.length - 1] as {
      messages: { role: string; content: { type: string; text?: string }[] }[];
    };
    expect(turn2.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    const history = JSON.stringify(turn2.messages[1].content);
    expect(history).toContain("Project scope card shown");
    expect(history).toContain("Load-bearing wall removal");
    expect(history).toContain("Quick replies offered");
    expect(turn2.messages[1].content.every((b) => b.type === "text")).toBe(true);
  });

  it("accepts any shape of earlier assistant message, and never sends Anthropic an empty one", async () => {
    const api = {
      requests: [] as Record<string, unknown>[],
      rejected: [] as string[],
    };
    const model = createAnthropic({
      apiKey: "test",
      fetch: fakeAnthropicFetch(api) as typeof fetch,
    })("claude-opus-5-5");
    const messages = [
      {
        id: "u1",
        role: "user",
        parts: [
          {
            type: "text",
            text: "I want to remove a load-bearing wall in Toronto",
          },
        ],
      },
      {
        id: "a1",
        role: "assistant",
        content: "",
        quickReplies: ["Yes"],
        parts: [
          { type: "step-start" },
          {
            type: "custom",
            kind: "anthropic.message_start",
            providerMetadata: {},
          },
          { type: "text", text: "  ", state: "done" },
          // A tool call the model wrote badly: it failed validation and never ran.
          {
            type: "tool-suggestReplies",
            toolCallId: "x",
            state: "output-error",
            input: {
              replies: ["a reply that is far longer than the sixty characters a quick reply may be"],
            },
            errorText: "bad input",
          },
          {
            type: "tool-somethingRetired",
            toolCallId: "y",
            state: "output-available",
            input: {},
            output: { ok: true },
          },
          { type: "data-card", data: { anything: true } },
        ],
      },
      { id: "a2", role: "assistant", parts: [] },
      { id: "u2", role: "user", content: "Do I need an engineer?" },
    ];
    const res = await handleChat(JSON.stringify({ messages }), {
      env: {},
      ip: "1",
      rateLimiter: { hit: () => true },
      model,
      log: quiet,
    });
    expect(res.status).toBe(200);
    await res.text();
    expect(api.rejected).toEqual([]);
    const sent = (api.requests[0] as { messages: { role: string }[] }).messages;
    expect(sent.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });
});

type WireRequest = {
  model: string;
  thinking?: { type: string };
  output_config?: { effort?: string };
  fallbacks?: unknown;
  system: { type: string; text: string; cache_control?: { type: string } }[];
  tools: { name: string; cache_control?: { type: string } }[];
};

describe("prompt caching and model options", () => {
  async function twoTurns(modelId: string) {
    const { chat, api } = conversation(modelId);
    await chat.sendMessage({ text: "I want to remove a load-bearing wall in Toronto" });
    await chat.sendMessage({ text: "What drawings do I need?" });
    expect(api.rejected).toEqual([]);
    return api.requests as unknown as WireRequest[];
  }

  it("caches the tools and the static prompt, and keeps the visit context after the breakpoint", async () => {
    const requests = await twoTurns("claude-sonnet-4-5");
    for (const r of requests) {
      // Tools: one breakpoint, on the last tool, which covers all four definitions.
      expect(r.tools.map((t) => t.cache_control?.type ?? null)).toEqual([null, null, null, "ephemeral"]);
      // System: the static block is cached, the visitor context after it is not.
      expect(r.system).toHaveLength(2);
      expect(r.system[0].cache_control).toEqual({ type: "ephemeral" });
      expect(r.system[1].cache_control).toBeUndefined();
      expect(r.system[1].text).toContain("<visitor_context>");
    }
    // The cached prefix is byte-identical from turn to turn.
    expect(JSON.stringify(requests[1].tools)).toBe(JSON.stringify(requests[0].tools));
    expect(requests[1].system[0].text).toBe(requests[0].system[0].text);
  });

  it("runs Claude Sonnet 4.5 without thinking, effort or fallbacks, which it does not accept", async () => {
    const [r] = await twoTurns("claude-sonnet-4-5");
    expect(r.model).toBe("claude-sonnet-4-5");
    expect(r.thinking).toEqual({ type: "disabled" });
    expect(r.output_config?.effort).toBeUndefined();
    expect(r.fallbacks).toBeUndefined();
  });

  it("keeps low effort and fallbacks for a Claude 5 model set through ANTHROPIC_MODEL", async () => {
    const [r] = await twoTurns("claude-opus-5-5");
    expect(r.output_config?.effort).toBe("low");
    expect(r.fallbacks).toBe("default");
    // Opus 5.5 cannot turn thinking off (a 400), so the setting is not sent.
    expect(r.thinking).toBeUndefined();
  });
});

describe("the stand-in API enforces Anthropic's limits", () => {
  it("refuses five cache_control blocks, as the live API does", async () => {
    // Sent raw: the AI SDK's Anthropic provider itself drops any breakpoint past the fourth, so the
    // handler cannot produce this body; the stand-in still refuses it like the live API.
    const api = { requests: [] as Record<string, unknown>[], rejected: [] as string[] };
    const cc = { type: "ephemeral" };
    const body = (n: number) => ({
      model: "claude-opus-5-5",
      max_tokens: 100,
      system: [{ type: "text", text: "rules", cache_control: cc }],
      tools: ["a", "b", "c", "d"].map((name, i) => ({ name, input_schema: { type: "object" }, ...(i >= 4 - (n - 1) && { cache_control: cc }) })),
      messages: [{ role: "user", content: "I want to build a legal basement apartment in Mississauga" }],
    });
    const send = (n: number) => fakeAnthropicFetch(api)("https://api.anthropic.com/v1/messages", { method: "POST", body: JSON.stringify(body(n)) });
    expect((await send(5)).status).toBe(400);
    expect(api.rejected).toEqual(["A maximum of 4 blocks with cache_control may be provided. Found 5."]);
    expect((await send(2)).status).toBe(200);
    expect(api.rejected).toHaveLength(1);
  });

  it("accepts the handler's requests: two breakpoints over three turns", async () => {
    const { chat, api, statuses } = conversation("claude-opus-5-5");
    for (const text of ["I want to build a legal basement apartment in Mississauga", "What drawings do I need?", "How do we get started and what does it cost?"]) {
      await chat.sendMessage({ text });
      expect(chat.error).toBeUndefined();
    }
    expect(statuses).toEqual([200, 200, 200]);
    expect(api.rejected).toEqual([]);
    for (const r of api.requests) expect((JSON.stringify(r).match(/"cache_control":\{/g) ?? []).length).toBe(2);
  });
});

describe("model fallback", () => {
  it("answers every turn on the fallback model when Anthropic does not know the main one, and logs why", async () => {
    const logged: string[] = [];
    const log: Log = { info() {}, warn: (m) => void logged.push(String(m)), error: (m) => void logged.push(String(m)) };
    const { chat, api, statuses } = conversation(undefined, {
      env: { ANTHROPIC_API_KEY: "test", ANTHROPIC_MODEL: "claude-sonnet-4-5" },
      unavailableModels: ["claude-sonnet-4-5"],
      log,
    });
    for (const text of ["I want to build a legal basement apartment in Mississauga", "What drawings do I need?", "How do we get started and what does it cost?"]) {
      await chat.sendMessage({ text });
      expect(chat.error).toBeUndefined();
      expect(lastReply(chat).parts.some((p) => p.type === "text" && p.text.trim())).toBe(true);
    }
    expect(statuses).toEqual([200, 200, 200]);
    const models = (api.requests as { model: string }[]).map((r) => r.model);
    expect(models).toContain("claude-sonnet-4-5");
    expect(models).toContain("claude-opus-5-5");
    // The retry carries no cache_control and the fallback model's own options.
    for (const r of api.requests as WireRequest[]) {
      if (r.model !== "claude-opus-5-5") continue;
      expect(JSON.stringify(r)).not.toContain("cache_control");
      expect(r.output_config?.effort).toBe("low");
    }
    expect(logged.some((l) => l.includes("status 404") && l.includes("not_found_error"))).toBe(true);
  });

  it("answers with the offline reply and the closing card when the API key is rejected (2026-11-24)", async () => {
    const logged: string[] = [];
    const log: Log = { info() {}, warn: (m) => void logged.push(String(m)), error: (m) => void logged.push(String(m)) };
    const { chat, api, statuses } = conversation(undefined, {
      env: { ANTHROPIC_API_KEY: "revoked" },
      unavailableModels: [],
      invalidKey: true,
      log,
    });
    await chat.sendMessage({ text: "Can I schedule an appointment?" });
    expect(chat.error).toBeUndefined();
    expect(statuses).toEqual([200]);
    const reply = lastReply(chat);
    const text = replyText(reply);
    expect(text).toContain("books consultations");
    expect(text).toContain("416-479-9556");
    expect(text).toContain("info@permitguys.ca");
    expect(text).not.toMatch(/647|968|mzaman/i);
    const card = reply.parts.find((p) => p.type === "tool-presentDealCloserCard");
    expect(card && card.state === "output-available" && card.output.recommendedAction).toBe("Priority call back");
    // A rejected key is not retried on another model with the same key.
    expect(api.requests).toHaveLength(1);
    expect(logged.some((l) => l.includes("ACTION NEEDED"))).toBe(true);

    // The next turn still works, and the offline turn is valid history for a model that is back.
    await chat.sendMessage({ text: "I want to build a deck in Oakville" });
    expect(chat.error).toBeUndefined();
    const second = lastReply(chat).parts.find((p) => p.type === "tool-presentDealCloserCard");
    expect(second && second.state === "output-available" && second.output.projectType).toBe("deck");
    expect(second && second.state === "output-available" && second.output.municipality).toBe("Oakville");
  });
});
