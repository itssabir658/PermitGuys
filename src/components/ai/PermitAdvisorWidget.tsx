"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight } from "@/components/ui/Icons";
import { Wordmark } from "@/components/ui/Wordmark";
import { cn } from "@/components/ui/cn";
import { gtaPermits } from "@/content/gta-permits";
import { site } from "@/content/site";
import { getVisitorSnapshot, useCurrentSection } from "@/context/VisitorTelemetryContext";
import { contextPrompt } from "@/lib/ai/context-prompts";
import type { AdvisorFailure, AdvisorMessage } from "@/lib/ai/types";
import { track } from "@/lib/analytics";
import { ASK_EVENT, MESSAGE_MAX, type AskDetail } from "@/lib/chat/ask";
import { engine } from "@/lib/motion/engine";
import { paths } from "@/lib/routes";
import { AdvisorReply } from "./AdvisorReply";
import { ComplianceCard, DealCloserCard, ScopeCard, type ScopeInput, type Transcript } from "./AdvisorCards";
import { advisorSessionId, resetAdvisorSession, sendSessionSummary, type SummaryReason } from "./session-summary";
import "@/components/chat/chat.css";
import "./advisor.css";

/*
 * The PermitGuys permit strategist: a launcher in the corner with a context
 * pill that follows what the visitor is reading, and a panel where Claude
 * (through /api/chat and the Vercel AI SDK) answers, scopes the project on a
 * drawing-sheet card and closes with a one-step request card. Every message
 * carries the visit snapshot (VisitorTelemetryProvider), so the assistant
 * starts from what the visitor has already seen.
 *
 * The conversation lives in this tab (sessionStorage). The homepage showcase
 * (AskShowcase.tsx) opens the panel with a question through ASK_EVENT.
 */

const STORAGE_KEY = "pg_advisor";
const PILL_KEY = "pg_advisor_pill";
const PHONE_QUERY = "(max-width: 639px)";
/** Seconds on the site before the context pill first appears. */
const PILL_DELAY_MS = 7000;
/** A conversation left this long without a new message is summarized for the team. */
const IDLE_SUMMARY_MS = 120_000;

const failures: Record<AdvisorFailure, string> = {
  not_configured: "The assistant is not available right now.",
  rate_limited: "You have sent a lot of messages in a short time. Please wait a few minutes and try again.",
  invalid: "Something went wrong with that message. Please try again.",
  too_long: "This conversation has reached its length limit. Start a new chat, or send us your project below.",
  unavailable: "I couldn't reach our assistant just now. Please try again in a moment.",
};

const failureOf = (error: Error | undefined): string | null => {
  if (!error) return null;
  const code = (Object.keys(failures) as AdvisorFailure[]).find((k) => error.message.includes(k));
  return failures[code ?? "unavailable"];
};

const readStored = (): AdvisorMessage[] => {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as AdvisorMessage[]).filter((m) => m && (m.role === "user" || m.role === "assistant") && Array.isArray(m.parts)) : [];
  } catch {
    return [];
  }
};

const textOf = (m: AdvisorMessage) =>
  m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("\n")
    .trim();

