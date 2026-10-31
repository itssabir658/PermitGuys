# Images

## What is on the site now

Two kinds of picture, registered as plates in `src/content/imagery.ts`. Each plate's `kind` says which it is, and `plateNote` gives the note its caption carries.

### Client renderings

`public/images/projects/` holds design renderings from nine PermitGuys client projects, supplied by PermitGuys in October 2026. Of the 36 images supplied, one or two views of each project were chosen, never more than two. Where a project had several near-identical renders, the best-graded one was used.

- **Captions.** A caption is only the note "Rendering of a client project." (`PROJECT_NOTE`), with no figure number or picture name. The projects page says it once in its lead and in each project's title column, and its pictures go uncaptioned.
- **What the site claims.** The pictures are renderings, so the site never presents them as photographs of finished buildings. Nothing on the site describes a project's scope, approval or result.
- **No addresses.** Captions, alt text, anchors and file names describe the house, never its street, number or town.
- **Retouching.** Three renderings showed part of an address, and each was retouched out:
  - an engraved sign on a portico;
  - a number plaque between garage doors;
  - metal numerals on a block beside a drive.
- **Car number plates.** These are stock props from the 3D car models, not real plates, so they are left as they are.

Preparation:

- Each file was converted from its embedded colour profile (several were Adobe RGB) to sRGB.
- Each was resized to between 2800 and 3800px wide, stripped of metadata and saved as a progressive JPEG at quality 84.
- The hero also has a tall crop of its picture for narrow portrait screens (the plate's `tall`), and is split into planes (below).
- next/image serves resized AVIF and WebP copies.

Where they appear:

- On the homepage: the hero, the intro ring, the story (the narrow contemporary house, under the linework traced from it), Selected projects, Values, custom homes in Services, and Contact's picture (the story's house is not repeated there).
- The bands on the services, how it works, about and service areas pages.
- The custom home permits page.
- All of them on the projects page, where `clientProjects` lists each project and its views. The anchors there are linked from Selected projects, and every service page links to the page from "Examples of our work" until it has approved case studies.

### The hero's layers

The homepage hero moves the house and the sky at their own depths, so the terrace rendering is used in two planes (`heroLayers` in `src/content/imagery.ts`), each at the picture's own size and with its own tall crop, and each with the hero's veil drawn in (black from 55% at the top, 28% across the glazing at 38% down, 32% at 62%, to 70% at the foot, composited as a browser would; it used to be a gradient laid over each plane):

- **The near plane** (`contemporary-house-terrace-near.webp`, with copies at three quarters and half its width, and `-tall-near.webp`): what stands in front of the sky (the house, the pine, the trees on the left and the ground), cut out of the rendering by its matte, as a transparent WebP (quality 80, lossless alpha; the smaller copies filtered in premultiplied alpha, so the cut edge keeps no fringe). The roofline and the walls of the matte were traced as polygons on edges fitted to the picture, so the roof's edge is crisp; the pine's and the trees' needles were keyed against the sky by brightness and hardened, so thin needles do not wash out. The pictures are served as they are, listed in a `srcset` by width, not through the image optimizer: its AVIF of a transparent picture is larger than the WebP and slow to make. Cutting the house out in its own picture, rather than masking the rendering with the matte in CSS, spares every frame the mask's offscreen pass and the page the matte's download.
- **The far plane** (`contemporary-house-terrace-far.jpg`, `-tall-far.jpg`): the rendering with everything the near plane keeps taken out and the sky rebuilt into the gap, with the distant trees on the right and the birds kept. Within 120px of the edge (more than the house ever moves) the gap takes the far plane's own texture, mirrored across the edge, so the trees behind the right wing carry on behind it as foliage; farther in it is a smooth fill from the sky around it (push-pull), which never shows while the house is in front of it. No ghost of the roof is left in it. On its own it looks half built, so the hero never shows it without the house (`data-waiting`, set in `HomeMotion.tsx`).
- A different hero picture needs its own planes.

The veil is drawn to the picture's height, which is the stage's height on every screen up to the picture's own proportions (3800 × 1994); on a screen wider than that the picture is drawn to the width and its top shown, so the veil there is a little lighter at the foot than the old gradient was.

### The story drawing

