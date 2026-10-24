"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";
import { officialHosts } from "@/content/gta-permits";
import { site } from "@/content/site";
import { track } from "@/lib/analytics";
import { chatLimits, type ChatEvent, type ChatTurn } from "@/lib/chat/conversation";
import { HANDOFF_EVENT, HANDOFF_STORAGE_KEY, type Handoff } from "@/lib/chat/handoff";
import { engine } from "@/lib/motion/engine";
import { paths } from "@/lib/routes";

/*
 * The website assistant: a quiet launcher in the corner and a panel that
 * answers questions about permits and PermitGuys, then fills in the project
 * half of the inquiry form when the visitor is ready. The transcript lives in
 * this tab (sessionStorage) and is sent to /api/chat on every turn.
 */

interface Entry extends ChatTurn {
  handoff?: Handoff;
  /** A reply that could not be completed: shown, but never sent back to the model. */
  failed?: boolean;
}

const STORAGE_KEY = "pg_chat";
const PHONE_QUERY = "(max-width: 639px)";

const suggestions = [
  "Do I need a permit for a deck?",
  "How do I make a basement apartment legal?",
  "What does PermitGuys do?",
  "I'm planning a second-storey addition",
];

const failures: Record<Extract<ChatEvent, { type: "error" }>["reason"], string> = {
  not_configured: "The assistant is not available right now.",
  rate_limited: "You have sent a lot of messages in a short time. Please wait a few minutes and try again.",
  invalid: "Something went wrong with that message. Please try again.",
  too_long: "This conversation has reached its length limit. The inquiry form is the best next step, or start a new conversation.",
  declined: "I can't help with that here, but our team can.",
  unavailable: "I couldn't reach our assistant just now. Please try again in a moment.",
};

const readStored = (): Entry[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Entry[]).filter((e) => (e.role === "user" || e.role === "assistant") && typeof e.content === "string") : [];
  } catch {
    return [];
  }
};