export function PermitAdvisorWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const pathname = usePathname();
  const section = useCurrentSection();
  const prompt = contextPrompt(pathname, section?.id);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const restored = useRef(false);
  /** Sends the possible-lead summary when one is due; set below, once the conversation is known. */
  const summarize = useRef<(reason: SummaryReason) => void>(() => {});

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AdvisorMessage>({
        api: "/api/chat/",
        // Every turn carries the visit snapshot; only the visible conversation is sent back.
        prepareSendMessagesRequest: ({ messages }) => ({ body: { messages, snapshot: getVisitorSnapshot(), sessionId: advisorSessionId() } }),
      }),
    [],
  );
  const { messages, sendMessage, setMessages, status, error, stop, clearError } = useChat<AdvisorMessage>({ transport, throttle: 40 });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    // Restored after hydration, so the server and first client render agree.
    const stored = readStored();
    if (stored.length) setMessages(stored);
    restored.current = true;
  }, [setMessages]);

  useEffect(() => {
    if (!restored.current || busy) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Private browsing: the conversation lasts as long as the page.
    }
  }, [messages, busy]);

  // The launcher steps aside while the homepage's showcase, which asks the same assistant, is on screen.
  const [showcaseInView, setShowcaseInView] = useState(false);
  useEffect(() => {
    const showcase = document.querySelector("[data-ask]");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowcaseInView(false);
    if (!showcase) return;
    const io = new IntersectionObserver(([entry]) => setShowcaseInView(entry.isIntersecting), { rootMargin: "-15% 0px -15% 0px" });
    io.observe(showcase);
    return () => io.disconnect();
  }, [pathname]);

  // The context pill: appears once the visitor has had a moment on the site, until they dismiss it.
  const [pillReady, setPillReady] = useState(false);
  const [pillDismissed, setPillDismissed] = useState(true);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(PILL_KEY) === "dismissed";
    } catch {
      dismissed = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPillDismissed(dismissed);
    const t = window.setTimeout(() => setPillReady(true), PILL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);
  const dismissPill = () => {
    setPillDismissed(true);
    try {
      sessionStorage.setItem(PILL_KEY, "dismissed");
    } catch {
      // Dismissed for this page only.
    }
  };
  const showPill = pillReady && !pillDismissed && !open && !showcaseInView && messages.length === 0;

  // Phones get a full-screen sheet, so the page behind it is held still.
  useEffect(() => {
    if (!open || !window.matchMedia(PHONE_QUERY).matches) return;
    engine.lock("chat");
    return () => engine.unlock("chat");
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, [open]);

  // Follow the reply as it is written, but leave the visitor where they are if they scrolled up to read.
  const stick = useRef(true);
  useEffect(() => {
    const log = logRef.current;
    if (log && stick.current) log.scrollTop = log.scrollHeight;
  }, [messages, open]);

  const close = useCallback(() => {
    setOpen(false);
    summarize.current("chat_closed");
    const target = showcaseInView ? document.getElementById("ask-input") : launcherRef.current;
    requestAnimationFrame(() => target?.focus({ preventScroll: true }));
  }, [showcaseInView]);

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

  const send = useCallback(
    (text: string) => {
      const question = text.trim().slice(0, MESSAGE_MAX);
      if (!question || busy) return;
      if (error) clearError();
      stick.current = true;
      setDraft("");
      track("chat_message", { turn: messages.filter((m) => m.role === "user").length + 1, page: pathname });
      void sendMessage({ text: question });
    },
    [busy, error, clearError, messages, pathname, sendMessage],
  );

  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  useEffect(() => {
    const onAsk = (e: Event) => {
      const { question, source } = (e as CustomEvent<AskDetail>).detail ?? { source: "unknown" };
      setOpen(true);
      track("chat_open", { page: window.location.pathname, source });
      if (question?.trim()) sendRef.current(question);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  const openWith = (question?: string, source = "launcher") => {
    setOpen(true);
    track("chat_open", { page: pathname, source });
    if (question) send(question);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const onInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  const restart = () => {
    void stop();
    clearError();
    setMessages([]);
    resetAdvisorSession();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing stored.
    }
    inputRef.current?.focus();
  };

  const getTranscript = useCallback(
    (): Transcript =>
      messages
        .map((m) => ({ role: m.role === "user" ? ("visitor" as const) : ("assistant" as const), text: textOf(m) }))
        .filter((t) => t.text),
    [messages],
  );

  /** The latest scope's inputs, so a closing card can send the scope with the request. */
  const latestScopeInput = useMemo((): ScopeInput | null => {
    for (const m of [...messages].reverse())
      for (const p of [...m.parts].reverse()) if (p.type === "tool-generateProjectScope" && p.state === "output-available") return p.input as ScopeInput;
    return null;
  }, [messages]);

  /** The latest scope's drawing set, for the closing card's WhatsApp message. */
  const latestDrawings = useMemo((): string[] => {
    for (const m of [...messages].reverse())
      for (const p of [...m.parts].reverse()) if (p.type === "tool-generateProjectScope" && p.state === "output-available") return p.output.drawings.flatMap((g) => g.items);
    return [];
  }, [messages]);

  // Possible lead: a conversation the visitor walks away from reaches the team (src/lib/ai/session-summary.ts).
  useEffect(() => {
    summarize.current = (reason) => {
      if (busy && reason !== "page_exit") return;
      sendSessionSummary({ messages, reason, scope: latestScopeInput, snapshot: getVisitorSnapshot() });
    };
  });
  useEffect(() => {
    if (busy || messages.length < 2) return;
    const t = window.setTimeout(() => summarize.current("idle"), IDLE_SUMMARY_MS);
    return () => window.clearTimeout(t);
  }, [messages, busy]);
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") summarize.current("page_exit");
    };
    const onPageHide = () => summarize.current("page_exit");
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Quick replies: the assistant's own, after its latest turn; otherwise the context's starters.
  const last = messages[messages.length - 1];
  const quickReplies = useMemo(() => {
    if (busy || !last || last.role !== "assistant") return [];
    for (const p of last.parts) if (p.type === "tool-suggestReplies" && p.state === "output-available") return p.output.replies;
    return [];
  }, [busy, last]);

  const notice = failureOf(error);

  return (
    <>
      {/* Context pill: what the visitor is reading, and one-tap starters. */}
      <div
        className={cn("advisor-pill fixed right-4 z-30 sm:right-6", showPill ? "advisor-pill--in" : "pointer-events-none")}
        aria-hidden={!showPill}
        inert={!showPill}
      >
        <div className="relative border border-charcoal-900 bg-ivory py-3 pr-10 pl-3.5 shadow-[0_22px_50px_-24px_rgb(17_17_16/0.55)]">
          <button type="button" onClick={() => openWith(undefined, "pill")} className="block text-left text-[0.875rem] leading-snug text-ink">
            <span key={prompt.pill} className="advisor-pill__text block">
              {prompt.pill}
            </span>
          </button>
          <button type="button" onClick={dismissPill} aria-label="Dismiss" className="absolute top-1 right-1 grid size-9 place-items-center text-ink-muted hover:text-ink">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true" focusable="false">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
          <ul className="mt-2.5 flex flex-wrap gap-1.5 max-sm:hidden" aria-label="Suggested questions">
            {prompt.chips.map((c) => (
              <li key={c}>
                <button type="button" onClick={() => openWith(c, "pill-chip")} className="border border-line-strong px-2.5 py-1.5 text-left text-xs text-ink transition-colors duration-200 hover:border-ink hover:bg-stone-50">
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        aria-controls="pg-chat"
        aria-hidden={!open && showcaseInView ? true : undefined}
        tabIndex={!open && showcaseInView ? -1 : undefined}
        onClick={() => {
          if (open) close();
          else openWith();
        }}
        className={cn(
          "chat-launcher group fixed right-4 bottom-4 z-30 p-px shadow-[0_18px_40px_-16px_rgb(17_17_16/0.7)] transition-[transform,opacity] duration-300 ease-(--e-ui) hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:right-6 sm:bottom-6",
          open && "chat-launcher--open max-sm:pointer-events-none max-sm:translate-y-3 max-sm:opacity-0",
          !open && showcaseInView && "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <span aria-hidden="true" className="chat-launcher__sweep" />
        <span className="relative flex items-center gap-3 bg-charcoal-900 py-2.5 pr-5 pl-2.5 text-ivory transition-colors duration-300 group-hover:bg-charcoal-800">
          <span aria-hidden="true" className="chat-mark">
            <span className="chat-live" />
          </span>
          {open ? (
            <span className="text-[0.9375rem]">Close assistant</span>
          ) : (
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[0.9375rem] [--wordmark-guys:#fff]">
                Ask <Wordmark /> AI
              </span>
              <span className="mt-0.5 text-[0.75rem] text-charcoal-300 max-sm:sr-only">Your permit strategist</span>
            </span>
          )}
        </span>
      </button>

      <div
        id="pg-chat"
        ref={panelRef}
        role="dialog"
        aria-labelledby="pg-chat-title"
        hidden={!open}
        className="chat-panel fixed inset-0 z-[60] flex flex-col bg-ivory text-ink sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(46rem,calc(100dvh-8.5rem))] sm:w-[29rem] sm:border sm:border-charcoal-900 sm:shadow-[0_40px_90px_-30px_rgb(17_17_16/0.6)]"
      >
        <div className="chat-head relative flex items-start justify-between gap-4 overflow-hidden bg-charcoal-900 px-5 pt-[max(1.1rem,env(safe-area-inset-top))] pb-5 text-ivory">
          <div className="relative">
            <p className="flex items-center gap-2.5 text-label text-charcoal-300">
              <span aria-hidden="true" className="chat-live" />
              <span className="[--wordmark-guys:#fff]">
                <Wordmark className="text-[1.25em]" /> AI
              </span>
            </p>
            <h2 id="pg-chat-title" className="mt-2 font-display text-display-sm text-ivory">
              Ask about your project
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-charcoal-300">Scopes, drawing sets and what {gtaPermits.length} GTA municipalities publish.</p>
          </div>
          <div className="relative flex items-center gap-1">
            {messages.length ? (
              <button type="button" onClick={restart} className="px-2 py-2 text-sm whitespace-nowrap text-charcoal-300 underline-offset-4 hover:text-ivory hover:underline">
                New chat
              </button>
            ) : null}
            <button type="button" onClick={close} aria-label="Close assistant" className="-mr-2 grid size-11 place-items-center text-charcoal-300 hover:text-ivory">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden="true" focusable="false">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={logRef}
          data-lenis-prevent=""
          role="log"
          aria-busy={busy}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-6"
        >
          <div className="max-w-[36ch] text-[0.9375rem] leading-relaxed text-ink">
            <p>Hello. I&rsquo;m the PermitGuys permit strategist, an AI assistant.</p>
            <p className="mt-2.5">{prompt.pill} When you&rsquo;re ready, I can send your project to our team right here.</p>
          </div>

          {messages.length === 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Suggested questions">
              {prompt.chips.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => send(s)} className="border border-line-strong px-3.5 py-2 text-left text-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-stone-50">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {messages.map((m, mi) =>
            m.role === "user" ? (
              <div key={m.id} className="mt-6 flex justify-end">
                <p className="max-w-[85%] bg-charcoal-900 px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ivory">
                  <span className="sr-only">You: </span>
                  {textOf(m)}
                </p>
              </div>
            ) : (
              <div key={m.id} className="mt-6 border-l border-ink/20 pl-4 text-[0.9375rem] leading-relaxed text-ink">
                <span className="sr-only">PermitGuys assistant: </span>
                {m.parts.map((p, i) => {
                  const key = `${m.id}-${i}`;
                  switch (p.type) {
                    case "text":
                      return p.text.trim() ? (
                        <div key={key} className="[&+&]:mt-2.5">
                          <AdvisorReply text={p.text} onNavigate={closeOnPhone} />
                        </div>
                      ) : null;
                    case "tool-generateProjectScope":
                      return p.state === "output-available" ? (
                        <ScopeCard key={key} id={p.toolCallId} scope={p.output} input={p.input as ScopeInput} getTranscript={getTranscript} onNavigate={closeOnPhone} />
                      ) : p.state === "output-error" ? null : (
                        <p key={key} className="advisor-drafting mt-4 border border-dashed border-ink/30 px-4 py-3 font-mono text-xs text-ink-muted">
                          Drafting your project scope…
                        </p>
                      );
                    case "tool-checkPermitComplianceRisk":
                      return p.state === "output-available" ? (
                        <ComplianceCard key={key} check={p.output} onScope={() => send("Scope this project for me")} onNavigate={closeOnPhone} />
                      ) : p.state === "output-error" ? null : (
                        <p key={key} className="advisor-drafting mt-4 border border-dashed border-ink/30 px-4 py-3 font-mono text-xs text-ink-muted">
                          Checking what applies…
                        </p>
                      );
                    case "tool-presentDealCloserCard":
                      return p.state === "output-available" ? (
                        <DealCloserCard key={key} id={p.toolCallId} closer={p.output} scopeInput={latestScopeInput} drawings={latestDrawings} getTranscript={getTranscript} onNavigate={closeOnPhone} />
                      ) : null;
                    default:
                      return null;
                  }
                })}
                {busy && mi === messages.length - 1 && !textOf(m) && !m.parts.some((p) => p.type.startsWith("tool-")) ? <Typing /> : null}
              </div>
            ),
          )}

          {status === "submitted" && last?.role === "user" ? (
            <div className="mt-6 border-l border-ink/20 pl-4">
              <Typing />
            </div>
          ) : null}

          {quickReplies.length ? (
            <ul className="mt-5 flex flex-wrap gap-2 pl-4" aria-label="Quick replies">
              {quickReplies.map((r) => (
                <li key={r}>
                  <button type="button" onClick={() => send(r)} className="min-h-10 border border-ink/70 px-3.5 py-2 text-left text-sm text-ink transition-colors duration-200 hover:bg-charcoal-900 hover:text-ivory">
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

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
              maxLength={MESSAGE_MAX}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Describe your project or ask a question"
              className="max-h-32 min-h-11 flex-1 resize-none border-0 border-b border-ink/25 bg-transparent px-0 py-2.5 text-base text-ink [field-sizing:content] placeholder:text-ink-muted/70 focus:border-ink focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send"
              className="grid size-11 shrink-0 place-items-center bg-brand-500 text-white transition-[opacity,background-color] duration-300 hover:bg-brand-600 disabled:bg-charcoal-900 disabled:opacity-35"
            >
              <ArrowRight className="size-4.5" />
            </button>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
            AI answers are general and can be wrong; your municipality decides on permits. This conversation and the pages you viewed here are shared with the PermitGuys team so we can follow up.{" "}
            <Link href={paths.privacy} onClick={closeOnPhone} className="underline underline-offset-2">
              Privacy
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}

function Typing() {
  return (
    <p className="chat-typing text-ink-muted" aria-label="Writing a reply">
      <span aria-hidden="true">●</span>
      <span aria-hidden="true">●</span>
      <span aria-hidden="true">●</span>
    </p>
  );
}
