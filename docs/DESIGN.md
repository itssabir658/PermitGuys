# Design system

The site uses the PermitGuys logo and the permitguys.ca colours (red, charcoal, white and pale grey) and the drawing-set idea (elevations, datums, red for new work), set in a modern, glassy, interactive interface: frosted cards on pale grey and charcoal grounds, rounded corners, motion that follows the visitor.

## Brand

- Colours (`src/app/globals.css`), from the logo and permitguys.ca, and no others: logo red `#EE352F` (`brand-400`) for marks and drawings; button red `#CA3A31` (`brand-500`) for buttons and red text; charcoal `#27272A` and near-black `#1C1C1C` for text and dark bands; white; pale grey `#F2F5F9` (`paper`) for page grounds. Buttons on red use white text. Use `brand-500` or `brand-700` for small red text on light grounds and `brand-300` on charcoal so both pass WCAG AA; the logo red is too light for small text.
- Type: Lufga for headings and Gilroy for body text, as chosen by the business. Both are commercial fonts, so the site uses Outfit and Plus Jakarta Sans as close stand-ins until the licensed web font files are added. To switch, put the `.woff2` files in `src/app/fonts/` and follow the steps in `src/app/fonts.ts`; nothing else changes. Headings are sentence case.
- Logo: `Logo` in `src/components/layout/SiteHeader.tsx` shows the supplied logo (`public/brand/permitguys-logo.png`). On charcoal it uses `permitguys-logo-on-dark.png`, the same file with "guys" in white. A larger or vector (SVG) version would be sharper on high-resolution screens.

## Surfaces

| Class | Use it for |
| --- | --- |
| `bg-glow-paper`, `bg-glow-dark` | Pale grey and charcoal grounds with soft red and grey glows, so glass has something to frost. |
| `glass`, `glass-dark` | Frosted cards and panels on pale grey and on charcoal. |
| `spotlight` | Adds a red glow that follows the pointer (set by `InteractionEffects`). |
| `text-label` | Small uppercase labels. |

## Building blocks

| Piece | Use it for |
| --- | --- |
| `Eyebrow` with `code` | Chip above a section heading ("01 Services"). Number homepage sections in order. |
| `SectionHeading` | Section eyebrow, H2 and intro. `size="md"` when set in a narrow column. |
| `PageHeader` | Pale grey opening block for every inner page, like the homepage hero. Drawings in its aside sit on a charcoal sheet (`Figure tone="dark" captionOnDark framed`). |
| `ButtonLink` | Rounded call to action with the arrow in its own chip. Variants: `brand` (red) for the main action, `primary` (charcoal) and `secondary` on light grounds, `ghost-light` on charcoal. `ArrowLink` for quieter links. |
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
