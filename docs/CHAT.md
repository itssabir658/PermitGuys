# Permit strategist (website assistant)

An AI permit strategist in the corner of every page. It answers questions about PermitGuys and about how building permits work in the GTA, scopes the visitor's project on a drawing-sheet card, checks renovation scenarios, and closes with a one-step card that sends the visitor's request to the team. It runs on Claude through the Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`).

## Turning it on

1. Create an API key in the Anthropic Console and add it to the Vercel project as `ANTHROPIC_API_KEY` (Production, and Preview if you want it on branch previews).
2. Make sure leads have somewhere to go (see "Leads to the owners" below). The minimum is `RESEND_API_KEY`: lead emails then go to Mzaman@permitguys.ca by default. Add WhatsApp (`WHATSAPP_CALLMEBOT_API_KEY`, or `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`) and/or `LEAD_WEBHOOK_URL` for more channels. With none, the closing card tells the visitor the request can't be sent and offers the phone, WhatsApp and the form, and possible-lead summaries are dropped with an error in the logs.
3. Redeploy. The layout decides at build time whether to include the assistant, so a key added later appears after the next deployment.

Without a key the widget is not rendered and `/api/chat` answers 503, so nothing breaks and nothing is sent anywhere.

Optional settings (`.env.example`): `ANTHROPIC_MODEL` (default `claude-sonnet-4-5`; the older name `CHAT_MODEL` still works, and `ANTHROPIC_MODEL` wins if both are set), `CHAT_RATE_LIMIT_MAX` and `CHAT_RATE_LIMIT_WINDOW_MINUTES` (default 30 messages per visitor IP per 10 minutes).

## How a conversation goes

The instructions (`src/lib/ai/system-prompt.ts`) follow four stages:

1. **Diagnose**: project type, municipality, stage (idea, planning, ready for drawings, contractor hired, review comments, or work started / stop-work order), one question per turn, skipping anything the visit context already shows.
2. **Authority and value**: the drawing set the site lists for that kind of project, and how a complete set avoids revision rounds. Objections ("why not my contractor", "how long does the city take", "what if the city asks for revisions", cost, "do I need a permit", "I already started") are answered from `objections` in the knowledge base.
3. **Interactive scoping**: `generateProjectScope` and `checkPermitComplianceRisk` render cards.
4. **The close, stopping before quoting**: the assistant guides the diagnosis and the scope, then stops right before any price or turnaround. As soon as the scope is clear, or the visitor asks how much or how long, it says final pricing and timelines are tailored by the senior permit team to their property and municipality, and calls `presentDealCloserCard` in the same turn. The card shows "Custom fixed-fee quote & exact timeline prepared directly by PermitGuys upon handoff." where a price would be; the visitor adds name, phone, email and, optionally, the property address.

Every reply ends with `suggestReplies`: two or three one-tap replies under the message.

## Files

- `src/lib/ai/knowledge-base.ts`: `PERMIT_GUYS_KNOWLEDGE`, built from the content files (site facts, services with their drawing sets, cost and timeline factors, FAQs, guides, process, other work, the GTA permit reference, review time frames, objections). Retired services (landlord permits) are filtered out. `pendingBusinessInputs` holds the facts only PermitGuys can supply, all `null` for now (see below).
- `src/lib/ai/project-types.ts`: the project types and scenarios the tools accept, and how each maps to a service page and to the inquiry form's project types.
- `src/lib/ai/tools.ts`: the tools. Their results are assembled from the knowledge base, never written by the model.
  - `generateProjectScope(projectType, municipality, estimatedSqFt, structuralChanges, stage, summary)`: drawing set by discipline, city review window (only where the site publishes one: Toronto), turnaround and package (confirmed in the quote until supplied), points to watch (structure, the 600 m² Architects Act threshold, review comments, stop-work orders), what the municipality publishes.
  - `checkPermitComplianceRisk(scenario, municipality, details)`: Building Code points the drawings address, zoning and Committee of Adjustment notes, other approvals (ESA, Ontario One Call, conservation authorities), what the municipality publishes, how PermitGuys handles it.
  - `presentDealCloserCard(projectType, municipality, stage, scopeSummary, recommendedAction)`: the closing card.
  - `suggestReplies(replies)`: quick replies; the turn ends after it (`hasToolCall`).
- `src/lib/ai/submit-lead.ts`: `submitClosedLead`, behind `POST /api/lead/`. Contact details go from the card straight here, never through the model. It re-checks everything with the inquiry form's validation, rebuilds the scope from its inputs, and sends a CLOSED LEAD (`notify-owners.ts`) with the form's lead payload, `source: "website-assistant"` and an `assistant` block: property address, best time to call, the scope, the conversation's visible text and the visit summary. Same honeypot, time trap, rate limit and duplicate guard as the form. Turnstile is not used on this path.
- `src/lib/ai/chat-handler.ts` and `src/app/api/chat/route.ts`: `POST /api/chat/`. Origin check, rate limit, a lenient read of the conversation (`src/lib/ai/history.ts`), then `streamText` with Claude Sonnet 4.5 and no extended thinking (`src/lib/ai/model-options.ts` sends `effort`, server-side `fallbacks` and thinking settings only to models that accept them), prompt caching on the tools and rules, and the visitor's snapshot as a second, uncached system message. Reasoning is not sent to the browser.
- `src/lib/ai/history.ts`: the conversation history Claude gets. Earlier assistant turns arrive from the browser with tool cards, step markers and metadata in any shape; only the visitor's text is checked. Each earlier turn reaches Claude as plain text plus one bracketed line per card shown (`[Project scope card shown: …]`, `[Quick replies offered: …]`), in a strict user/assistant alternation with nothing empty. Why: Opus 5.5 always thinks, the browser never gets the thinking, and every turn ends on a tool call, so handing back the raw tool calls made Anthropic refuse every follow-up (fixed 2026-11-17). Every tool has a server-side `execute`, so a turn never waits on the browser.
- `src/lib/ai/visitor-snapshot.ts` and `src/context/VisitorTelemetryContext.tsx`: the visit summary (below).
- `src/lib/ai/context-prompts.ts`: the pill's line and starter questions for each service page, guide and homepage section.
- `src/components/ai/PermitAdvisorWidget.tsx`: launcher, context pill, panel (full-screen sheet on phones, with the page held still), messages, quick replies. `AdvisorCards.tsx`: scope card (drawing sheet on charcoal), permit check card, closing card. `advisor.css`: the pill and cards; motion is CSS opacity and transform only, and off with reduced motion.
- `src/components/chat/AskShowcase.tsx`: the homepage showcase. Asking opens the strategist with the question (`pg:chat-ask`).

## Leads to the owners

Owner contact defaults (`src/lib/ai/owner-contact.ts`, confirmed by Sebra 2026-11-15), each overridable: `LEAD_NOTIFICATION_EMAIL` = `Mzaman@permitguys.ca`, `OWNER_WHATSAPP_NUMBER` = `16479686284` (shown as +1 (647) 968-6284; the card's button reads `NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER`), `RESEND_FROM_EMAIL` = `PermitGuys AI Strategist <advisor@permitguys.ca>`.

Every conversation that matters reaches the owners (`src/lib/ai/notify-owners.ts`) on every configured channel at once (`Promise.allSettled`); a lead counts as delivered when one channel confirms:

1. **Email** (Resend, `RESEND_API_KEY`): an HTML lead dossier (`src/lib/ai/lead-email.ts`) with contact details, a "Reply to visitor on WhatsApp" button when there is a phone number, the scoped drawing set, the visitor's questions, the full conversation and the pages and sections viewed. If Resend refuses the sender (403/422, domain not verified), the owners' copy is retried from `PermitGuys AI <onboarding@resend.dev>`. Resend delivers that address only to the Resend account's own email addresses, so the Resend account should belong to Mzaman@permitguys.ca until permitguys.ca is verified; the visitor's confirmation is only sent from the verified sender.
2. **WhatsApp push** to the owner's number: a short summary (status, name, phone, email, municipality, project, scope, drawings, key chat lines), through the Meta WhatsApp Cloud API (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`; free-form text only reaches the owner within 24 hours of the owner last messaging the business number, otherwise Meta needs an approved template) and/or CallMeBot (`WHATSAPP_CALLMEBOT_API_KEY`, which the owner gets by messaging CallMeBot once from their phone).
3. **Webhook** (`LEAD_WEBHOOK_URL`): the full JSON with `leadStatus`, `sessionId` and `whatsappSummary`, for Make, Zapier or Twilio.

