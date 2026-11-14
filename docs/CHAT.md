# Permit strategist (website assistant)

An AI permit strategist in the corner of every page. It answers questions about PermitGuys and about how building permits work in the GTA, scopes the visitor's project on a drawing-sheet card, checks renovation scenarios, and closes with a one-step card that sends the visitor's request to the team. It runs on Claude through the Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`).

## Turning it on

1. Create an API key in the Anthropic Console and add it to the Vercel project as `ANTHROPIC_API_KEY` (Production, and Preview if you want it on branch previews).
2. Make sure leads have somewhere to go: Resend (`RESEND_API_KEY`, `INQUIRY_EMAIL_FROM`, `INQUIRY_EMAIL_TO`) and/or a webhook (`INQUIRY_WEBHOOK_URL`, or its other name `LEAD_WEBHOOK_URL`). Without one, the closing card tells the visitor the request can't be sent and offers the phone number and form (see docs/INQUIRY.md).
3. Redeploy. The layout decides at build time whether to include the assistant, so a key added later appears after the next deployment.

Without a key the widget is not rendered and `/api/chat` answers 503, so nothing breaks and nothing is sent anywhere.

Optional settings (`.env.example`): `CHAT_MODEL` (default `claude-opus-5-5`), `CHAT_RATE_LIMIT_MAX` and `CHAT_RATE_LIMIT_WINDOW_MINUTES` (default 30 messages per visitor IP per 10 minutes).

## How a conversation goes

The instructions (`src/lib/ai/system-prompt.ts`) follow four stages:

1. **Diagnose**: project type, municipality, stage (idea, planning, ready for drawings, contractor hired, review comments, or work started / stop-work order), one question per turn, skipping anything the visit context already shows.
2. **Authority and value**: the drawing set the site lists for that kind of project, and how a complete set avoids revision rounds. Objections ("why not my contractor", "how long does the city take", "what if the city asks for revisions", cost, "do I need a permit", "I already started") are answered from `objections` in the knowledge base.
3. **Interactive scoping**: `generateProjectScope` and `checkPermitComplianceRisk` render cards.
4. **The close**: `presentDealCloserCard` renders the closing card with everything already learned; the visitor adds name, phone, email and, optionally, the property address.

Every reply ends with `suggestReplies`: two or three one-tap replies under the message.

## Files

- `src/lib/ai/knowledge-base.ts`: `PERMIT_GUYS_KNOWLEDGE`, built from the content files (site facts, services with their drawing sets, cost and timeline factors, FAQs, guides, process, other work, the GTA permit reference, review time frames, objections). Retired services (landlord permits) are filtered out. `pendingBusinessInputs` holds the facts only PermitGuys can supply, all `null` for now (see below).
- `src/lib/ai/project-types.ts`: the project types and scenarios the tools accept, and how each maps to a service page and to the inquiry form's project types.
- `src/lib/ai/tools.ts`: the tools. Their results are assembled from the knowledge base, never written by the model.
  - `generateProjectScope(projectType, municipality, estimatedSqFt, structuralChanges, stage, summary)`: drawing set by discipline, city review window (only where the site publishes one: Toronto), turnaround and package (confirmed in the quote until supplied), points to watch (structure, the 600 m² Architects Act threshold, review comments, stop-work orders), what the municipality publishes.
  - `checkPermitComplianceRisk(scenario, municipality, details)`: Building Code points the drawings address, zoning and Committee of Adjustment notes, other approvals (ESA, Ontario One Call, conservation authorities), what the municipality publishes, how PermitGuys handles it.
  - `presentDealCloserCard(projectType, municipality, stage, scopeSummary, recommendedAction)`: the closing card.
  - `suggestReplies(replies)`: quick replies; the turn ends after it (`hasToolCall`).
- `src/lib/ai/submit-lead.ts`: `submitClosedLead`, behind `POST /api/lead/`. Contact details go from the card straight here, never through the model. It re-checks everything with the inquiry form's validation, rebuilds the scope from its inputs, and delivers through the same pipeline as the form (`src/lib/inquiry/delivery.ts`) with `source: "website-assistant"` and an `assistant` block: property address, best time to call, the scope, the conversation's visible text and the visit summary. Same honeypot, time trap, rate limit and duplicate guard as the form. Turnstile is not used on this path.
- `src/lib/ai/chat-handler.ts` and `src/app/api/chat/route.ts`: `POST /api/chat/`. Origin check, rate limit, message validation against the tools' schemas, then `streamText` with Opus at low effort, prompt caching on the tools and rules, and the visitor's snapshot as a second, uncached system message. Reasoning is not sent to the browser.
- `src/lib/ai/visitor-snapshot.ts` and `src/context/VisitorTelemetryContext.tsx`: the visit summary (below).
- `src/lib/ai/context-prompts.ts`: the pill's line and starter questions for each service page, guide and homepage section.
- `src/components/ai/PermitAdvisorWidget.tsx`: launcher, context pill, panel (full-screen sheet on phones, with the page held still), messages, quick replies. `AdvisorCards.tsx`: scope card (drawing sheet on charcoal), permit check card, closing card. `advisor.css`: the pill and cards; motion is CSS opacity and transform only, and off with reduced motion.
- `src/components/chat/AskShowcase.tsx`: the homepage showcase. Asking opens the strategist with the question (`pg:chat-ask`).

## Visit summary (first-party telemetry)

`VisitorTelemetryProvider` (mounted in the root layout) notes, in the visitor's own tab (sessionStorage, `pg_visit`): pages viewed, the section crossing the middle of the screen (one IntersectionObserver), sections viewed, clicks on calls to action (contact, services, guides, phone and email links by kind only, anything marked `data-telemetry-cta`), project choices in forms (`projectType`, `municipality`, `stage`, or fields marked `data-telemetry-field`; never names, contact details or descriptions), time on site, the referring host and UTM tags (from the existing attribution). No cookies, no third-party trackers, nothing sent on its own: the summary goes with a chat message (to Anthropic) and with a request the visitor submits (to PermitGuys). The privacy policy says so. `sanitizeSnapshot` re-checks it on the server and drops anything that looks like an email or phone number.

## PLACEHOLDERS for PermitGuys

Set these in `pendingBusinessInputs` (`src/lib/ai/knowledge-base.ts`), in the firm's own words, to let the cards show them. Until then the assistant says "To be confirmed by PermitGuys in your quote" and never estimates:

- `draftingTurnaround`: how long the drawings typically take.
- `packages`: package names, what each includes, and a starting price if you publish one.
- `revisionPolicy`: what happens when the municipality asks for revisions.
- `responseTime`: how soon the team replies to a request ("within one business day").

Also still open: which municipalities the firm confirms it serves (`src/content/locations.ts`; until then the assistant says the team confirms), and a review of the GTA permit reference (`src/content/gta-permits.ts`).

## Privacy and cost

- Messages and the visit summary go to Anthropic to write replies. The site stores no conversations; server logs record only errors and lead delivery outcomes.
- A reply reads about 15,000 cached prompt tokens and writes a short answer; a turn with a scope card is two model steps. Watch usage in the Anthropic Console and set a monthly spend limit there.
- Rate limits are in memory per server instance, like the inquiry form's.

## Analytics

`chat_open`, `chat_message`, `advisor_scope_cta` and `advisor_lead_sent` are pushed to the tag manager's data layer when one is installed (`src/lib/analytics.ts`). No message text or contact details are included.

## Tests

`npm test` covers the knowledge base, the tools, the snapshot, the prompt's rules, `/api/chat` with a mock model and `submitClosedLead`. `e2e/chat.spec.ts` drives the widget against a mocked `/api/chat` and the real `/api/lead` (mock webhook); it runs only on a build made with a key: `ANTHROPIC_API_KEY=test npm run build && npm run test:e2e`.
