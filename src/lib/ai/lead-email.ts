import type { TranscriptLine } from "./chat-dossier";

/*
 * The lead dossier the team receives, as an HTML email (with a plain-text
 * twin for mail apps that prefer it). One layout for every kind of lead:
 * a status badge, contact details with a "Reply to visitor on WhatsApp"
 * button when there is a phone number, the project and its drawing set, the
 * visitor's questions, the full conversation and the visit.
 */

export interface LeadEmailModel {
  badge: string;
  tone: "closed" | "possible";
  intro: string;
  contact: [string, string][];
  project: [string, string][];
  drawings: { discipline: string; items: string[] }[];
  questions: string[];
  transcript: TranscriptLine[];
  visit: string[];
  /** wa.me link to the visitor, when they gave a phone number. */
  whatsappReply: string | null;
  footer: [string, string][];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rowsOf = (rows: [string, string][]) => rows.filter(([, v]) => v);

export function leadText(m: LeadEmailModel): string {
  const contact = rowsOf(m.contact);
  return [
    m.badge,
    "",
    m.intro,
    "",
    "Contact details:",
    ...(contact.length ? contact.map(([k, v]) => `${k}: ${v}`) : ["None given"]),
    ...(m.whatsappReply ? [`Reply on WhatsApp: ${m.whatsappReply}`] : []),
    "",
    "Project:",
    ...rowsOf(m.project).map(([k, v]) => `${k}: ${v}`),
    ...(m.drawings.length ? ["", "Scoped drawing set:", ...m.drawings.flatMap((g) => g.items.map((i) => `- ${g.discipline}: ${i}`))] : []),
    "",
    "Questions and concerns:",
    ...(m.questions.length ? m.questions.map((q) => `- ${q}`) : ["- None asked as a question"]),
    "",
    "Visit (first-party, this site only):",
    ...m.visit,
    "",
    "Full conversation:",
    ...(m.transcript.length ? m.transcript.map((t) => `${t.role === "visitor" ? "Visitor" : "Assistant"}: ${t.text}`) : ["No messages."]),
    "",
    ...rowsOf(m.footer).map(([k, v]) => `${k}: ${v}`),
  ].join("\n");
}

const table = (rows: [string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">${rowsOf(rows)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b6b66;white-space:nowrap;vertical-align:top;width:1%">${esc(k)}</td><td style="padding:6px 0;color:#111110;vertical-align:top">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;

const heading = (s: string) => `<h2 style="margin:28px 0 10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b6b66;font-weight:600">${esc(s)}</h2>`;

export function leadHtml(m: LeadEmailModel): string {
  const accent = m.tone === "closed" ? "#c8102e" : "#2b2b28";
  const button = m.whatsappReply
    ? `<p style="margin:16px 0 0"><a href="${esc(m.whatsappReply)}" style="display:inline-block;background:#1f8f4e;color:#ffffff;text-decoration:none;padding:11px 18px;font-size:14px;font-weight:600;border-radius:2px">Reply to visitor on WhatsApp</a></p>`
    : "";
  const drawings = m.drawings.length
    ? heading("Scoped drawing set") +
      m.drawings
        .map(
          (g) =>
            `<p style="margin:10px 0 4px;font-size:13px;font-weight:600;color:#111110">${esc(g.discipline)}</p><ul style="margin:0;padding-left:18px;font-size:14px;color:#111110">${g.items.map((i) => `<li style="margin:3px 0">${esc(i)}</li>`).join("")}</ul>`,
        )
        .join("")
    : "";
  const questions = m.questions.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111110">${m.questions.map((q) => `<li style="margin:3px 0">${esc(q)}</li>`).join("")}</ul>`
    : `<p style="margin:0;font-size:14px;color:#6b6b66">None asked as a question.</p>`;
  const transcript = m.transcript.length
    ? m.transcript
        .map((t) =>
          t.role === "visitor"
            ? `<div style="margin:8px 0 8px 40px;background:#111110;color:#f7f5f0;padding:9px 12px;font-size:14px;line-height:1.5">${esc(t.text)}</div>`
            : `<div style="margin:8px 40px 8px 0;border-left:2px solid #d6d3cc;padding:4px 12px;font-size:14px;line-height:1.5;color:#111110">${esc(t.text)}</div>`,
        )
        .join("")
    : `<p style="margin:0;font-size:14px;color:#6b6b66">No messages.</p>`;
  return `<!doctype html><html><body style="margin:0;background:#f2f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-top:4px solid ${accent};padding:24px">
<p style="margin:0;display:inline-block;background:${accent};color:#ffffff;font-size:12px;font-weight:700;letter-spacing:.06em;padding:5px 9px">${esc(m.badge)}</p>
<p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:#111110">${esc(m.intro)}</p>
${heading("Contact")}${rowsOf(m.contact).length ? table(m.contact) : `<p style="margin:0;font-size:14px;color:#6b6b66">None given.</p>`}${button}
${heading("Project")}${table(m.project)}
${drawings}
${heading("Questions and concerns")}${questions}
${heading("Full conversation")}${transcript}
${heading("Visit")}<ul style="margin:0;padding-left:18px;font-size:13px;color:#3a3a36">${m.visit.map((v) => `<li style="margin:3px 0">${esc(v)}</li>`).join("")}</ul>
<div style="margin-top:28px;border-top:1px solid #e6e3dc;padding-top:12px">${table(m.footer)}</div>
</div></div></body></html>`;
}