| When | Email subject | `leadStatus` |
| --- | --- | --- |
| The visitor sends the closing card | `🔥 [CLOSED LEAD] {Project type} in {Municipality} — {Name} ({Phone})`, plus a confirmation email to the visitor | `closed_handoff` (`origin: "closing_card"`) |
| The visitor types a phone number or email in a chat message | `🔥 [CLOSED LEAD] {Project type} in {Municipality} — {Name or "Visitor"} ({Phone or email})` | `closed_handoff` (`origin: "chat_message"`) |
| The visitor chatted and went idle for 2 minutes, closed the chat, or hid or left the page, without sending the card | `👀 [POSSIBLE LEAD — CHAT SUMMARY] {Project type or first question} in {Municipality} (Visitor Left)` | `possible_lead_abandoned` (`origin: "chat_summary"`, `reason`) |

The closing card (and its confirmation) also has a **"Message Scope on WhatsApp (+1 647-968-6284)"** button: it opens `wa.me/16479686284` with the reference, municipality, project type and drawing set written out, for the visitor to send.

- **Possible leads** (`src/lib/ai/session-summary.ts`, `POST /api/chat/session-summary/`): the browser (`src/components/ai/session-summary.ts`) sends the conversation's text, the visit summary and the latest scope's inputs with `navigator.sendBeacon` on page exit, or a keepalive fetch when idle or closed, once there is at least one exchange. The server extracts the project type, municipality, the visitor's questions and any name, phone, email or street address with plain pattern matching (no second model call) into a dossier: status badge, extracted details, full transcript, and the visit (pages viewed, sections read, buttons clicked, time on site).
- **Once each**: a summary is sent once per session and message count (a visitor who returns and chats more produces a newer summary); typed contact details once per session and details. When the card is sent, the session becomes a closed lead: the CLOSED LEAD email says "Upgraded from POSSIBLE LEAD" when a summary went out earlier (`upgradedFromPossibleLead: true` in the webhook) and no more summaries are sent. This bookkeeping (`src/lib/ai/lead-sessions.ts`) is in memory per server instance, like the rate limits, so across instances a webhook receiver should merge records by `sessionId`.
- The chat window says the conversation and pages viewed are shared with the PermitGuys team, and the privacy policy describes it. Nothing is stored in a database.

