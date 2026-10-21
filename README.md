<div align="center">

# Manuja Jayasinghe

**Full-Stack Developer · CS Undergraduate**

A scroll-driven portfolio built around a 3D black hole. Scroll to dive through the accretion disk, cross the event horizon, and land beside a planet.

![Three.js](https://img.shields.io/badge/Three.js-black?style=flat-square&logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-0AE448?style=flat-square&logo=greensock&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

</div>

---

## Highlights

- **Cinematic scroll journey.** One camera, four stages: a wide shot of the black hole, a dive toward the disk, a fall into the event horizon (dark, then a flash of light), and a slow drift around the planet while the content scrolls over it.
- **Smooth by design.** Lenis smooth scrolling shares one clock with GSAP ScrollTrigger, so pinned sections never jitter.
- **Sticky-stack projects.** Project cards stack as you scroll, each with a screenshot gallery and a demo video.
- **Polished details.** Magnetic buttons, spotlight panels, split-text reveals, a nav that tracks the current section, and a reduced-motion fallback.
- **No build step.** Plain HTML, CSS and JavaScript, so it deploys to any static host.

## Projects shown on the site

| Project | Stack |
| --- | --- |
| **TalentSync**, role-based recruitment platform with an AI chatbot and calendar-synced interviews | React · ASP.NET Core · SQL Server · EF Core · JWT |
| **Fitness Sharks**, gym management system with payments and role-based access | React · Spring Boot · MySQL · Spring Security · JPA/Hibernate |
| **ClearSight Recon**, AI forensic composite sketch generator (Cursor Buildathon 2026, 1st place FAL Track) | React · Vite · Fal AI · Netlify · jsPDF |

## Run it locally

Opening `index.html` directly (`file://`) won't work, because browsers block module imports and the model fetch. Serve the folder instead:

```bash
# Node
npx serve .

# or Python
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Project structure

```
.
├── index.html      Page structure and all content
├── style.css       Palette, type, layout, responsive rules
├── main.js         Three.js scene, scroll → camera logic, animation engine
└── assets/
    ├── scene.glb   Black hole model (single compressed file, ~10 MB)
    ├── projects/   Screenshots and demo videos
    └── *.webp      Portrait and avatar
```

The model is compressed with meshopt (geometry) and WebP (textures); `main.js` registers the matching decoder. If the model or WebGL is unavailable, the site shows its content without the 3D scene.

## Customize

- **Copy:** all text lives in `index.html`.
- **Camera path:** `K` in `main.js` holds every shot (`hero`, `heroOut`, `approach`, `core`, then `planet` and `drift`, built relative to the planet). To frame a shot, open `?cam=x,y,z&look=x,y,z&fov=50&roll=0`. Prefix a value with `p` (for example `cam=p24,-14,5`) to place it relative to the planet (back, right, up). `?cam=planet` shows the planet shot.
- **Scroll lengths:** the `#dive-spacer` height in `style.css`.
- **Palette:** CSS custom properties at the top of `style.css` (`--void`, `--amber`, `--corona` and others).

### Why the materials need custom code

The model uses the older glTF spec-gloss workflow (`KHR_materials_pbrSpecularGlossiness`), which current three.js no longer supports. A stock `GLTFLoader` silently drops the diffuse colours and textures, so the model renders as flat black chrome. `main.js` registers a small loader plugin that reads that data from the model and applies it to standard materials.

## Deploy

Any static host works (Vercel, Netlify, GitHub Pages). Push the files as they are. The model is about 10 MB; the loading bar shows real download progress, and the page appears anyway after 12 seconds if the download is slow.

## Contact

- Email: [manujapabasara36203@gmail.com](mailto:manujapabasara36203@gmail.com)
- GitHub: [@ManujaJayasinghe](https://github.com/ManujaJayasinghe)
- LinkedIn: [manuja-jayasinghe](https://www.linkedin.com/in/manuja-jayasinghe-2a78713a9)

## Credits

3D model: [Black Hole](https://sketchfab.com/3d-models/black-hole-e410da98b1e5445eae2acafaaa53587d) by NestaEric, licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/).

> This work is based on "Black Hole" (https://sketchfab.com/3d-models/black-hole-e410da98b1e5445eae2acafaaa53587d) by NestaEric (https://sketchfab.com/Nestaeric) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
