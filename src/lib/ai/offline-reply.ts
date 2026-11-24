import type { LanguageModelV4CallOptions, LanguageModelV4StreamPart, LanguageModelV4StreamResult } from "@ai-sdk/provider";
import { site } from "@/content/site";
import { municipalityFor } from "./knowledge-base";
import type { ProjectTypeKey } from "./project-types";

/*
 * The strategist's last line of defence. When no model can answer (the API
 * key is rejected, Anthropic is down, every request timed out), the turn is
 * answered by this stand-in instead of an error: a short, honest reply built
 * from the site's own contact details, followed by the closing card with the
 * visitor's question already filled in, so they can still hand the project
 * to the team. It is a normal tool call, so the card, the lead hand-off and
 * the conversation history all work exactly as for a model reply.
 *
 * Nothing here is invented: the phone, email and hours come from
 * src/content/site.ts, and the card never states a price or a date.
 */

const BOOKING = /\b(appointment|book|booking|schedule|meet|meeting|consult|consultation|call ?back|visit|site visit)\b/i;

/** Rough project type from the visitor's words, so the card starts close to right. The team confirms it. */
const TYPE_HINTS: [RegExp, ProjectTypeKey][] = [
  [/basement (apartment|unit|suite)|second unit|secondary (unit|suite)|legal basement|in-law suite/i, "legal-basement-apartment"],
  [/laneway|garden suite|coach house/i, "garden-or-laneway-suite"],
  [/side (door|entrance)|walk-?out|walk-?up|below[- ]grade|separate entrance/i, "below-grade-entrance"],
  [/load[- ]bearing|remove (a |the )?wall|open concept|wall removal/i, "load-bearing-wall-removal"],
  [/basement/i, "finished-basement"],
  [/addition|extension|second (storey|story|floor)|rear extension/i, "residential-addition"],
  [/custom home|new home|new house|rebuild|knock ?down/i, "custom-home"],
  [/\bdeck\b|porch/i, "deck"],
  [/garage/i, "detached-garage"],
  [/commercial|office|restaurant|retail|store|clinic|warehouse|tenant/i, "commercial"],
  [/triplex|fourplex|multiplex|multi-?unit|apartment building/i, "multi-unit-residential"],
  [/minor variance|committee of adjustment/i, "committee-of-adjustment"],
  [/renovat|kitchen|bathroom|interior/i, "interior-renovation"],
];

type Prompt = LanguageModelV4CallOptions["prompt"];

/** The visitor's own words in this conversation, latest first. */
export function visitorTexts(prompt: Prompt): string[] {
  const texts: string[] = [];
  for (const m of prompt) {
    if (m.role !== "user") continue;
    const text = m.content
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) texts.push(text);
  }
  return texts.reverse();
}

export function guessProjectType(texts: readonly string[]): ProjectTypeKey {
  for (const text of texts) for (const [re, key] of TYPE_HINTS) if (re.test(text)) return key;
  return "other";
}

export function offlineReplyText(latest: string): string {
  const { phone, email, hours } = site.contact;
  const reach = [phone ? `call us at ${phone}` : null, email ? `email ${email}` : null].filter(Boolean).join(" or ");
  // "Weekdays 9:00 AM to 5:00 PM. Weekends by appointment only." -> "weekdays 9:00 AM to 5:00 PM; weekends by appointment only"
  const when = hours
    ? ` (${hours
        .replace(/\.$/, "")
        .replace(/\. (\w)/g, (_, c: string) => `; ${c.toLowerCase()}`)
        .replace(/^\w/, (c) => c.toLowerCase())})`
    : "";
  const opening = BOOKING.test(latest)
    ? "Yes, our team books consultations directly. Add your name, phone and email to the card below and they will call you to set a time."
    : "Our permit strategist is taking a short break, so a member of our team will answer this one personally. Your question is already on the card below: add your name, phone and email and they will follow up.";
  return `${opening}${reach ? ` If you would rather talk now, ${reach}${when}.` : ""}`;
}

/** The closing card's input, from what the visitor has said so far. */
export function offlineCardInput(texts: readonly string[]) {
  const municipality = texts.map((t) => municipalityFor(t)?.name).find(Boolean) ?? "";
  const summary = texts
    .slice(0, 3)
    .reverse()
    .join(" ")
    .slice(0, 690);
  return {
    projectType: guessProjectType(texts),
    municipality,
    stage: "" as const,
    scopeSummary: summary || "I would like to talk to the team about my project.",
    recommendedAction: BOOKING.test(texts[0] ?? "") ? ("Priority call back" as const) : ("Scope review and quote" as const),
  };
}

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

/** A model-shaped reply (text, then the closing card) for a step no model could answer. */
export function offlineReply(params: LanguageModelV4CallOptions): LanguageModelV4StreamResult {
  const texts = visitorTexts(params.prompt);
  const id = `offline-${crypto.randomUUID().slice(0, 8)}`;
  const hasCard = params.tools?.some((t) => t.name === "presentDealCloserCard") ?? false;
  const parts: LanguageModelV4StreamPart[] = [
    { type: "stream-start", warnings: [] },
    { type: "response-metadata", id, modelId: "offline-reply", timestamp: new Date() },
    { type: "text-start", id: `${id}-text` },
    { type: "text-delta", id: `${id}-text`, delta: offlineReplyText(texts[0] ?? "") },
    { type: "text-end", id: `${id}-text` },
    ...(hasCard
      ? [{ type: "tool-call", toolCallId: `${id}-card`, toolName: "presentDealCloserCard", input: JSON.stringify(offlineCardInput(texts)) } as LanguageModelV4StreamPart]
      : []),
    { type: "finish", usage, finishReason: { unified: hasCard ? "tool-calls" : "stop", raw: "offline" } },
  ];
  return {
    stream: new ReadableStream<LanguageModelV4StreamPart>({
      start(controller) {
        for (const p of parts) controller.enqueue(p);
        controller.close();
      },
    }),
  };
}
