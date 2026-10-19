# Design system

The site keeps the PermitGuys navy and copper and the drawing-set idea (elevations, datums, copper for new work), set in a modern, glassy, interactive interface: frosted cards on soft navy and paper glows, rounded corners, motion that follows the visitor.

## Brand

- Colours (`src/app/globals.css`): navy `#14263D` for dark grounds and text, off-white `#F7F6F2` for paper, copper `#C77A45` for actions and new work. Use `copper-700` for small copper text on paper and `copper-300` on navy so both pass WCAG AA.
- Type: Lufga for headings and Gilroy for body text, as chosen by the business. Both are commercial fonts, so the site uses Outfit and Plus Jakarta Sans as close stand-ins until the licensed web font files are added. To switch, put the `.woff2` files in `src/app/fonts/` and follow the steps in `src/app/fonts.ts`; nothing else changes. Headings are sentence case.
- Logo: `Wordmark` in `src/components/layout/SiteHeader.tsx` is a placeholder until the real PermitGuys logo is supplied.

## Surfaces

| Class | Use it for |
| --- | --- |
| `bg-glow-navy`, `bg-glow-paper` | Section grounds with soft copper and steel glows, so glass has something to frost. |
| `glass`, `glass-dark` | Frosted cards and panels on paper and on navy. |
| `spotlight` | Adds a copper glow that follows the pointer (set by `InteractionEffects`). |
| `text-label` | Small uppercase labels. |

## Building blocks

| Piece | Use it for |
| --- | --- |
| `Eyebrow` with `code` | Chip above a section heading ("01 Services"). Number homepage sections in order. |
| `SectionHeading` | Section eyebrow, H2 and intro. `size="md"` when set in a narrow column. |
| `PageHeader` | Navy header for every inner page. Pass `onDark` to anything inside it (`DirectAnswer`, `Placeholder`, `Figure captionOnDark framed`). |
| `ButtonLink` | Rounded call to action with the arrow in its own chip. Variants: `copper` and `ghost-light` on navy, `primary` and `secondary` on paper. `ArrowLink` for quieter links. |
| `HeroVisual` | Hero elevation with an Existing / Proposed switch; the new storey draws itself in. |
| `ProjectPicker` | "What are you planning?" tiles that open the inquiry form with the project type chosen. |
| `ServiceFilter` | Homes / Businesses filter over the services bento grid. Cards stay server-rendered. |
| `ProcessStepper` | Process as tabs, showing who carries each step. |
| `StepList` | Process as a responsibility chart (You, PermitGuys, the city) on inner pages. |
| `RatingCard`, `RatingBadge`, `ReviewCarousel` | Google rating and reviews. Data comes only from `src/lib/reviews.ts`. |
| `MapCard` | Google map behind a click-to-load cover. Reads `site.map`. |
| `IndexList`, `LinkRows`, `FaqList` | Glass lists of services, links and questions. |
| `CtaPanel` | Closing glass panel on every page. |

## Motion

- `motion-rise` and `motion-rise-delay` for first-screen entrances; `data-reveal` for content that fades up as it scrolls into view (every `Section` has it).
- All motion is off for visitors who prefer reduced motion, and content is visible without JavaScript.

## Rules

- One primary button per block.
- Vary the layout from section to section (bento grid, tabs, split panels) rather than repeating one card grid.
- Placeholders stay visible (`Placeholder`) until the business supplies the fact. Never fill them with sample content.
- Reviews are never written by hand, and Google review structured data is never added (Google does not allow it for a business's own reviews).
- Illustrations are captioned as illustrations. Photos are captioned with their credit.
