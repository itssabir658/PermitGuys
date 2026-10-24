/*
 * Analytics events, prepared for a tag manager. `track` pushes to
 * window.dataLayer only if a tag manager has created it, so nothing is
 * collected or sent until the business installs one. Whoever installs it
 * must configure consent (for example Google Consent Mode) and update the
 * privacy policy. Event parameters never include personal information.
 */

export type AnalyticsEvent =
  | "inquiry_form_start"
  | "inquiry_form_submit"
  | "inquiry_form_success"
  | "click_to_call"
  | "click_to_email"
  | "chat_open"
  | "chat_message"
  | "chat_handoff";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, params: Params = {}) {
  if (typeof window === "undefined" || !Array.isArray(window.dataLayer)) return;
  window.dataLayer.push({ event, ...params });
}