The homepage story (`Story.tsx`) draws the narrow contemporary house over its own rendering, then lays it out as an elevation on a drawing sheet. The drawing is data in `src/content/story-drawing.ts`, measured from the picture so every line lands on the rendering's own edges:

- **The perspective.** The rendering is a one-point perspective: its verticals are vertical and every horizontal edge of the facade runs to one vanishing point far to the left. That point was fitted by least squares to 132 traced edges (within 0.04°).
- **The rectification.** The homography that keeps verticals vertical and sends the vanishing point to infinity turns the facade into a true elevation. It keeps one column, near the house's right edge, at the picture's own scale. Every line was measured on the rendering rectified that way, in its pixels.
- **Two places for every line.** Mapped back through the homography, a line lands on the picture (`p`); scaled into the sheet beside its levels and grid, it is the elevation (`q`). Where depth shows the picture something an elevation would not (the porch floor seen from above, the steps coming forward, the window deep in its surround), the sheet's line is placed where the elevation has it. The story moves every line from one place to the other.
- **The engineering is illustrative.** The grid lines sit on the main walls, the levels on the roofs, the floors and grade, and the beams, posts and footings where a house like this would have them. They are labelled by what they are, never by a size, and the caption says the linework is drawn for illustration. Nothing on the sheet is a measurement of the project.

`tests/story-drawing.test.ts` checks the geometry: the rectification and its inverse, the vanishing point, the bounds, and that the sheet is square and level.

### The making-of drawings

The section "The making of a house" (`Making.tsx`) is told on the big contemporary house the homepage opens on, with its client renderings from the front.

