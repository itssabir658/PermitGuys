# Images

## What is on the site now

Licensed stock and photo sites could not be reached from the build environment, and no PermitGuys project photos have been supplied yet. The site therefore uses **original rendered studies** made for this website: massing models and dusk visualisations of the kinds of projects PermitGuys prepares drawings for (an infill house, a rear addition, a basement second unit, a main-street commercial building, a rear deck).

They live in `public/images/studies/` and are registered in `src/content/imagery.ts`. Every caption carries the note "Rendered study for illustration, not a client project." (`STUDY_NOTE`), and the homepage "Selected studies" section says so in its introduction. They must never be presented as PermitGuys work.

The illustrative SVG drawings (`src/components/ui/Drawing.tsx`) are still used on guide and case-study pages, captioned as illustrations.

### How the studies were made

Each image was modelled and rendered in Blender (Cycles, via the `bpy` Python package) from scripted scenes: simple architectural massing, procedural materials (render, standing-seam metal, timber, brick, glass), a sky and sun or dusk lighting, and depth of field for the "study model" shots. The renders were then graded and exported as progressive JPEGs at 1600 to 2560px on the long edge. No third-party imagery, textures or models were used, so there is nothing to credit.

## Replacing a study with a real photo

1. Save the optimised file under `public/images/` (JPEG or WebP, about 2400px on the long edge).
2. Record it in `public/images/CREDITS.md` with its source, author and licence (or "PermitGuys project, client permission on file").
3. Point the matching plate in `src/content/imagery.ts` at it, update `alt` and `caption`, and drop the study note for that plate.
4. For a genuine client project, also add a case study in `src/content/projects.ts`; the homepage lists approved case studies ahead of the studies.

Only use real project photos with the client's permission. Do not present stock photos as PermitGuys projects.
