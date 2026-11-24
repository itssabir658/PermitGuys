import { APICallError, streamText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { describe, expect, it } from "vitest";
import { isKeyError, withModelFallback } from "@/lib/ai/model-fallback";
import { offlineReply, offlineReplyText } from "@/lib/ai/offline-reply";

/*
 * The strategist's safety net (src/lib/ai/model-fallback.ts): every way a
 * model can fail ends in a reply from the next model, or the offline reply.
 */

const quiet = { warn() {}, error() {} };
const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } };

const replying = (modelId: string, text: string) =>
  new MockLanguageModelV4({
    modelId,
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(c) {
          c.enqueue({ type: "stream-start", warnings: [] });
          c.enqueue({ type: "text-start", id: "t" });
          c.enqueue({ type: "text-delta", id: "t", delta: text });
          c.enqueue({ type: "text-end", id: "t" });
          c.enqueue({ type: "finish", usage, finishReason: { unified: "stop", raw: "end_turn" } });
          c.close();
        },
      }),
    }),
  });

const refusing = (modelId: string, statusCode: number) =>
  new MockLanguageModelV4({
    modelId,
    doStream: async () => {
      throw new APICallError({ message: `status ${statusCode}`, url: "u", requestBodyValues: {}, statusCode });
    },
  });

const silent = (modelId: string) =>
  new MockLanguageModelV4({
    modelId,
    doStream: async () => ({ stream: new ReadableStream<LanguageModelV4StreamPart>({ start: (c) => c.enqueue({ type: "stream-start", warnings: [] }) }) }),
  });

const erroringFirst = (modelId: string) =>
  new MockLanguageModelV4({
    modelId,
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(c) {
          c.enqueue({ type: "stream-start", warnings: [] });
          c.enqueue({ type: "error", error: { type: "overloaded_error", message: "Overloaded" } });
          c.close();
        },
      }),
    }),
  });

async function answer(model: ReturnType<typeof withModelFallback>) {
  const result = streamText({ model, maxRetries: 0, messages: [{ role: "user", content: "Can I schedule an appointment?" }] });
  return result.text;
}

describe("model fallback chain", () => {
  it("uses the fallback model when the main one is refused", async () => {
    const model = withModelFallback({ primary: refusing("main", 404), fallback: replying("second", "from second"), log: quiet });
    expect(await answer(model)).toBe("from second");
  });

  it("skips the fallback on a rejected key and answers on the backup route", async () => {
    const fallback = replying("second", "should not be used");
    const model = withModelFallback({
      primary: refusing("main", 401),
      fallback,
      backup: { model: replying("gateway", "from gateway"), optionsFor: "claude-sonnet-5-5", usesAnthropicKey: false },
      log: quiet,
    });
    expect(await answer(model)).toBe("from gateway");
    expect(fallback.doStreamCalls).toHaveLength(0);
  });

  it("moves on when a model stays silent past the time limit", async () => {
    const model = withModelFallback({ primary: silent("main"), fallback: replying("second", "after the wait"), firstResponseMs: 50, log: quiet });
    expect(await answer(model)).toBe("after the wait");
  });

  it("moves on when the stream fails before any content (overloaded)", async () => {
    const model = withModelFallback({ primary: erroringFirst("main"), fallback: replying("second", "recovered"), log: quiet });
    expect(await answer(model)).toBe("recovered");
  });

  it("answers with the offline reply when nothing else can", async () => {
    const model = withModelFallback({
      primary: refusing("main", 401),
      fallback: refusing("second", 401),
      backup: { model: refusing("gateway", 500), optionsFor: "claude-sonnet-5-5", usesAnthropicKey: false },
      offline: offlineReply,
      log: quiet,
    });
    expect(await answer(model)).toBe(offlineReplyText("Can I schedule an appointment?"));
  });

  it("still throws without an offline reply, so a misconfigured chain is visible", async () => {
    const model = withModelFallback({ primary: refusing("main", 500), log: quiet });
    await expect(answer(model)).rejects.toThrow();
  });

  it("treats only 401 and 403 as key errors", () => {
    const err = (statusCode: number) => new APICallError({ message: "x", url: "u", requestBodyValues: {}, statusCode });
    expect(isKeyError(err(401))).toBe(true);
    expect(isKeyError(err(403))).toBe(true);
    expect(isKeyError(err(404))).toBe(false);
    expect(isKeyError(err(529))).toBe(false);
  });
});

describe("offline reply", () => {
  it("uses only the public contact details", () => {
    for (const q of ["Can I schedule an appointment?", "How much is a basement permit?"]) {
      const t = offlineReplyText(q);
      expect(t).toContain("416-479-9556");
      expect(t).toContain("info@permitguys.ca");
      expect(t).toContain("weekdays 9:00 AM to 5:00 PM; weekends by appointment only");
      expect(t).not.toMatch(/647|968|mzaman|whatsapp/i);
    }
  });
});
