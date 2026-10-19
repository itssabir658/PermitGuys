# Design system

The site is art-directed as a set of permit drawings: navy sheets, copper for new work, mono annotations. Use these pieces rather than inventing new ones.

## Brand

- Colours (`src/app/globals.css`): navy `#14263D` for sheets and text, off-white `#F7F6F2` for paper, copper `#C77A45` for marks and new work. Use `copper-700` for small copper text on paper and `copper-300` on navy so both pass WCAG AA.
- Type: Newsreader for headings, Instrument Sans for body text, IBM Plex Mono for sheet labels, step numbers and drawing notes. Headings are sentence case.
- Logo: `Wordmark` in `src/components/layout/SiteHeader.tsx` is a placeholder until the real PermitGuys logo is supplied.

## Building blocks

| Piece | Use it for |
| --- | --- |
| `Eyebrow` with `code` | Sheet label above a section heading ("01 Services"). Number homepage sections in order. |
| `SectionHeading` | Section eyebrow, H2 and intro. `size="md"` when set in a narrow column. |
| `PageHeader` | Navy header for every inner page. Pass `onDark` to anything inside it (`DirectAnswer`, `Placeholder`, `Figure captionOnDark`). |
| `ButtonLink` | The single primary action in a block. Square corners, arrow in its own cell. Use `ArrowLink` for secondary actions. |
| `ProjectPicker` | "What are you planning?" links that open the inquiry form with the project type chosen. |
| `IndexList` | Numbered lists where order matters, such as services. |
| `LinkRows` | Ruled lists of guides and related links. |
| `StepList` | Process as a responsibility chart (You, PermitGuys, the city). |
| `CtaPanel` | Closing navy band on every page. |

## Rules

- One primary button per block. No pills, no rounded cards, no gradients, no decorative icons.
- Vary the layout from section to section: spreads, indexes, charts and ledgers rather than repeated card grids.
- Placeholders stay visible (`Placeholder`) until the business supplies the fact. Never fill them with sample content.
- Illustrations are captioned as illustrations. Photos are captioned with their credit.
