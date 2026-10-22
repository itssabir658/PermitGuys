# Homepage motion

The homepage follows the Studio Foundry motion specification Sebra supplied (MOTION-SPEC.md, 22 October 2026), built in the order its checklist sets: the scroll engine first, then the sticky tracks, then the signature moments. The content is PermitGuys': confirmed business facts only, and every picture is a rendered study captioned as one.

Code comments point here by section name.

## Scroll engine

- **Lenis 1.3.27** (`src/lib/motion/engine.ts`) with the spec's settings: `duration 1.2`, the exponential ease-out, vertical wheel smoothing, native touch scrolling. With reduced motion: `duration 0`, linear, no wheel smoothing.
- **One frame loop** runs everything in a fixed order: Lenis, frame callbacks (roll links), the page's modules by `order` (ground, hero, intro, works, values, services, contact, parallax), then the header. `dt` is clamped to 50ms, so a tab left in the background does not jump when it comes back.
- **Progress values** as in the spec: `sso` (showScreenOffset, 0 when an element's top meets the bottom of the screen, 1 at the top), `hso` (hideScreenOffset) and `screenRatio`. Ranges are measured from the `offsetTop` chain, so transforms never feed back into them, and are re-measured on resize, font load, body resize and route change.
- **Maths** (`src/lib/motion/math.ts`): `fit`, `smoothstep`, `mix`, colour mixing, the frame-rate independent `damp` (λ 12 closes about 95% of a gap in 250ms), and the GSAP eases as plain functions. All choreography is pure functions of scroll in `src/lib/motion/home.ts`, unit tested in `tests/motion.test.ts`.
- **Tracks mode.** The pinned tracks run only when motion is allowed and the screen is at least 500px tall (`(prefers-reduced-motion: no-preference) and (min-height: 500px)`, the `tracks:` Tailwind variant and `TRACKS_QUERY`). Otherwise every section falls back to a still, ordinary layout with all content shown. A head script sets `data-motion` before first paint, so the server HTML never flashes the wrong layout, and an 8 second failsafe reveals the page if scripts never run.

## Load sequence

| Time | What happens |
|---|---|
| 0 | Preloader: the outline of Ontario draws in five strokes (0.7s each, 0.14s apart), then the GTA dot appears. This replaces the reference's arch logo, at Sebra's request. |
| ≥ 0.6s | The preloader waits for its drawing, the fonts and the hero picture (capped at 3.5s), and at least 0.6s. |
| +0.1s | It fades out over 0.6s (power1.out). |
| T₀ + 1.5s | The hero name rises out of its mask (0.9s, power1.out). The picture and header sit still until then, the spec's characteristic pause. |
| T₀ + 1.6s | Header items fade down into place (0.8s, 0.06s apart). |
| T₀ + 2.0s | The statement's two lines rise (0.7s, 0.05s apart). |

Scroll is reset to the top on load (`history.scrollRestoration = "manual"`), as the reference does.

## Sections (scroll map at 1440×900)

| Section | Track | Behaviour |
|---|---|---|
| Hero (`Hero.tsx`) | 0–2 screens, sticky stage | From half a screen of scroll to the end of the track the name rises and the statement sinks by half a screen each, both fading to 0 exactly at 1,800px. |
| Intro orbit (`Intro.tsx`) | 2–8 screens (600vh, computed from the paragraph count) | Six studies spread from the centre and circle it on six of the reference's seven orbit slots (its angles, radii and speeds) (0.12 turns per screen, radius 0.68 × the shorter side). The two paragraphs rise through the middle line by line, one after the other. Over the last screen the ring is flung out to three times its radius. |
| Works (`Works.tsx`) | 8–12.5 screens, a 150vh panel per study | Each study resolves when its panel's `sso` is 1.25: title, type and button in nested windows (`K = 1 − smoothstep(|t|, 0.3 − 0.1k, 0.7 − 0.1k)`), arriving downward and leaving upward; the picture grows from half size. The button only takes clicks within `|t| < 0.15`, and keyboard focus scrolls its study into place. The page ground takes a faint wash of each study's colour. |
| Values (`Values.tsx`) | 12.5–16.9 screens, 110vh per value | Four values (Clarity, Candour, Ownership, Integrity). Each picture scales from 0.5 to 1 as it reaches the top; the large title and its description sit in a pinned layer drawn twice, ink over the page and ivory inside a mask that tracks the picture, so the words change colour where they cross it. Text swaps as the nearest picture changes. |
| Colour buffer | 16.9–17.4 screens | The page ground fades from cream to night (`smoothstep(sso, 0.4, 1)`) and snaps back to cream once Services has passed. |
| Services (`Services.tsx`) | 17.4 screens on | The picture wipes up from the bottom while settling from a 1.15 zoom; the heading's lines rise and the rows follow on a scroll-distance stagger (0.04 of a screen each). On wide screens, pointer or focus on a row slides the picture strip to that row's study, damped at λ 12. On phones the section becomes a 300vh pinned track and the active row follows the scroll. |
| Contact (`Contact.tsx`) | after Services | The heading and two cards each rise 28px and fade in between 0.08 and 0.42 of a screen after entering, and sink back on the way up. |

Every scrubbed value is a pure function of scroll position, so scrolling back up reverses everything exactly.

Measured page lengths: 21.3 screens at 1440×900 (19,199px) and 24.6 screens at 390×844, against the reference's 19.45. The difference is content: four values instead of three, seven services instead of five.

## Navigation and page transitions

- **Navigation** (`MainNav.tsx`): past 80px of scroll on screens 768px and wider, the top row lifts away item by item (0.04s apart) and the menu button rises into the corner; it all comes back at the top. Phones keep the logo and menu button. The header switches between light and dark over dark sections and the night ground.
- **Menu**: opens as a FLIP from the button's own rectangle (0.5s, power3.out), rows rising 0.03s apart from 0.15s; closes back into the button. Escape, an outside click and navigation close it; focus is trapped while it is open and returned to the button.
- **Roll links**: header, menu and footer links roll their characters (0.4s, 0.02s apart, power1.inOut) on hover and keyboard focus, and roll back from wherever they have got to. Each word rolls in its own mask so long labels can wrap.
- **Link buttons** (`LinkButton.tsx`): the plate and icon round their corners, a wipe crosses the plate, the arrow cube turns 90° and a shine passes over the label.
- **Page transitions** (`ScreenTransition.tsx`): on an in-site link, the page dims (0.5s from 0.2s), a graphite panel unfolds in 3D (`rotateX/rotateY 90° → 0`, 0.7s) and scales up to cover from 0.35s, and the outline of Ontario draws on it, as Sebra asked. The next page loads underneath, holds briefly, and the cover fades away (0.7s). With reduced motion it is a 0.3s crossfade.
- **Parallax** (`MotionRoot.tsx`): pictures marked `data-parallax` on other pages sit at 120% and drift with `screenRatio`, as the spec's shared utility.

## Reduced motion

With `prefers-reduced-motion: reduce`: Lenis duration 0 and no wheel smoothing; the preloader is skipped; the hero, intro, works, values, services and contact show their still layouts with everything visible; the services picture follows the row instantly; roll links and parallax are off; page transitions are a 0.3s crossfade; and CSS durations collapse to 0.01ms.

## Where this differs from the spec

- **No WebGL layer.** The spec's own advice is to build the complete DOM version first, and its shaders were never captured, so nothing of them is guessed. The `homeCard` FLIP between the works card and its page belongs to that layer and is not built either.
- **Colours** are PermitGuys' ivory (`#f4f1eb`) and graphite (`#191918`) rather than the reference's `#F3F0EC` and `#1A1A1A`, and the works tints are PermitGuys' own.
- **Section lengths** follow the content (four values, seven services), so the scroll map is longer than the reference's.
- **The preloader drawing** is Ontario's outline, not the arch logo, and the transition panel carries the same outline.
- **Link button corners** use a CSS `clip-path` rounding rather than the reference's hand-built path morph.
- **Other pages** keep their existing reveal-on-scroll behaviour; the spec's section-description scrub, contact-page intro and works index were not part of this work.
- **Short screens** (under 500px tall, such as a phone on its side) get the still layout rather than the reference's short-landscape variant.

## What could not be verified

- **The screen recording.** Only a still frame of Sebra's video arrived, so this follows the written spec, not the recording. Anything in the video the spec does not describe is not here.
- **The live reference site** cannot be opened from the build environment.
- **Real device feel.** Checked in headless Chromium at 1440×900, 820×1180, 390×844 and 844×390, with frame captures and 25fps recordings; not yet on a physical phone or in Safari.
- **Line counts** depend on the fonts actually loaded; the line splitting re-runs whenever a block's width changes.

## Checks

- `tests/motion.test.ts`: the spec's numeric parity checks (hero gone at 1,800px with 450px travel, a 600vh intro for two paragraphs, 0.6 base turns and a ×3 exit radius, works peak at `sso` 1.25, ground colours either side of the buffer, damping at λ 12) plus the window maths of every section.
- `e2e/site.spec.ts`: reduced motion, the menu at every width, the page transition and its reduced-motion crossfade, axe on every main page, and no sideways scrolling.
