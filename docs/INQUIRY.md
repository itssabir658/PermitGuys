# Project inquiry flow

The form on `/contact/` sends inquiries through a server action (`src/app/contact/actions.ts`). Everything that matters happens on the server in `src/lib/inquiry/handle.ts`.

## What happens on submit

1. **Browser checks.** The form runs the same validator as the server (`src/lib/validation/inquiry.ts`) for instant feedback, shows an error summary that links to each field, and disables the button while sending. Without JavaScript the form still works; the server does the checking.
2. **Spam screens.** Hidden honeypot field, a minimum fill time, a per-IP rate limit, and optional Cloudflare Turnstile. A blocked submission is told it was not sent; it never gets a fake success message.
3. **Server validation.** Every field is validated and normalized again. Control characters are stripped.
4. **Duplicate guard.** Each form carries a random submission id. A resubmitted id that was already delivered is not sent again. The same id is passed to Resend and webhooks as an idempotency key.
5. **Delivery.** The lead goes to every configured destination. It counts as sent only when at least one confirms it (a 2xx response, and a message id from Resend).
6. **Result.** The visitor sees one of: sent (with a reference), not connected, delivery failed, too many attempts, or blocked. In every case except "sent", what they typed stays in the form.

Logs contain the submission id and each destination's status only, never names, contact details or project descriptions.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| Name | Yes | |
| Email | Yes | Used as reply-to on the notification email |
| Phone | Only if phone is the preferred contact method | 10 to 15 digits |
| Preferred contact method | Yes | Email (default) or phone |
| Project type | Yes | Preselected when the visitor comes from a service page (`/contact/?service=deck-permits`) |
| Municipality or project location | Yes | Free text |
| Project stage | No | |
| Project description | Yes | 20 to 4,000 characters |
| Consent to be contacted about the inquiry | Yes | Links to the privacy policy |

Attribution sent with each lead (when available): UTM tags, `gclid`/`msclkid`, the referring site's host (never the full referring URL), the landing page and the service page the visitor came from.

## Environment variables

Configure at least one destination. With none, the form tells visitors their inquiry was not sent and to contact the business directly.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key with permission to send. Server-only. |
| `INQUIRY_EMAIL_FROM` | Sender, e.g. `PermitGuys Website <inquiries@permitguys.ca>`. The domain must be verified in Resend (SPF and DKIM DNS records). |
| `INQUIRY_EMAIL_TO` | Comma-separated recipient addresses. |
| `INQUIRY_WEBHOOK_URL` | HTTPS endpoint that receives the lead as JSON (Zapier, Make, n8n or a CRM's inbound webhook). |
| `INQUIRY_WEBHOOK_SECRET` | Optional. Signs the JSON body with HMAC-SHA256 in `X-PermitGuys-Signature: sha256=<hex>`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile. Set both. Loading it adds a Cloudflare script to the contact page; mention it in the privacy policy. |
| `INQUIRY_RATE_LIMIT_MAX`, `INQUIRY_RATE_LIMIT_WINDOW_MINUTES`, `INQUIRY_MIN_FILL_SECONDS` | Optional tuning. Defaults 5, 10 and 3. |

A destination with only some of its variables set is skipped and logged as a configuration problem.

## Adding a CRM

Write an adapter that implements `LeadDestination` in `src/lib/inquiry/delivery.ts`:

```ts
export interface LeadDestination {
  readonly name: string;
  deliver(lead: Lead): Promise<DeliveryResult>; // ok only when the CRM confirms
}
```

Return it from `configuredDestinations` when its environment variables are set, and add unit tests alongside `tests/delivery.test.ts`. `leadPayload()` gives the JSON shape most CRMs can map.

## Limits to know about

- The rate limit and duplicate guard are kept in memory per server instance. On serverless hosting with many instances they are best-effort. For a hard guarantee, back `RateLimiter` with a shared store such as Upstash Redis.
- Turnstile tokens are single-use; the widget resets after any unsuccessful submission.

## Analytics events

`src/lib/analytics.ts` pushes these events to `window.dataLayer`, but only if a tag manager has created it. Nothing is installed today, so nothing is sent.

| Event | When |
| --- | --- |
| `inquiry_form_start` | First focus inside the form |
| `inquiry_form_submit` | A submission that passed browser validation is sent to the server (params: `project_type`, `preferred_contact`) |
| `inquiry_form_success` | The server confirmed delivery |
| `click_to_call` | A `tel:` link is clicked (param `link_location`) |
| `click_to_email` | A `mailto:` link is clicked (param `link_location`) |

No event carries personal information. Whoever installs Google Tag Manager or GA4 must set up consent (for example Google Consent Mode with a consent banner) and update the privacy policy before turning on tags.