- **The pictures.** `public/images/projects/making/`: the front view by day and at dusk, both cropped to 16:9 from the same pixel-aligned renderings (2560 × 1440), and `front-glass.webp`, the dusk picture with only its glass kept (an alpha mask from the elevation's openings), so the lit windows can come up in the drawing before the whole rendering does. The renderings' file names carry the project's address; the copies here do not.
- **The elevation** is traced from the front rendering line by line, in its pixels (the 16:9 crop starts 126 px in), so every line lands on the edge it was traced from: the ground, the volumes and parapets, the dark panel boxes, the openings with their mullions and transoms, the joints and boards. The garage wing's side wall, seen at an angle in the rendering, is drawn as seen.
- **The plan, the site and the structure are illustrations**, drawn to show each stage, not the project's drawings: the floor plan sits at the elevation's scale with every front opening under the opening it makes in the elevation; the site plan is the plan's footprint 2.4 times farther off about the board's centre, so zooming in lands it on the plan; the structure follows the elevation exactly (a header or steel beam over every front opening, steel posts in the piers under the long spans, the second floor's framing, footings under the bearing walls), labelled by what it is and never by a size. The caption says so.
- Paths are straight lines in whole units, generated into `src/content/making-drawing.ts`.
- **The film.** `public/videos/making/front-dusk-*`: an 8-second image-to-video clip made with Higgsfield (Wan) from the dusk picture, a gentle push in of about 10% with the sky, trees and birds drifting and the architecture unchanged (checked frame by frame; takes that changed the house or the sky's colour were rejected). Its first frame matches the dusk picture. Encoded as H.264 (CRF 26, faststart, no audio) at 1080p and 720p, plus VP9 WebM copies. The caption says the section has a film.

`tests/making-drawing.test.ts` checks the path data, the bounds and the labels.

### Rendered studies

`public/images/studies/` holds original renders made for this website. They are kept only for kinds of project that no client rendering shows: a rear addition, a basement second unit, main-street commercial units and a storefront, a rear deck, and an infill house for landlord permits.

Four more were added in October 2026 with the service pages for below-grade entrances, detached garages, finished basements and load-bearing wall removal (`below-grade-entrance.jpg`, `detached-garage.jpg`, `finished-basement.jpg`, `beam-open-plan.jpg`). These were generated with Higgsfield (GPT Image 2, 2048 × 1360) rather than modelled in Blender, saved as progressive JPEGs at quality 84, and carry the same study caption. They show only the kind of work, with no people, signs or house numbers.

Every caption carries "Rendered study for illustration, not a client project." (`STUDY_NOTE`). That includes the caption under the Services picture on the homepage, which switches between the two notes with the picture. The studies must never be presented as PermitGuys work.

The illustrative SVG drawings (`src/components/ui/Drawing.tsx`) are still used on guide and case-study pages, captioned as illustrations.

### How the studies were made

Each image was modelled and rendered in Blender (Cycles, via the `bpy` Python package) from scripted scenes:

- simple architectural massing;
- procedural materials: render, standing-seam metal, timber, brick and glass;
- a sky and sun, or dusk lighting;
- depth of field for the "study model" shots.

The renders were then graded and exported as progressive JPEGs at 1600 to 2560px on the long edge. No third-party imagery, textures or models were used, so there is nothing to credit.

## Sizing

Frames crop their pictures with `object-fit: cover`. A picture wider than its frame is drawn to the frame's height, so it is wider on screen than the frame. To keep it sharp, `sizes` must ask for that wider width. Two helpers in `imagery.ts` work it out:

- `coverWidth` takes a frame's aspect ratio and width.
- `coverWidthByHeight` takes a portrait frame's height.

Both take a `scale` for pictures zoomed inside their frame (drift, the Works shots).

## Adding or replacing a picture

1. Save the file under `public/images/`, as a JPEG or WebP of about 2400 to 3800px on the long edge, converted to sRGB. Remove anything that shows an address: house numbers, street signs, mailboxes.
2. Record it in `public/images/CREDITS.md` with its source, author and licence, or "Supplied by PermitGuys".
3. Add a plate in `src/content/imagery.ts`:
   - `kind`;
   - `alt` describing what the picture shows (for a rendering, start with "Rendering of");
   - a short `caption`, the picture's name (Selected projects on the homepage uses it as the project's title; it is not shown under pictures);
   - a `focus` that keeps the subject in narrow crops.
4. For a client rendering, add the plate to its project in `clientProjects`, which takes one or two views per project. For a photo of a completed project, published with the client's permission, add a case study in `src/content/projects.ts` instead. Approved case studies are listed on the projects page and the homepage.

Do not present stock photos or studies as PermitGuys projects.

## The intro's map

The intro (`Preloader.tsx`) fills the five regions of the Greater Toronto Area with five client renderings, one per region, in `public/images/intro/`. The pairing is a mood, not a claim: nothing says or implies that a house is in the region it fills.

| Region | Rendering |
|---|---|
| Halton | Classical house at dusk, behind clipped hedges and a pond (supplied 24 October 2026; `public/images/projects/classical-house-dusk.jpg`, converted from Adobe RGB to sRGB, 3800px, quality 84) |
| Peel | Contemporary house at dusk, its exterior lighting on |
| York | Stone house with three gables |
| Toronto | Narrow contemporary house between tall trees |
| Durham | Farmhouse bungalow on a wide lawn |

`scripts/gta-map/build.py` makes both the map and the pictures (Python 3 with shapely and Pillow, and Node for mapshaper):

- **Boundaries.** Statistics Canada, 2021 Census cartographic boundary file, census divisions (Durham 3518, York 3519, Toronto 3520, Peel 3521, Halton 3524), from its ArcGIS map service, under the Open Government Licence - Canada. The cartographic file follows the Lake Ontario shoreline; the regions' own lines run out into Lake Simcoe in the north, as the census divisions do. Kept in Statistics Canada's Lambert conformal conic projection (EPSG:3347), north up, and drawn in straight lines (Sebra, 24 October 2026: "only straight lines and reduce no. edges"): simplified with mapshaper's Douglas-Peucker at 3.5 km (Sebra again, the same evening: "reduce edges or curves"), so the whole map has about forty corners and neighbouring regions share exactly the same edge. Islands are dropped, and so are the shoreline's narrow spikes (harbour spits) where no other region shares the corner. Written to `src/content/gta-map.ts`.
- **Pictures.** Each rendering is cropped to its region's bounding box, centred as far as the picture allows on the region's deepest point, given one quiet grade (less colour and light) so daylight and dusk sit together on the charcoal, and saved as WebP at three widths: about 560 and 1100px on the long edge, and the crop's full resolution up to 2000px (1400 to 2000px). Phones take the 560 cut, or the 1100 on high-density screens; larger screens the 1100, or the full one on high-density screens; screens 1920px wide and up, 4K included, always the full one. The full cuts weigh about 2MB together and load only on those screens, during the first two seconds of drawing.

The pictures carry no alt text: the intro is decorative and hidden from assistive technology. File names describe the house, never an address.
