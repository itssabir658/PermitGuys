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

const quiet = { info() {}, warn() {}, error() {} };

function conversation() {
  const api = {
    requests: [] as Record<string, unknown>[],
    rejected: [] as string[],
  };
  const model = createAnthropic({
    apiKey: "test",
    fetch: fakeAnthropicFetch(api) as typeof fetch,
  })("claude-opus-5-5");
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
          env: {},
          ip: "1",
          rateLimiter: { hit: () => true },
          model,
          log: quiet,
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
