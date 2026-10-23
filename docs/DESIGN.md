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

- **Type:** Geist (300, 400, 500) for everything, Geist Mono for labels, figure numbers and metadata, and Playfair Display Black only for the wordmark display type: the hero name, the Values words and CONTACT (`src/app/fonts.ts`). Display sizes are light (300) with tight tracking. If the business later licenses Lufga and Gilroy, `fonts.ts` is the only file to change.
- **Scale:** `text-hero` (fluid up to 8.5rem), `text-display-2xl` … `text-display-sm`, `text-lede`, `text-label` (mono, uppercase, tracked).
- **Easing:** `ease-out-expo` for reveals and hovers, `ease-in-out-quint` for masks and the menu panel. Durations sit between 0.5s and 1.4s.
- **Width:** content runs to `max-w-site` (100rem) on a 12-column grid; long copy stays at `max-w-prose`.

## Building blocks

| Piece | Use it for |
| --- | --- |
| `Eyebrow` | Mono label with a section number and a short rule ("02 — Services"). Number homepage sections in order. |
| `SectionHeading`, `Section` | Section heading and the band around it. Tones: `ivory`, `stone`, `dark`. |
| `PageHeader` | Opening block of every inner page: breadcrumbs, a large light H1, an optional aside, a closing rule. Index pages follow it with a wide picture band (`PlateBand`). |
| `Plate` | Every image. Mask reveal, optional scroll drift, and a mono "Fig. NN" caption that carries the plate's note: a rendering of a client project, or a rendered study (see `docs/IMAGES.md`). The projects page sets the note once instead (`note={false}`). |
| `LinkButton` | The call to action: a square-cornered mono label plate and a square arrow cell. Tones `dark` (ink, the default), `light` (ivory, on photographs and dark grounds), `outline` (the quieter second action on paper) and `ghost` (the same on dark grounds). `LinkButtonFace` and `linkButtonClass` give a `<button>` or an outside link the same face. `ArrowLink` for quieter text links. One dark or light button per block. |
| `ServiceIndex` | Numbered service rows. On a fine pointer a preview image follows the cursor and the other rows dim. |
| `IndexList`, `LinkRows`, `FaqList`, `StepList` | Hairline lists for services, links, questions and process steps on inner pages. |
| `RatingCard`, `Reviews`, `ReviewReel` | Google rating and reviews. Data comes only from `src/lib/reviews.ts`. |
| `MapCard` | Google map behind a click-to-load cover. Reads `site.map`. |
| `CtaPanel` | Closing paper panel on inner pages: one line, a primary and an outline action, and "What happens next". The footer's own call to action stands down where it is. |

## Homepage

The full choreography, scroll map and checks are in [MOTION.md](MOTION.md).

1. **Hero** (`Hero.tsx`): the name set very large over a full-bleed client rendering under a graded veil (a tall crop of it on phones), the statement at the bottom left. The preloader's iris opens onto it; the intro's ivory sheet then rises over it.
2. **Intro** (`Intro.tsx`): an ivory sheet with six client renderings travelling one squircle path around the centre while the introduction rises through it, paragraph by paragraph; the ring is flung out at the end.
3. **Selected projects** (`Works.tsx`): one pinned, notched frame on a stone ground; renderings of three client projects, labelled as renderings, wipe up over one another, each leading to its renderings on the projects page. Approved case studies are listed above them when they exist.
4. **Our values** (`Values.tsx`): four values; the words roll like an odometer between the pictures and change colour where they cross them.
5. **Services** (`Services.tsx`): the ground turns to night; a numbered list beside one notched frame, pinned while scrolling walks the rows and the picture follows the active row (or the one hovered or focused). "All services" closes the list.
6. **Contact** (`Contact.tsx`): an ivory sheet over Services; the word CONTACT cut in letter by letter, then two cards of equal height that share their rows, so their foot rules line up: start a project, and call or visit (address, hours, phone, email, Google rating, credentials).

The footer is the page's one charcoal band. Process, service areas and guides live on their own pages; the footer carries the confirmed contact details and the Ontario outline with the Greater Toronto Area marked (except on the 404, which draws its own).

## Motion

- **Homepage:** Lenis smooth scrolling and one frame loop driving every section from scroll position, in one vocabulary: sheets that rise over a receding layer, display type that only rolls through masks and never fades, entrances that ease out and exits that ease in, and beats that overlap so no frame is empty. See [MOTION.md](MOTION.md).
- **Preloader** (`Preloader.tsx`): on each full page load the outline of Ontario draws itself and the GTA dot is marked, then an iris opens from the dot onto the page. The outline is from SVG Maps (CC BY 4.0, see `public/images/CREDITS.md`).
- **Screen transition** (`ScreenTransition.tsx`): on every in-site link a graphite panel unfolds in 3D and scales up to cover the page while the Ontario outline draws on it; the next page loads underneath and the cover fades away.
- **Header and menu** (`MainNav.tsx`): past 80px of scroll on wide screens the top row lifts away and a menu button takes its place; the menu opens out of that button. Links roll their letters on hover and focus. The header follows the ground beneath it.
- **Footer** (every page): its content rises out from under the sheet above, and the Ontario outline draws itself again, the GTA dot landing last.
- **Other pages:** once the preloader or transition clears, the page header enters in order (breadcrumbs, label, the H1 line by line from behind masks, lead, rule) and the first picture unveils. Below it headings rise line by line and rows, hairlines and blocks follow one another in reading order as they enter (`InteractionEffects`); anything that takes focus or the pointer shows at once, and print shows everything; `data-parallax` pictures drift with scroll (`MotionRoot`).
- With reduced motion everything above is off or reduced to a short crossfade, and the homepage shows still layouts with all content visible (as do screens under 500px tall and visitors without JavaScript).

## Rules

- Vary layouts between sections (index rows, asymmetric images, a pinned column, a dark band). No card grids.
- Placeholders stay visible (`Placeholder`) until the business supplies the fact. Never fill them with sample content.
- Reviews are never written by hand, and Google review structured data is never added (Google does not allow it for a business's own reviews).
- Client renderings are captioned as renderings, never as photographs of finished buildings, and never with an address. Rendered studies are always captioned as studies and never presented as client projects.

## What could not be inspected

The build environment's network blocks the reference sites, so they were read as text (structure, copy, section order) and not seen. The motion started from the written specification Sebra supplied and has since moved on from it (see MOTION.md); the screen recording arrived only as a still frame. See "What could not be verified" in [MOTION.md](MOTION.md).