/** Official sources the assistant may link to (src/content/gta-permits.ts). Any other web address stays plain text. */
const isOfficial = (href: string) => {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return href.startsWith("https://") && officialHosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

/** Turns the reply's paragraphs and [text](/path/) links into elements. Anything else stays text. */
function renderReply(text: string, onNavigate: () => void): ReactNode {
  const link = /\[([^\]\n]{1,160})\]\(((?:\/[\w\-./#?=&%]*)|(?:https:\/\/[^\s)]{4,400})|(?:tel:[+\d\s()-]{7,20})|(?:mailto:[^\s)]{3,120}))\)/g;
  return text
    .split(/\n+/)
    .filter((p) => p.trim())
    .map((p, i) => {
      const parts: ReactNode[] = [];
      let last = 0;
      for (const m of p.matchAll(link)) {
        parts.push(p.slice(last, m.index));
        const [, label, href] = m;
        if (href.startsWith("https://") && !isOfficial(href)) {
          parts.push(label);
          last = m.index + m[0].length;
          continue;
        }
        parts.push(
          href.startsWith("/") ? (
            <Link key={m.index} href={href as never} onClick={onNavigate} className="text-ink underline decoration-brand-500/60 underline-offset-4 hover:decoration-brand-500">
              {label}
            </Link>
          ) : (
            <a
              key={m.index}
              href={href}
              {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-ink underline decoration-brand-500/60 underline-offset-4 hover:decoration-brand-500"
            >
              {label}
              {href.startsWith("https://") ? <span className="sr-only"> (opens in a new tab)</span> : null}
            </a>
          ),
        );
        last = m.index + m[0].length;
      }
      parts.push(p.slice(last).replace(/\*\*/g, ""));
      return (
        <p key={i} className="[&+&]:mt-2.5">
          {parts.map((part, j) => (
            <Fragment key={j}>{part}</Fragment>
          ))}
        </p>
      );
    });
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    // Restored after hydration, so the server and first client render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(readStored());
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current || busy) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Private browsing: the conversation simply lasts as long as the page.
    }
  }, [entries, busy]);

  // Phones get a full-screen sheet, so the page behind it is held still.
  useEffect(() => {
    if (!open || !window.matchMedia(PHONE_QUERY).matches) return;
    engine.lock("chat");
    return () => engine.unlock("chat");
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }, []);

  // Escape closes the panel wherever focus is, as long as it is not inside another dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("[role='dialog']") && !panelRef.current?.contains(t)) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const closeOnPhone = useCallback(() => {
    if (window.matchMedia(PHONE_QUERY).matches) setOpen(false);
  }, []);

  const send = async (text: string) => {
    const question = text.trim().slice(0, chatLimits.message);
    if (!question || busy) return;
    const history = [...entries.filter((e) => !e.failed), { role: "user" as const, content: question }];
    // Keep the history alternating even when an earlier reply failed: drop the visitor message it answered.
    const turns: ChatTurn[] = [];
    for (const e of history) {
      if (turns.length && turns[turns.length - 1].role === e.role) turns.pop();
      turns.push({ role: e.role, content: e.content });
    }
    setEntries((list) => [...list, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setDraft("");
    setNotice(null);
    setBusy(true);
    track("chat_message", { turn: turns.filter((t) => t.role === "user").length });

    const update = (fn: (last: Entry) => Entry) =>
      setEntries((list) => [...list.slice(0, -1), fn(list[list.length - 1])]);

    const controller = new AbortController();
    abortRef.current = controller;
    let failure: string | null = null;
    let replied = false;
    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: turns }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as ChatEvent;
          if (event.type === "text") {
            replied = true;
            update((last) => ({ ...last, content: last.content + event.text }));
          } else if (event.type === "handoff") {
            try {
              sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(event.handoff));
            } catch {
              // Without storage the visitor can still fill in the form themselves.
            }
            window.dispatchEvent(new CustomEvent(HANDOFF_EVENT, { detail: event.handoff }));
            track("chat_handoff", { project_type: event.handoff.projectType });
            update((last) => ({
              ...last,
              content: last.content || "I've filled in the inquiry form with your project details for you to review and send.",
              handoff: event.handoff,
            }));
          } else if (event.type === "error") {
            failure = failures[event.reason];
          }
        }
        if (done) break;
      }
    } catch {
      if (controller.signal.aborted) return;
      failure = failures.unavailable;
    } finally {
      abortRef.current = null;
      setBusy(false);
      // The send button is disabled while a reply is written; hand the visitor back to the field.
      if (panelRef.current?.contains(document.activeElement) || document.activeElement === document.body) inputRef.current?.focus({ preventScroll: true });
    }
    if (failure) {
      // A partly written reply stays visible but is not sent back next turn.
      if (replied) update((last) => ({ ...last, failed: true }));
      else setEntries((list) => list.slice(0, -1));
      setNotice(failure);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const onInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  };

  const restart = () => {
    abortRef.current?.abort();
    setBusy(false);
    setEntries([]);
    setNotice(null);
    inputRef.current?.focus();
  };

  const onContact = pathname === paths.contact;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        aria-controls="pg-chat"
        onClick={() => {
          if (!open) track("chat_open", { page: pathname });
          setOpen((o) => !o);
        }}
        className={cn(
          "chat-launcher fixed right-4 bottom-4 z-30 flex items-center gap-2.5 bg-charcoal-900 py-3 pr-5 pl-4 text-[0.9375rem] text-ivory shadow-[0_10px_30px_-12px_rgb(17_17_16/0.55)] transition-[transform,opacity,background-color] duration-300 ease-(--e-ui) hover:bg-charcoal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:right-6 sm:bottom-6",
          open && "max-sm:pointer-events-none max-sm:translate-y-3 max-sm:opacity-0",
        )}
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-brand-400" />
        {open ? "Close assistant" : "Ask PermitGuys"}
      </button>

      <div
        id="pg-chat"
        ref={panelRef}
        role="dialog"
        aria-labelledby="pg-chat-title"
        hidden={!open}
        className="chat-panel fixed inset-0 z-[60] flex flex-col bg-ivory text-ink sm:inset-auto sm:right-6 sm:bottom-22 sm:h-[min(40rem,calc(100dvh-8rem))] sm:w-[25rem] sm:border sm:border-line sm:shadow-[0_30px_80px_-30px_rgb(17_17_16/0.45)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
          <div>
            <p className="text-label text-ink-muted">
              <span aria-hidden="true" className="mr-2 inline-block size-1.5 rounded-full bg-brand-500 align-middle" />
              Assistant
            </p>
            <h2 id="pg-chat-title" className="mt-1.5 font-display text-display-sm text-ink">
              Ask about your project
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {entries.length ? (
              <button type="button" onClick={restart} className="px-2 py-2 text-sm whitespace-nowrap text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                New chat
              </button>
            ) : null}
            <button type="button" onClick={close} aria-label="Close assistant" className="-mr-2 grid size-11 place-items-center text-ink-muted hover:text-ink">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden="true" focusable="false">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={logRef} data-lenis-prevent="" role="log" aria-busy={busy} className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <div className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink">
            <p>Hello. Ask me about building permits in Ontario, our services or the project you have in mind.</p>
            <p className="mt-2.5">When you are ready, I can fill in our inquiry form for you.</p>
          </div>

          {entries.length === 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Suggested questions">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void send(s)}
                    className="border border-line-strong px-3.5 py-2 text-left text-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-stone-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {entries.map((e, i) =>
            e.role === "user" ? (
              <div key={i} className="mt-6 flex justify-end">
                <p className="max-w-[85%] bg-charcoal-900 px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ivory">
                  <span className="sr-only">You: </span>
                  {e.content}
                </p>
              </div>
            ) : (
              <div key={i} className="mt-6 border-l border-ink/20 pl-4 text-[0.9375rem] leading-relaxed text-ink">
                <span className="sr-only">PermitGuys assistant: </span>
                {e.content ? (
                  renderReply(e.content, closeOnPhone)
                ) : (
                  <p className="chat-typing text-ink-muted" aria-label="Writing a reply">
                    <span aria-hidden="true">●</span>
                    <span aria-hidden="true">●</span>
                    <span aria-hidden="true">●</span>
                  </p>
                )}
                {e.handoff ? (
                  <div className="mt-4 border border-line bg-stone-50 p-4">
                    <p className="text-label text-ink-muted">Inquiry form</p>
                    <p className="mt-2 text-sm text-ink">
                      {e.handoff.projectType}
                      {e.handoff.municipality ? `, ${e.handoff.municipality}` : ""}
                    </p>
                    {onContact ? (
                      <p className="mt-3 text-sm text-ink-muted">The details are in the form on this page. Add your contact details and send it.</p>
                    ) : (
                      <Link
                        href={`${paths.contact}?from=chat` as never}
                        onClick={closeOnPhone}
                        className="group mt-3 inline-flex items-center gap-2 bg-brand-500 px-4 py-2.5 text-sm text-white transition-colors duration-300 hover:bg-brand-600"
                      >
                        Review and send
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
            ),
          )}

          {notice ? (
            <p role="alert" className="mt-6 border-l-2 border-brand-500 bg-brand-500/5 px-4 py-3 text-sm text-brand-800">
              {notice}{" "}
              {site.contact.phone ? (
                <>
                  You can also call us at <a href={`tel:${site.contact.phone.replace(/\D/g, "")}`} className="underline underline-offset-4">{site.contact.phone}</a> or{" "}
                </>
              ) : null}
              <Link href={paths.contact} onClick={closeOnPhone} className="underline underline-offset-4">
                send an inquiry
              </Link>
              .
            </p>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="border-t border-line px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <label htmlFor="pg-chat-input" className="sr-only">
            Your question
          </label>
          <div className="flex items-end gap-3">
            <textarea
              id="pg-chat-input"
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={chatLimits.message}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Type your question"
              className="max-h-32 min-h-11 flex-1 resize-none border-0 border-b border-ink/25 bg-transparent px-0 py-2.5 text-base text-ink [field-sizing:content] placeholder:text-ink-muted/70 focus:border-ink focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send"
              className="grid size-11 shrink-0 place-items-center bg-charcoal-900 text-ivory transition-opacity duration-300 hover:bg-charcoal-800 disabled:opacity-35"
            >
              <ArrowRight className="size-4.5" />
            </button>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
            Answers are AI-generated and general, and can be wrong. Your municipality decides on permits. Please do not share personal details here.{" "}
            <Link href={paths.privacy} onClick={closeOnPhone} className="underline underline-offset-2">
              Privacy
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
