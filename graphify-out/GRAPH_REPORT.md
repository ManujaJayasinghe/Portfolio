# Graph Report - portfolio  (2026-10-05)

## Corpus Check
- Large corpus: 23 files · ~510,281 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 96 nodes · 111 edges · 9 communities (7 shown, 2 thin omitted)
- Extraction: 82% EXTRACTED · 17% INFERRED · 1% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Scene Animation Loop
- Page Structure & Layout
- Ring Textures
- Black Hole Light Layers
- Scroll Math Helpers
- Black Hole Skin Textures
- Spec-Gloss Plugin
- Camera Keyframes
- Planet Assets

## God Nodes (most connected - your core abstractions)
1. `Portfolio README` - 8 edges
2. `updateScroll()` - 6 edges
3. `SpecularGlossinessPlugin` - 5 edges
4. `main.js (Three.js scene, scroll to camera)` - 5 edges
5. `Black Hole model by NestaEric (CC-BY-4.0)` - 4 edges
6. `assets/scene.gltf model (with scene.bin, textures)` - 4 edges
7. `Hero overlay (nav, name, lede, scroll cue)` - 4 edges
8. `nearPlanet()` - 3 edges
9. `Scroll-driven black hole to planet journey` - 3 edges
10. `References/Contact section and footer` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Blackhole model license (rubykamen, CC-BY-4.0)` --semantically_similar_to--> `Black Hole model by NestaEric (CC-BY-4.0)`  [AMBIGUOUS] [semantically similar]
  license.txt → README.md
- `Black hole ring emissive map` --conceptually_related_to--> `Ring`  [INFERRED]
  textures/Blackhole_ring_emissive.jpeg → assets/textures/ring_diffuse.png
- `WebGL canvas #scene` --shares_data_with--> `main.js (Three.js scene, scroll to camera)`  [INFERRED]
  index.html → README.md
- `Black hole light layer 1 emissive map: horizontal gradient bands of orange, white, green, lavender and blue` --semantically_similar_to--> `Black hole light layer 2 emissive map`  [INFERRED] [semantically similar]
  assets/textures/black_hole_light1_emissive.png → assets/textures/black_hole_light2_emissive.png
- `Black hole light layer 2 emissive map` --semantically_similar_to--> `Black hole light layer 3 emissive map`  [INFERRED] [semantically similar]
  assets/textures/black_hole_light2_emissive.png → assets/textures/black_hole_light3_emissive.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Scroll dive experience** — index_hero_overlay, index_transition_layers, index_scene_canvas, main_js [INFERRED 0.75]
- **Black hole light layer textures** — assets_textures_black_hole_light1_emissive, assets_textures_black_hole_light2_emissive, assets_textures_black_hole_light3_emissive [INFERRED 0.75]
- **Black hole skin emissive textures** — textures_blackhole_skin_emissive, textures_blackhole_skin_inner_emissive, assets_textures_black_hole_blackoutside_diffuse [INFERRED 0.65]
- **Ring material maps** — assets_textures_ring_diffuse, assets_textures_ring_specularglossiness, assets_textures_ring2_specularglossiness [INFERRED 0.75]

## Communities (9 total, 2 thin omitted)

### Community 0 - "Scene Animation Loop"
Cohesion: 0.05
Nodes (31): bloom, camera, canvas, clock, composer, current, cursorDot, cursorEl (+23 more)

### Community 1 - "Page Structure & Layout"
Cohesion: 0.13
Nodes (22): assets/scene.gltf model (with scene.bin, textures), Google Fonts Fraunces and IBM Plex Sans, Hero overlay (nav, name, lede, scroll cue), Loader with progress bar, WebGL canvas #scene, Education/Projects section, Planet section, References/Contact section and footer (+14 more)

### Community 2 - "Ring Textures"
Cohesion: 0.29
Nodes (7): Ring 2 specular-glossiness map, Planetary ring diffuse map: horizontal bands of tan, brown and blue-grey, Ring specular-glossiness map, Ring, Black hole ring 2 emissive map, Black hole ring base color map, Black hole ring emissive map

### Community 3 - "Black Hole Light Layers"
Cohesion: 0.33
Nodes (6): Black hole light layer 1 diffuse map, Black hole light layer 1 emissive map: horizontal gradient bands of orange, white, green, lavender and blue, Black hole light layer 2 diffuse map, Black hole light layer 2 emissive map, Black hole light layer 3 diffuse map, Black hole light layer 3 emissive map

### Community 4 - "Scroll Math Helpers"
Cohesion: 0.33
Nodes (6): clamp01(), docTop(), easeIn(), lerpShot(), smooth(), updateScroll()

### Community 5 - "Black Hole Skin Textures"
Cohesion: 0.40
Nodes (5): Black hole outer shell diffuse map: plain white, Black hole outer shell specular-glossiness map, Black hole 3D model, Black hole skin emissive map: glowing orange-gold swirling disc on black, Black hole inner skin emissive map

### Community 7 - "Camera Keyframes"
Cohesion: 0.67
Nodes (3): buildKeyframes(), nearPlanet(), vec()

## Ambiguous Edges - Review These
- `Black Hole model by NestaEric (CC-BY-4.0)` → `Blackhole model license (rubykamen, CC-BY-4.0)`  [AMBIGUOUS]
  license.txt · relation: semantically_similar_to

## Knowledge Gaps
- **48 isolated node(s):** `params`, `canvas`, `renderer`, `scene`, `camera` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 56 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Black Hole model by NestaEric (CC-BY-4.0)` and `Blackhole model license (rubykamen, CC-BY-4.0)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `SpecularGlossinessPlugin` connect `Spec-Gloss Plugin` to `Scene Animation Loop`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `params`, `canvas`, `renderer` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Scene Animation Loop` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Page Structure & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._