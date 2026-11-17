/*
 * A stand-in for the Anthropic Messages API, for multi-turn tests of the
 * permit strategist. It answers like Claude Opus 5.5 does (a thinking block
 * first, then text and tool calls, streamed as server-sent events) and,
 * before answering, checks each request against the rules the real API
 * enforces, returning the same 400 error when one is broken. Used by
 * tests/advisor-multiturn.test.ts and e2e/chat-multiturn.spec.ts.
 */

type Json = Record<string, unknown>;
type Content = Json & { type: string };
type ApiMessage = { role: string; content: string | Content[] };

export type FakeBlock = { type: "text"; text: string } | { type: "tool_use"; name: string; input: unknown };

/** The rules the Messages API enforces on a conversation. Returns the first one broken, or null. */
export function anthropicRequestProblem(body: Json): string | null {
  const messages = body.messages as ApiMessage[];
  if (!Array.isArray(messages) || messages.length === 0) return "messages: at least one message is required";
  const thinking = (body.thinking as Json | undefined)?.type;
  const blocks = (m: ApiMessage): Content[] => (typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content);

  if (messages[0].role !== "user") return 'messages: first message must use the "user" role';
  if (messages[messages.length - 1].role !== "user") return 'messages: the final message must use the "user" role';
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== "user" && m.role !== "assistant") return `messages.${i}.role: unexpected role ${m.role}`;
    if (i > 0 && messages[i - 1].role === m.role) return `messages.${i}: roles must alternate between "user" and "assistant"`;
    const content = blocks(m);
    if (content.length === 0) return `messages.${i}: all messages must have non-empty content`;
    for (const b of content) if (b.type === "text" && !String(b.text ?? "").trim()) return `messages.${i}: text content blocks must contain non-whitespace text`;

    const toolUses = content.filter((b) => b.type === "tool_use").map((b) => b.id as string);
    if (toolUses.length) {
      const next = messages[i + 1];
      const results = next
        ? blocks(next)
            .filter((b) => b.type === "tool_result")
            .map((b) => b.tool_use_id as string)
        : [];
      const missing = toolUses.find((id) => !results.includes(id));
      if (missing) return `messages.${i + 1}: \`tool_use\` ids were found without \`tool_result\` blocks immediately after: ${missing}`;
    }
    if (m.role === "user") {
      const prev = messages[i - 1];
      const prevUses = prev
        ? blocks(prev)
            .filter((b) => b.type === "tool_use")
            .map((b) => b.id)
        : [];
      for (const b of content)
        if (b.type === "tool_result" && !prevUses.includes(b.tool_use_id)) return `messages.${i}: unexpected \`tool_use_id\` found in \`tool_result\` blocks: ${String(b.tool_use_id)}`;
    }
  }

  // With thinking on, a request that continues a tool call must hand back that turn's thinking block first.
  // Claude Opus 5.5 always thinks (adaptive thinking cannot be turned off), so this applies unless thinking is explicitly disabled.
  if (thinking !== "disabled") {
    const last = blocks(messages[messages.length - 1]);
    if (last.some((b) => b.type === "tool_result")) {
      const assistant = messages[messages.length - 2];
      const first = assistant ? blocks(assistant)[0] : undefined;
      if (!first || (first.type !== "thinking" && first.type !== "redacted_thinking"))
        return `messages.${messages.length - 2}.content.0.type: Expected \`thinking\` or \`redacted_thinking\`, but found \`${first?.type}\`. When \`thinking\` is enabled, a final \`assistant\` message must start with a thinking block.`;
    }
  }
  return null;
}

