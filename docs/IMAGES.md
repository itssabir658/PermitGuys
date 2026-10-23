# Images

## What is on the site now

Two kinds of picture, registered as plates in `src/content/imagery.ts`. Each plate's `kind` says which it is, and `plateNote` gives the note its caption carries.

### Client renderings

`public/images/projects/` holds design renderings from nine PermitGuys client projects, supplied by PermitGuys in October 2026. Of the 36 images supplied, one or two views of each project were chosen, never more than two. Where a project had several near-identical renders, the best-graded one was used.

- **Captions.** Each caption says "Rendering of a client project." (`PROJECT_NOTE`). The projects page says it once in its lead and in each project's title column.
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
- The hero also has a tall crop of its picture for narrow portrait screens (the plate's `tall`).
- next/image serves resized AVIF and WebP copies.

Where they appear:

- On the homepage: the hero, the intro ring, Selected projects, Values, custom homes in Services, and the two contact cards.
- The bands on the services, how it works, about and service areas pages.
- The custom home permits page.
- All of them on the projects page, where `clientProjects` lists each project and its views. The anchors there are linked from Selected projects, and every service page links to the page from "Examples of our work" until it has approved case studies.

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
   - a short `caption`;
   - a `focus` that keeps the subject in narrow crops.
4. For a client rendering, add the plate to its project in `clientProjects`, which takes one or two views per project. For a photo of a completed project, published with the client's permission, add a case study in `src/content/projects.ts` instead. Approved case studies are listed on the projects page and the homepage.

Do not present stock photos or studies as PermitGuys projects.
