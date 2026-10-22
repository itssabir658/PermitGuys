# Design system

Architectural, editorial and quiet. The site reads like a well-made drawing set or an architecture monograph: warm ivory paper, graphite type, hairline rules, numbered sections, generous whitespace and large images. The PermitGuys logo stays exactly as supplied; its red is used sparingly as a single accent (a dot, a rule, a hover cell), never as a fill.

References studied (as text only; see the note at the end): Storey Architecture for editorial layouts, whitespace, minimal navigation and numbered services; Studio Foundry for the immersive hero, oversized type, large imagery and motion; permitguys.ca for the brand assets.

## Tokens (`src/app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `ivory` | `#F4F1EB` | Page ground. |
| `stone-50` … `stone-500` | `#F8F6F2` … `#8F877B` | Alternate section grounds, image mats, muted marks. |
| `charcoal-950` … `charcoal-100` | `#111110` … `#E4E0D8` | Dark sections, menu, footer, type on dark. |
| `ink`, `ink-muted` | `#171716`, `#5E5952` | Body and secondary text on ivory (both pass WCAG AA). |
| `line`, `line-strong` | `#DCD5CA`, `#B9B0A2` | Hairline rules. |
| `brand-400` | `#EE352F` | The logo red. Dots, rules and small marks only. |
| `brand-500` … `brand-700` | `#C2352C` … `#8F271F` | Red text on light grounds, if ever needed. Use `brand-300` on dark. |

- **Type:** Geist (300, 400, 500) for everything, Geist Mono for labels, figure numbers and metadata (`src/app/fonts.ts`). Display sizes are light (300) with tight tracking. If the business later licenses Lufga and Gilroy, `fonts.ts` is the only file to change.
- **Scale:** `text-hero` (fluid up to 8.5rem), `text-display-2xl` … `text-display-sm`, `text-lede`, `text-label` (mono, uppercase, tracked).
- **Easing:** `ease-out-expo` for reveals and hovers, `ease-in-out-quint` for masks and the menu panel. Durations sit between 0.5s and 1.4s.
- **Width:** content runs to `max-w-site` (100rem) on a 12-column grid; long copy stays at `max-w-prose`.

## Building blocks

| Piece | Use it for |
| --- | --- |
| `Eyebrow` | Mono label with a section number and a short rule ("02 — Services"). Number homepage sections in order. |
| `SectionHeading`, `Section` | Section heading and the band around it. Tones: `ivory`, `stone`, `dark`. |
| `PageHeader` | Opening block of every inner page: breadcrumbs, a large light H1, an optional aside, a closing rule. |
| `Plate` | Every image. Mask reveal, optional scroll drift, and a mono "Fig. NN" caption that always carries the study note (see `docs/IMAGES.md`). |
| `ButtonLink` | Pill buttons with the arrow in a round cell. `primary` (ink), `light` (on photographs and dark grounds), `secondary`, `ghost-light`. `ArrowLink` for quieter links. One primary per block. |
| `ServiceIndex` | Numbered service rows. On a fine pointer a preview image follows the cursor and the other rows dim. |
| `IndexList`, `LinkRows`, `FaqList`, `StepList` | Hairline lists for services, links, questions and process steps on inner pages. |
| `RatingCard`, `Reviews`, `ReviewReel` | Google rating and reviews. Data comes only from `src/lib/reviews.ts`. |
| `MapCard` | Google map behind a click-to-load cover. Reads `site.map`. |
| `CtaPanel` | Closing dark panel on inner pages with "What happens next". |

## Homepage

Hero (full-bleed study, staggered headline) → credibility strip → editorial intro → numbered services → selected studies → pinned process → principles (dark) → service areas → reviews → guides and quick answers → final call to action → footer.

## Motion

All motion is CSS, with one small `IntersectionObserver` (`InteractionEffects`). No animation library is loaded.

- **Hero entrance** (`hero-plate`, `hero-line`, `hero-fade`, `hero-chrome`): the image unveils from a framed crop and settles from a slight scale, the headline lines rise out of masks, then the copy, actions and header follow. Plays once; the page is usable from the first frame.
- **Scroll reveals:** `data-reveal` with `data-reveal-type="lines" | "mask" | "rule"` and `--d` for a delay in ms. Only elements that start below the fold are hidden, so content is visible without JavaScript and to crawlers.
- **Drift:** `data-parallax` uses scroll-driven animations (`animation-timeline: view()`) where supported, and does nothing elsewhere.
- **Header:** transparent over the hero, ivory once scrolled, tucks away while reading down.
- **Menu:** full-screen graphite panel revealed by a clip-path, links rising in sequence. Focus is trapped, Escape closes it, and it is inert when closed.
- **Page transitions:** a short fade-and-rise (`template.tsx`, `.page-enter`) that only runs after an in-site link click, never on the first page of a visit.
- Everything above is switched off for visitors who prefer reduced motion.

## Rules

- Vary layouts between sections (index rows, asymmetric images, a pinned column, a dark band). No card grids.
- Placeholders stay visible (`Placeholder`) until the business supplies the fact. Never fill them with sample content.
- Reviews are never written by hand, and Google review structured data is never added (Google does not allow it for a business's own reviews).
- Rendered studies are always captioned as studies and never presented as client projects.

## What could not be inspected

The build environment's network blocks the reference sites, so they were read as text (structure, copy, section order) and not seen. Their imagery, motion and hover behaviour were not observed; the motion here is designed from the brief rather than copied.