function stream(blocks: FakeBlock[]): string {
  const ev = (o: Json) => `event: ${String(o.type)}\ndata: ${JSON.stringify(o)}\n\n`;
  const all: Array<FakeBlock | { type: "thinking" }> = [{ type: "thinking" }, ...blocks];
  let out = ev({
    type: "message_start",
    message: {
      id: "msg_fake",
      type: "message",
      role: "assistant",
      model: "claude-opus-5-5",
      content: [],
      stop_reason: null,
      usage: { input_tokens: 10, output_tokens: 1 },
    },
  });
  all.forEach((b, index) => {
    if (b.type === "thinking") {
      out += ev({
        type: "content_block_start",
        index,
        content_block: { type: "thinking", thinking: "", signature: "" },
      });
      out += ev({
        type: "content_block_delta",
        index,
        delta: {
          type: "thinking_delta",
          thinking: "Working out the next step.",
        },
      });
      out += ev({
        type: "content_block_delta",
        index,
        delta: { type: "signature_delta", signature: "c2lnbmF0dXJl" },
      });
    } else if (b.type === "text") {
      out += ev({
        type: "content_block_start",
        index,
        content_block: { type: "text", text: "" },
      });
      out += ev({
        type: "content_block_delta",
        index,
        delta: { type: "text_delta", text: b.text },
      });
    } else {
      out += ev({
        type: "content_block_start",
        index,
        content_block: {
          type: "tool_use",
          id: `toolu_${Math.random().toString(36).slice(2, 12)}`,
          name: b.name,
          input: {},
        },
      });
      out += ev({
        type: "content_block_delta",
        index,
        delta: {
          type: "input_json_delta",
          partial_json: JSON.stringify(b.input),
        },
      });
    }
    out += ev({ type: "content_block_stop", index });
  });
  const stop = blocks.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn";
  out += ev({
    type: "message_delta",
    delta: { stop_reason: stop, stop_sequence: null },
    usage: { output_tokens: 20 },
  });
  out += ev({ type: "message_stop" });
  return out;
}

const textOfLastUser = (messages: ApiMessage[]): string => {
  const last = messages[messages.length - 1];
  if (typeof last.content === "string") return last.content;
  return last.content
    .filter((b) => b.type === "text")
    .map((b) => String(b.text))
    .join(" ");
};

/**
 * How the stand-in Claude answers: a wall in Toronto gets a scope card, a
 * question about cost or getting started gets the closing card, anything
 * else a short answer; every reply ends with quick replies or the card.
 */
export function scriptedReply(body: Json): FakeBlock[] {
  const messages = body.messages as ApiMessage[];
  const last = messages[messages.length - 1];
  const continuing = typeof last.content !== "string" && last.content.some((b) => b.type === "tool_result") && !last.content.some((b) => b.type === "text");
  if (continuing)
    return [
      {
        type: "tool_use",
        name: "suggestReplies",
        input: {
          replies: ["What drawings do I need?", "How do we get started?"],
        },
      },
    ];

  const question = textOfLastUser(messages).toLowerCase();
  if (/cost|price|get started/.test(question))
    return [
      {
        type: "text",
        text: "Final pricing and timelines are tailored by our senior permit team to your property and municipality. The card below gets that started.",
      },
      {
        type: "tool_use",
        name: "presentDealCloserCard",
        input: {
          projectType: "load-bearing-wall-removal",
          municipality: "Toronto",
          stage: "",
          scopeSummary: "I want to remove a load-bearing wall in my Toronto house.",
          recommendedAction: "Scope review and quote",
        },
      },
    ];
  if (/load-bearing|wall/.test(question))
    return [
      {
        type: "text",
        text: "Removing a load-bearing wall in Toronto needs a building permit and structural design. Here is the scope.",
      },
      {
        type: "tool_use",
        name: "generateProjectScope",
        input: {
          projectType: "load-bearing-wall-removal",
          municipality: "Toronto",
          estimatedSqFt: null,
          structuralChanges: true,
          stage: "",
          summary: "Remove a load-bearing wall in a Toronto house.",
        },
      },
    ];
  return [
    {
      type: "text",
      text: "The scope card above lists the drawings: floor plans, and structural information for the new beam, posts and footings.",
    },
    {
      type: "tool_use",
      name: "suggestReplies",
      input: {
        replies: ["How do we get started and what does it cost?", "Do I need an engineer?"],
      },
    },
  ];
}

/** A fetch for createAnthropic({ fetch }) that checks every request and answers from the script. */
export function fakeAnthropicFetch(log: { requests: Json[]; rejected: string[] }) {
  return async (_url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse(String(init?.body)) as Json;
    log.requests.push(body);
    const problem = anthropicRequestProblem(body);
    if (problem) {
      log.rejected.push(problem);
      return new Response(
        JSON.stringify({
          type: "error",
          error: { type: "invalid_request_error", message: problem },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(stream(scriptedReply(body)), {
      headers: { "content-type": "text/event-stream" },
    });
  };
}
