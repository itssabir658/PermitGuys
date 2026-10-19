# Images

Licensed stock sites could not be reached from the build environment, so the site currently uses drafted SVG illustrations (`src/components/ui/Drawing.tsx`). Each is captioned as an illustration so it is not mistaken for project photography.

## Adding a photo

1. Save the optimized file under `public/images/` (JPEG or WebP, about 2400px on the long edge).
2. Record it in `public/images/CREDITS.md` with source URL, author and licence.
3. Add a `photo` to the relevant `visual`:

```ts
visual: {
  drawing: "addition",
  alt: "...",
  photo: {
    src: "/images/rear-addition.jpg",
    alt: "Describe what the photo shows",
    width: 2400,
    height: 1800,
    credit: "Photographer name, Unsplash",
    licence: "Unsplash Licence",
    sourceUrl: "https://unsplash.com/photos/...",
  },
},
```

`Figure` then renders the photo with `next/image` at the same aspect ratio, and the caption shows the credit.

For the homepage hero, replace the drawing panel in `src/components/home/Hero.tsx` with a `<Figure visual={...} priority />` or place the photo behind the drawing.

Only use real project photos with the client's permission. Do not present stock photos as PermitGuys projects.
