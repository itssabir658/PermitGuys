# Website assistant

A chat assistant in the corner of every page. It answers questions about PermitGuys and about how building permits generally work in Ontario, and when a visitor is ready it fills in the project half of the inquiry form for them to review and send. It runs on Claude (Anthropic API).

## Turning it on

1. Create an API key in the Anthropic Console and add it to the Vercel project as `ANTHROPIC_API_KEY` (Production, and Preview if you want it on branch previews).
2. Redeploy. The layout decides at build time whether to include the assistant, so a key added later appears after the next deployment.

Without a key the launcher is not rendered at all and `/api/chat` answers every request with `not_configured`, so nothing breaks and nothing is sent anywhere.

Optional settings (`.env.example`): `CHAT_MODEL` (default `claude-opus-5-5`), `CHAT_RATE_LIMIT_MAX` and `CHAT_RATE_LIMIT_WINDOW_MINUTES` (default 30 messages per visitor IP per 10 minutes).

## How it works

- `src/components/chat/ChatAssistant.tsx`: the launcher and panel. The transcript lives in the visitor's tab (sessionStorage) and is posted to `/api/chat` with each message. On phones the panel is a full-screen sheet and the page is held still (`engine.lock("chat")`).
- `src/app/api/chat/route.ts`: rejects other sites' pages (Origin check) and streams the reply as newline-delimited JSON events.
- `src/lib/chat/respond.ts`: rate limit, input checks (`conversation.ts`), and the call to Claude. Low effort for short, quick answers; the server-side fallback is on, so a request the model declines for policy reasons is retried on its default fallback model. Earlier turns are sent back as plain text only.
- `src/lib/chat/knowledge.ts`: the instructions and the knowledge, built from the same content files as the pages (`site.ts`, services, guides, FAQs, process, other work). Edit the content files and the assistant knows the change after the next deployment. The prompt is identical on every request, so it is served from the prompt cache.
- `src/content/gta-permits.ts`: the GTA permit reference. What the Province, the OAA, TRCA and 17 GTA municipalities (Toronto; Mississauga, Brampton, Caledon; Oakville, Burlington, Milton, Halton Hills; Vaughan, Markham, Richmond Hill, Aurora, Newmarket; Pickering, Ajax, Whitby, Oshawa) publish for homeowners: what needs a permit, extra units, how to apply and who to call. Each line comes from the official page listed with it, as read on the date in `GTA_PERMITS_CHECKED_ON`. Fees and review times are left out on purpose. The assistant says where a rule comes from, links that page, and only links official sources listed there. **Have someone at PermitGuys review it, and re-check the pages every few months**: municipalities change these pages without notice. Vaughan's pages could not be read when the reference was built, so the assistant only links them.
- `src/lib/chat/handoff.ts`: the `prepare_inquiry` tool. The model can only choose project types and stages the form offers; everything is checked again before it reaches the browser. The contact form reads the draft from sessionStorage (or a window event if the form is already open) and fills only fields the visitor has not touched.

## Rules the assistant follows

The instructions carry the site's content rules: answer only from the site's own content; no prices, fees, timelines or approval promises; no permit requirements stated as certain for a property; no invented facts, clients or service areas; nobody called an engineer; no claim that PermitGuys files applications; no site-specific structural or legal advice; never collect names, emails, phone numbers or addresses (the form does that); stay on topic. Tests in `tests/chat.test.ts` check that these rules are in the prompt.

When a business fact changes (for example a confirmed list of municipalities in `locations.ts`), the assistant picks it up from the content files.

## Privacy and cost

- Messages go to Anthropic to generate replies. The site stores no conversations; server logs record only errors. The privacy policy says so.
- A typical reply reads about 13,000 cached prompt tokens and writes a short answer. Watch usage in the Anthropic Console and set a monthly spend limit there.
- The rate limit is in memory per server instance, like the inquiry form's. For stronger guarantees, back it with a shared store.

## Analytics

`chat_open`, `chat_message` and `chat_handoff` are pushed to the tag manager's data layer when one is installed (`src/lib/analytics.ts`). No message text is included.

## Tests

`npm test` covers input checks, the hand-off, the prompt's rules and the streaming logic with a stand-in client. `e2e/chat.spec.ts` drives the widget against a mocked `/api/chat`; it runs only on a build made with a key, for example `ANTHROPIC_API_KEY=test npm run build && npm run test:e2e`.
