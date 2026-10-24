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

The homepage hero stands the name behind the house, so the terrace rendering is used in two planes (`heroLayers` in `src/content/imagery.ts`), each at the picture's own size and with its own tall crop, and each with the hero's veil drawn in (black from 55% at the top, 28% across the glazing at 38% down, 32% at 62%, to 70% at the foot, composited as a browser would; it used to be a gradient laid over each plane):

- **The near plane** (`contemporary-house-terrace-near.webp`, with copies at three quarters and half its width, and `-tall-near.webp`): what stands in front of the name (the house, the pine, the trees on the left and the ground), cut out of the rendering by its matte, as a transparent WebP (quality 80, lossless alpha; the smaller copies filtered in premultiplied alpha, so the cut edge keeps no fringe). The roofline and the walls of the matte were traced as polygons on edges fitted to the picture, so the roof's edge is crisp; the pine's and the trees' needles were keyed against the sky by brightness and hardened, so thin needles do not wash out. The pictures are served as they are, listed in a `srcset` by width, not through the image optimizer: its AVIF of a transparent picture is larger than the WebP and slow to make. Cutting the house out in its own picture, rather than masking the rendering with the matte in CSS, spares every frame the mask's offscreen pass and the page the matte's download.
- **The far plane** (`contemporary-house-terrace-far.jpg`, `-tall-far.jpg`): the rendering with everything the near plane keeps taken out and the sky rebuilt into the gap, with the distant trees on the right and the birds kept. Within 120px of the edge (more than the house ever moves) the gap takes the far plane's own texture, mirrored across the edge, so the trees behind the right wing carry on behind it as foliage; farther in it is a smooth fill from the sky around it (push-pull), which never shows while the house is in front of it. No ghost of the roof is left in it. On its own it looks half built, so the hero never shows it without the house (`data-waiting`, set in `HomeMotion.tsx`).
- **The geometry** the stylesheet places the name by was measured on the same picture: the roof's peak (1639.8, 456.4), the chimney's edge (x 900) and the roof's slopes either side of the peak (0.4728 and 0.1854), in the picture's pixels (`globals.css`, "Hero"). A different hero picture needs its own planes and numbers.

The veil is drawn to the picture's height, which is the stage's height on every screen up to the picture's own proportions (3800 × 1994); on a screen wider than that the picture is drawn to the width and its top shown, so the veil there is a little lighter at the foot than the old gradient was.

### The story drawing

The homepage story (`Story.tsx`) draws the narrow contemporary house over its own rendering, then lays it out as an elevation on a drawing sheet. The drawing is data in `src/content/story-drawing.ts`, measured from the picture so every line lands on the rendering's own edges:

- **The perspective.** The rendering is a one-point perspective: its verticals are vertical and every horizontal edge of the facade runs to one vanishing point far to the left. That point was fitted by least squares to 132 traced edges (within 0.04°).
- **The rectification.** The homography that keeps verticals vertical and sends the vanishing point to infinity turns the facade into a true elevation. It keeps one column, near the house's right edge, at the picture's own scale. Every line was measured on the rendering rectified that way, in its pixels.
- **Two places for every line.** Mapped back through the homography, a line lands on the picture (`p`); scaled into the sheet beside its levels and grid, it is the elevation (`q`). Where depth shows the picture something an elevation would not (the porch floor seen from above, the steps coming forward, the window deep in its surround), the sheet's line is placed where the elevation has it. The story moves every line from one place to the other.
- **The engineering is illustrative.** The grid lines sit on the main walls, the levels on the roofs, the floors and grade, and the beams, posts and footings where a house like this would have them. They are labelled by what they are, never by a size, and the caption says the linework is drawn for illustration. Nothing on the sheet is a measurement of the project.

`tests/story-drawing.test.ts` checks the geometry: the rectification and its inverse, the vanishing point, the bounds, and that the sheet is square and level.

### The ground-up drawing

The house in "From the ground up" (`GroundUp.tsx`) is neither a picture nor a client project: it is an illustrative two-storey house with a basement, modelled in `src/content/ground-up-drawing.ts` and painted in code when the site is built.

- **The model.** Boxes and the roof's planes in metres (7.2 m across the front, 11.4 m deep), with their openings: footings and foundation walls, two steel posts, a steel beam and joists, the floors' walls with doors, windows and a stair, and a gable roof. It is a plausible house of its kind, not a design: no sizes are drawn and none of it should be read as one.
- **The view.** Orthographic, the plan turned 30° and seen from 35° above the horizon, 100 drawing units to the metre. Each layer is painted on its own with its hidden lines removed: parts back to front, an edge between two faces of one surface left out, reveals and glass clipped to their openings, and parts that cannot hide one another painted together, so a layer is a few dozen paths. Path data is in whole units (a centimetre, well under a pixel at any size the drawing is shown).
- **The draft.** Every edge of a layer, the hidden ones too, once each, from the ground up, as one path the motion draws line by line.

`tests/ground-up-drawing.test.ts` checks the layers, their paths and bounds, and the tags.

### Rendered studies

`public/images/studies/` holds original renders made for this website. They are kept only for kinds of project that no client rendering shows: a rear addition, a basement second unit, main-street commercial units and a storefront, a rear deck, and an infill house for landlord permits.

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