## Visit summary (first-party telemetry)

`VisitorTelemetryProvider` (mounted in the root layout) notes, in the visitor's own tab (sessionStorage, `pg_visit`): pages viewed, the section crossing the middle of the screen (one IntersectionObserver), sections viewed, clicks on calls to action (contact, services, guides, phone and email links by kind only, anything marked `data-telemetry-cta`), project choices in forms (`projectType`, `municipality`, `stage`, or fields marked `data-telemetry-field`; never names, contact details or descriptions), time on site, the referring host and UTM tags (from the existing attribution). No cookies, no third-party trackers: the summary goes with a chat message (to Anthropic), with a request the visitor submits, and with a possible-lead summary once they have chatted (to PermitGuys). The privacy policy says so. `sanitizeSnapshot` re-checks it on the server and drops anything that looks like an email or phone number.

## PLACEHOLDERS for PermitGuys

Set these in `pendingBusinessInputs` (`src/lib/ai/knowledge-base.ts`), in the firm's own words, to let the cards show them. Until then the cards say "Custom fixed-fee quote & exact timeline prepared directly by PermitGuys upon handoff." and the assistant never estimates:

- `draftingTurnaround`: how long the drawings typically take.
- `packages`: package names, what each includes, and a starting price if you publish one.
- `revisionPolicy`: what happens when the municipality asks for revisions.
- `responseTime`: how soon the team replies to a request ("within one business day").

Also still open: which municipalities the firm confirms it serves (`src/content/locations.ts`; until then the assistant says the team confirms), and a review of the GTA permit reference (`src/content/gta-permits.ts`).

## Privacy and cost

- Messages and the visit summary go to Anthropic to write replies, and every conversation goes to the PermitGuys team as above. The site stores no conversations in a database; server logs record only errors and delivery outcomes, never message text or contact details.
- Prompt caching: Anthropic caches the prefix in the order tools, then system. There are two breakpoints: one on the last tool (`suggestReplies`, so all four tool definitions are cached) and one on `STATIC_SYSTEM_PROMPT` (persona, four-stage closing framework, the stop-before-quoting hand-off, every drawing set, the GTA municipal reference and the rest of `PERMIT_GUYS_KNOWLEDGE`). `buildDynamicVisitorContext()` comes after the breakpoint. Keep the static prompt deterministic: no request dates, ids or visit data, or every turn pays full price again. The cache lasts five minutes from its last use; check `cache_read_input_tokens` in the Anthropic Console logs to see it working.
- A reply reads about 15,000 cached prompt tokens and writes a short answer; a turn with a scope card is two model steps. Watch usage in the Anthropic Console and set a monthly spend limit there.
- Rate limits are in memory per server instance, like the inquiry form's.

## Analytics

`chat_open`, `chat_message`, `advisor_scope_cta` and `advisor_lead_sent` are pushed to the tag manager's data layer when one is installed (`src/lib/analytics.ts`). No message text or contact details are included.

## Tests

`npm test` covers the knowledge base, the tools, the snapshot, the prompt's rules, `/api/chat` with a mock model, the closed hand-off (`submitClosedLead`: CLOSED LEAD email, visitor confirmation, `closed_handoff` webhook), contact typed in the chat, and the drop-off summary (`possible_lead_abandoned`, once per message count, upgrade to closed) in `tests/lead-capture.test.ts`. `e2e/chat.spec.ts` drives the widget against a mocked `/api/chat` and the real `/api/lead` (mock webhook); it runs only on a build made with a key: `ANTHROPIC_API_KEY=test npm run build && npm run test:e2e`.

Follow-up turns: `tests/advisor-multiturn.test.ts` (the AI SDK's `Chat` client) and `e2e/chat-multiturn.spec.ts` (the real widget) hold a three-turn conversation (a question, a quick-reply tap, a typed "how do we get started and what does it cost?") through the real handler and Anthropic provider, against `tests/fake-anthropic.ts`: a stand-in API that answers like Opus 5.5 (thinking first) and refuses any request the real API would refuse. The e2e file also checks the Try again button after a failed reply.
