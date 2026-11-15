"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { officialHosts } from "@/content/gta-permits";

/** Official sources the assistant may link to (src/content/gta-permits.ts). Any other web address stays plain text. */
export const isOfficial = (href: string) => {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return href.startsWith("https://") && officialHosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

const LINK = /\[([^\]\n]{1,160})\]\(((?:\/[\w\-./#?=&%]*)|(?:https:\/\/[^\s)]{4,400})|(?:tel:[+\d\s()-]{7,20})|(?:mailto:[^\s)]{3,120}))\)/g;
const linkClass = "text-ink underline decoration-brand-500/60 underline-offset-4 hover:decoration-brand-500";

/** An external official link, opened in a new tab. */
export function SourceLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ?? linkClass}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Turns the reply's paragraphs and [text](/path/) links into elements. Anything else stays text. */
export function AdvisorReply({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <>
      {text
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p, i) => {
          const parts: ReactNode[] = [];
          let last = 0;
          for (const m of p.matchAll(LINK)) {
            parts.push(p.slice(last, m.index));
            const [, label, href] = m;
            last = m.index + m[0].length;
            if (href.startsWith("https://")) parts.push(isOfficial(href) ? <SourceLink key={m.index} href={href}>{label}</SourceLink> : label);
            else if (href.startsWith("/"))
              parts.push(
                <Link key={m.index} href={href as never} onClick={onNavigate} className={linkClass}>
                  {label}
                </Link>,
              );
            else
              parts.push(
                <a key={m.index} href={href} className={linkClass}>
                  {label}
                </a>,
              );
          }
          parts.push(p.slice(last).replace(/\*\*/g, ""));
          return (
            <p key={i} className="[&+&]:mt-2.5">
              {parts.map((part, j) => (
                <Fragment key={j}>{part}</Fragment>
              ))}
            </p>
          );
        })}
    </>
  );
}
