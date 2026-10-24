"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/Icons";
import { GTA_PERMITS_CHECKED_ON, gtaPermits } from "@/content/gta-permits";
import { askAssistant, askExamples, askSuggestions } from "@/lib/chat/ask";
import { chatLimits } from "@/lib/chat/conversation";
import "./chat.css";

/*
 * The homepage's showcase for the website assistant, between the projects
 * and the values: an invitation on the left, and on the right a console, a
 * charcoal sheet ruled like drawing paper, that types out the kind of
 * question visitors ask, runs the names of the building departments whose
 * pages the assistant can link, and takes the visitor's own question.
 * Asking opens the assistant with it (ASK_EVENT).
 *
 * It sits on the page ground, which turns from Works' stone back to cream
 * as it comes up, so the handover from the projects stays one surface. Its lines rise once as it comes into view and always finish; the
 * typing and the ticker run only while it is on screen, and stand still
 * with reduced motion (chat.css).
 */

const features = [
  {
    title: "Grounded",
    body: "It answers from our own guides and from what each municipality publishes, and links the page so you can read it yourself.",
  },
  {
    title: "Straight with you",
    body: "No guesses at fees, timelines or approvals. Where your property decides the answer, it says so: your municipality has the final word.",
  },
  {
    title: "Ready when you are",
    body: "Describe your project and it fills in our inquiry form for you to review and send. Nothing reaches us until you send it.",
  },
];

