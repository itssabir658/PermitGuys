import { holmesQuote, municipalities } from "./recognition";
import { site } from "./site";

/**
 * The About page's team, credentials and story.
 *
 * Only facts the business has confirmed go here. permitguys.ca (read in full
 * on 19 November 2026, pages and blog) has no About or team page and states
 * no team roles, memberships, insurance or stamp count, so those stay empty
 * until the business supplies them; the page shows a marked PLACEHOLDER for
 * each empty entry. Never fill them from reviews or by inference: a name in
 * a Google review is not a confirmed team member or role.
 */

export interface TeamMember {
  name: string;
  /** The person's role in the business's own words, e.g. "Principal". */
  role: string;
  /** Professional designation, only when the business confirms it (e.g. "P.Eng.", "OAA", "BCIN"). */
  designation?: string;
}

export interface Fact {
  label: string;
  /** In the business's words; null shows a placeholder naming what is missing. */
  value: string | null;
  missing: string;
}

export const about = {
  /** Team members and their roles, as the business supplies them. */
  team: [] as TeamMember[],

  /**
   * The credentials ledger. Confirmed: BCIN (2026-10-22), architectural stamps
   * in house (count unconfirmed), licensed P.Eng. engineers and permit
   * applications filed as the owner's agent (both confirmed 2026-11-19).
   */
  facts: [
    { label: "Design", value: "Small Buildings BCIN certified.", missing: "" },
    { label: "Engineering", value: "Licensed professional engineers (P.Eng.) on our team.", missing: "" },
    {
      label: "Architectural stamps",
      value: null,
      missing: "the number of architectural stamps held in house (we know they are in house; the count is unconfirmed).",
    },
    { label: "Permit applications", value: "We submit the application to the municipality for you, as the owner's agent.", missing: "" },
    { label: "Memberships", value: null, missing: "professional memberships, such as OAA, PEO, OBOA or BILD, only those the firm holds." },
    { label: "Insurance", value: null, missing: "insurance carried, such as professional liability (errors and omissions) and WSIB coverage." },
  ] as Fact[],

  /**
   * The story, from what PermitGuys has published: the old site's own line
   * ("a full service architectural firm that specializes in building permit
   * approvals"), the permits count (site.projectsMap), the Mike Holmes quote
   * (recognition.ts) and the confirmed facts above. How and when the firm
   * started is not published anywhere, so it stays a placeholder.
   */
  story: [
    "PermitGuys is a full service architectural firm that specializes in building permit approvals. From our office in Oakville, our architects, designers and licensed engineers take a project from the first idea through design and engineering to a complete permit application, and we submit it to the municipality on your behalf.",
    ...(site.projectsMap ? [`${site.projectsMap.permits} permits have been issued for our clients' projects so far, from basement apartments and additions to custom homes and commercial interiors.`] : []),
    `Along the way we have worked with ${holmesQuote.author} on Holmes Family Rescue, whose view of permits is ours too: “We go through the proper process to obtain all the permits needed.”`,
  ],
  storyMissing: "the year PermitGuys started, who founded it and why, in two or three lines approved by the business.",

  /** Municipalities the firm serves: the ones on its projects map (confirmed by the business 2026-11-19). */
  cities: municipalities.map((m) => m.place),
};
