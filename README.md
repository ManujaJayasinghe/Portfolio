# Portfolio

Scroll-driven site. Page 1 is a wide shot of the black hole; scrolling swoops
the camera down to the disk and into the event horizon (screen goes black,
then a flash of light), and you come out beside the planet that orbits
inside the disk. That planet view is page 2; skills, projects and contact
scroll over it while the camera drifts.

## Run it locally

Opening `index.html` directly (`file://`) won't work — browsers block module
imports and the model fetch over `file://`. Serve the folder instead:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000`.

## Files

- `index.html` — page structure and content (hero, approach, education,
  skills, projects)
- `style.css` — color palette, type, layout
- `main.js` — Three.js scene, model loading, scroll → camera logic
- `assets/` — the model, split as it was exported: `scene.gltf`,
  `scene.bin`, and `textures/` (12 diffuse/emissive/specular-glossiness
  maps). All four must stay together and in this layout — `scene.gltf`
  references the other two by relative path.

### Why materials needed custom code

This model uses the older glTF "spec-gloss" material workflow
(`KHR_materials_pbrSpecularGlossiness`), which current three.js no longer
supports out of the box — loading it with a stock `GLTFLoader` silently
drops every diffuse color, surface texture, and specular map, which is why
the first version looked flat. `main.js` registers a small loader plugin
(`SpecularGlossinessExtension`) that reads that data straight from the
model file and applies it by hand — that's the fix, not a different model.

### License

The model is [Black Hole](https://sketchfab.com/3d-models/black-hole-e410da98b1e5445eae2acafaaa53587d)
by NestaEric, CC-BY-4.0. If you publish this site, keep the credit:

> This work is based on "Black Hole"
> (https://sketchfab.com/3d-models/black-hole-e410da98b1e5445eae2acafaaa53587d)
> by NestaEric (https://sketchfab.com/Nestaeric) licensed under CC-BY-4.0
> (http://creativecommons.org/licenses/by/4.0/)

## Customize

- **Copy**: all text lives directly in `index.html` — name, tagline, the four
  project entries, your real email in the `mailto:` link at the bottom.
- **Camera path**: `K` in `main.js` holds every shot (`hero`, `heroOut`,
  `approach`, `core`, then `planet`/`drift` built relative to the planet).
  To frame a shot, open `?cam=x,y,z&look=x,y,z&fov=50&roll=0` — prefix a
  value with `p` (e.g. `cam=p24,-14,5`) to place it relative to the planet
  (back, right, up). `?cam=planet` shows the page-2 shot.
- **Scroll lengths**: `#hero-spacer` / `#dive-spacer` heights in `style.css`.
- **Palette**: CSS custom properties at the top of `style.css`
  (`--void`, `--amber`, `--rust`, `--corona`, `--blue`).

## Deploy

Any static host works (Vercel, Netlify, GitHub Pages) — no build step, just
push these four files/folders as-is. The model is ~30 MB, so first load will
be slow on a cold connection; the loading bar on screen reflects real
download progress.