const checkedOn = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${GTA_PERMITS_CHECKED_ON}T12:00:00Z`));

/** Types the example questions out one after another while `running`. */
function useTypedExamples(running: boolean) {
  const [text, setText] = useState(askExamples[0]);
  const state = useRef({
    example: 0,
    length: askExamples[0].length,
    deleting: true,
  });

  useEffect(() => {
    if (!running) return;
    let timer = 0;
    const step = () => {
      const s = state.current;
      let wait: number;
      if (s.deleting) {
        s.length = Math.max(0, s.length - 2);
        wait = 18;
        if (s.length === 0) {
          s.deleting = false;
          s.example = (s.example + 1) % askExamples.length;
          wait = 380;
        }
      } else {
        s.length = Math.min(askExamples[s.example].length, s.length + 1);
        wait = 34 + Math.random() * 40;
        if (s.length === askExamples[s.example].length) {
          s.deleting = true;
          wait = 2600;
        }
      }
      setText(askExamples[s.example].slice(0, s.length));
      timer = window.setTimeout(step, wait);
    };
    timer = window.setTimeout(step, 1600);
    return () => window.clearTimeout(timer);
  }, [running]);

  return text;
}

export function AskShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const typed = useTypedExamples(visible && !reduced && !focused && !draft);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia = () => setReduced(media.matches);
    onMedia();
    media.addEventListener("change", onMedia);

    // The lines wait below their marks only if the section starts off screen, so nothing that is already in view flashes.
    if (!media.matches && section.getBoundingClientRect().top > window.innerHeight) section.dataset.armed = "";
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && entry.intersectionRatio > 0.18) section.dataset.in = "";
      },
      { threshold: [0, 0.18, 0.4] },
    );
    io.observe(section);
    return () => {
      io.disconnect();
      media.removeEventListener("change", onMedia);
    };
  }, []);

  const ask = (question: string) => {
    askAssistant({
      question: question.trim().slice(0, chatLimits.message),
      source: "home-showcase",
    });
    setDraft("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim()) ask(draft);
    else askAssistant({ source: "home-showcase" });
  };

  const rise = (i: number) => ({ "--i": i }) as CSSProperties;
  const names = gtaPermits.map((m) => m.name);

  return (
    <section
      ref={sectionRef}
      data-ask=""
      data-running={visible && !reduced ? "" : undefined}
      aria-labelledby="ask-heading"
      className="ask relative overflow-hidden py-24 text-ink sm:py-28 lg:py-40"
    >
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-x-24">
        <div className="lg:col-span-2">
          <p className="ask-rise flex items-center gap-3 text-label text-ink" style={rise(0)}>
            <span aria-hidden="true" className="chat-live" />
            PermitGuys AI
          </p>
          <h2 id="ask-heading" className="mt-7 font-wordmark text-[clamp(3.1rem,1rem+8.4vw,11rem)] leading-[0.86] tracking-[-0.01em] whitespace-nowrap uppercase max-[359px]:whitespace-normal">
            <span className="ask-line">
              <span className="ask-rise block" style={rise(1)}>
                Ask before
              </span>
            </span>
            <span className="ask-line">
              <span className="ask-rise block" style={rise(2)}>
                you build<span className="text-brand-500">.</span>
              </span>
            </span>
          </h2>
        </div>

        <div className="lg:self-start">
          <p className="ask-rise max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted lg:text-[1.125rem]" style={rise(3)}>
            Our AI assistant answers your permit questions any time of day. It draws on our guides and on what {names.length} GTA municipalities publish for homeowners, and it tells you where each
            answer comes from.
          </p>
          <ol className="mt-12 border-t border-line">
            {features.map((f, i) => (
              <li key={f.title} className="ask-rise grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-b border-line py-5 sm:grid-cols-[3.5rem_10rem_minmax(0,1fr)]" style={rise(4 + i)}>
                <span aria-hidden="true" className="font-mono text-[0.75rem] leading-6 text-ink-muted">
                  0{i + 1}
                </span>
                <h3 className="font-display text-[1.0625rem] leading-6 text-ink">{f.title}</h3>
                <p className="col-start-2 mt-1.5 text-[0.9375rem] leading-relaxed text-ink-muted sm:col-start-3 sm:mt-0">{f.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="ask-console ask-rise relative bg-charcoal-900 text-ivory shadow-[0_50px_100px_-40px_rgb(17_17_16/0.65)]" style={rise(3)}>
          <div aria-hidden="true" className="ask-console__grid" />
          <div className="relative flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
            <p className="flex items-center gap-2.5 text-label text-charcoal-300">
              <span aria-hidden="true" className="chat-live" />
              Online
            </p>
            <p className="text-right font-mono max-sm:hidden text-[0.6875rem] tracking-wide text-charcoal-300 uppercase">Sources checked {checkedOn}</p>
          </div>

          <div className="relative px-5 pt-10 pb-8 sm:px-8 sm:pt-14">
            <p className="text-label text-charcoal-300">Visitors ask</p>
            <p aria-hidden="true" className="mt-4 min-h-[3.3em] font-display text-[clamp(1.45rem,1.1rem+1.5vw,2.3rem)] leading-[1.12] tracking-[-0.025em] text-ivory sm:min-h-[2.3em]">
              <span className="text-brand-400">“</span>
              {typed}
              <span className="ask-caret" />
            </p>
            <p className="sr-only">For example: {askExamples.join(" ")}</p>

            <form onSubmit={onSubmit} className="mt-9">
              <label htmlFor="ask-input" className="sr-only">
                Your question for the PermitGuys assistant
              </label>
              <div className="ask-field flex items-stretch bg-ivory text-ink">
                <input
                  id="ask-input"
                  type="text"
                  value={draft}
                  maxLength={chatLimits.message}
                  autoComplete="off"
                  enterKeyHint="send"
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Ask about your project"
                  className="min-h-14 min-w-0 flex-1 border-0 bg-transparent px-5 text-base text-ink placeholder:text-ink-muted/80 focus:ring-0 focus:outline-none"
                />
                <button type="submit" className="group flex shrink-0 items-center gap-2 bg-brand-500 px-5 text-[0.9375rem] text-white transition-colors duration-300 hover:bg-brand-600 sm:px-6">
                  Ask
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </div>
            </form>

            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Suggested questions">
              {askSuggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    className="border border-white/20 px-3.5 py-2 text-left text-[0.8125rem] text-ivory/85 transition-colors duration-300 hover:border-ivory hover:text-ivory"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative border-t border-white/10 py-5">
            <p className="px-5 text-label text-charcoal-300 sm:px-8">Official permit pages it can link</p>
            <div aria-hidden="true" className="ask-ticker mt-4">
              <div className="ask-ticker__track">
                {[0, 1].map((copy) => (
                  <span key={copy} className="flex shrink-0 items-center">
                    {names.map((n) => (
                      <span key={n} className="flex items-center font-display text-[1.0625rem] whitespace-nowrap text-ivory/70">
                        {n}
                        <span className="mx-5 size-1 rounded-full bg-brand-400" />
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <p className="sr-only">{names.join(", ")}.</p>
          </div>

          <p className="relative border-t border-white/10 px-5 py-4 text-xs leading-relaxed text-charcoal-300 sm:px-8">
            Answers are AI-generated and general, and can be wrong. Your municipality decides on permits.
          </p>
        </div>
      </Container>
    </section>
  );
}
