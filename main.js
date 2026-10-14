/**
 * MANUJA PORTFOLIO — main.js
 *
 * ① Three.js scene — "Black Hole" by NestaEric (assets/scene.gltf)
 *    The model holds both the black hole and a small planet orbiting
 *    inside its disk. Scroll drives one camera through four stages:
 *      hero   → wide shot of the black hole (page 1)
 *      dive   → camera falls into the event horizon, screen washes out
 *      planet → camera re-emerges beside the planet (page 2)
 *      drift  → slow orbit around the planet behind the content sections
 *
 * ② Lusion-style animation engine
 *    - Magnetic buttons, spotlight panels
 *    - Split-text: chars, words, lines
 *    - IntersectionObserver scroll reveals
 */

import * as THREE from 'three';
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';

/* ═══════════════════════════════════════════════════════════════
   ①  THREE.JS SCENE
═══════════════════════════════════════════════════════════════ */

const params = new URLSearchParams(location.search);

/* Smooth scrolling (Lenis) — native scroll position is still the source of truth */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = window.Lenis && !reduceMotion ? new window.Lenis({ lerp: 0.09, smoothWheel: true }) : null;
if (lenis) (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
const vec = (s) => s && (s.startsWith('p')
  ? nearPlanet(...s.slice(1).split(',').map(Number))
  : new THREE.Vector3(...s.split(',').map(Number)));

/* Renderer */
const canvas   = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: params.has('cam') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace     = THREE.SRGBColorSpace;
renderer.toneMapping          = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure  = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 30000);

/* ── Lighting ─────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.08));

// The accretion disk is the only real light source — a warm point
// light at the singularity lights the planet's hole-facing side.
const diskLight = new THREE.PointLight(0xffd9a0, 6, 0, 0);
scene.add(diskLight);

// Fill for the planet's camera-facing side (aimed once the planet is placed)
const planetFill = new THREE.DirectionalLight(0xffc98a, 0.5);
scene.add(planetFill, planetFill.target);

// Faint cool rim so the planet's night side isn't a flat silhouette.
const rim = new THREE.DirectionalLight(0x7aa2ff, 0.25);
rim.position.set(1, 0.4, -1);
scene.add(rim);

/* ── Stars ───────────────────────────────────────────────── */
{
  const N = 2500;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 9000 + Math.random() * 6000;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xfff5e8, size: 1.6, sizeAttenuation: false,
    transparent: true, opacity: 0.55, depthWrite: false,
  })));
}

/* ── Spec-gloss material support ─────────────────────────── */
/*
  The model's materials use KHR_materials_pbrSpecularGlossiness, which
  three.js removed. Without this plugin GLTFLoader falls back to a default
  metal material with no texture — everything renders as black chrome,
  which is why the model never looked right. This maps the diffuse colour,
  texture and alpha onto a regular MeshStandardMaterial.
*/
class SpecularGlossinessPlugin {
  constructor(parser) {
    this.parser = parser;
    this.name   = 'KHR_materials_pbrSpecularGlossiness';
  }
  ext(index) {
    const def = this.parser.json.materials[index];
    return def.extensions && def.extensions[this.name];
  }
  getMaterialType(index) {
    return this.ext(index) ? THREE.MeshStandardMaterial : null;
  }
  extendMaterialParams(index, p) {
    const ext = this.ext(index);
    if (!ext) return Promise.resolve();

    const d = ext.diffuseFactor || [1, 1, 1, 1];
    p.color     = new THREE.Color().setRGB(d[0], d[1], d[2], THREE.LinearSRGBColorSpace);
    p.opacity   = d[3];
    p.metalness = 0;
    p.roughness = THREE.MathUtils.clamp(1 - (ext.glossinessFactor ?? 1), 0.35, 1);

    return ext.diffuseTexture
      ? this.parser.assignTexture(p, 'map', ext.diffuseTexture, THREE.SRGBColorSpace)
      : Promise.resolve();
  }
}

/* ── Load model ──────────────────────────────────────────── */
const loaderEl   = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');

const manager = new THREE.LoadingManager();
manager.onProgress = (_, loaded, total) => {
  loaderFill.style.width = `${Math.min(100, (loaded / total) * 100)}%`;
};

const spinners = [];          // disk layers that rotate
const dustMats = [];          // ring2 particle layer — faded out near the planet
let planet     = null;        // Planet node
const PLANET   = new THREE.Vector3(); // planet centre, world space
let modelReady = false;

const gltfLoader = new GLTFLoader(manager);
gltfLoader.register((parser) => new SpecularGlossinessPlugin(parser));

gltfLoader.load(
  'assets/scene.gltf',
  (gltf) => {
    const model = gltf.scene;

    // Sketchfab baked an arbitrary tilt into the root node. Replace it with
    // a plain Z-up → Y-up turn so the disk lies flat in world XZ.
    const root = model.getObjectByName('Sketchfab_model');
    root.matrixAutoUpdate = true;
    root.matrix.identity();
    root.position.set(0, 0, 0);
    root.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    root.scale.set(1, 1, 1);

    model.traverse((o) => {
      if (o.isMesh) tuneMaterial(o);
      if (o.name === 'black_hole' || o.name === 'black_hole_ring') spinners.push(o);
      if (o.isMesh && o.material.name === 'ring2' && !dustMats.includes(o.material)) dustMats.push(o.material);
    });

    planet = model.getObjectByName('Planet');
    smoothPlanet(planet);
    scene.add(model);
    model.updateMatrixWorld(true);
    planet.getWorldPosition(PLANET);
    buildKeyframes();

    modelReady = true;
    window.__ready = true;
    loaderEl.classList.add('hidden');
    startHeroEntrance();
  },
  undefined,
  (err) => {
    console.error('GLTF load error', err);
    loaderEl.querySelector('#loader-label').textContent = 'Load failed';
  }
);

/* The model's planet is only ~180 verts, so its silhouette is faceted.
   Swap it for a high-res sphere that reuses the same texture/material. */
function smoothPlanet(node) {
  const old = node.children[0];
  if (!old || !old.isMesh) return;
  old.geometry.computeBoundingSphere();
  const r = old.geometry.boundingSphere.radius;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 160, 120), old.material);
  sphere.position.copy(old.position);
  sphere.quaternion.copy(old.quaternion);
  sphere.scale.copy(old.scale);
  old.visible = false;
  old.parent.add(sphere);
  old.material.map && (old.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy());
}

/* Black-hole colour grade
   The source textures carry stray green / red fringes. Every disk and
   light-shell material is re-mapped through one gold ramp (sampled from the
   reference render), keyed on luminance, so no other hue can appear. */
const HOLE_RAMP = [
  [0.00, '#000000'], [0.05, '#1b1101'], [0.15, '#352404'], [0.25, '#563c11'],
  [0.35, '#765424'], [0.45, '#906e4a'], [0.55, '#ac8566'], [0.65, '#c2a089'],
  [0.75, '#d9b8ad'], [0.85, '#ead6cc'], [0.95, '#faf8f4'], [1.00, '#ffffff'],
];
const toVec3 = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(5)},${c.g.toFixed(5)},${c.b.toFixed(5)})`; };
const RAMP_GLSL = `
  const int RAMP_N = ${HOLE_RAMP.length};
  const float RAMP_T[RAMP_N] = float[RAMP_N](${HOLE_RAMP.map(([t]) => t.toFixed(2)).join(',')});
  const vec3  RAMP_C[RAMP_N] = vec3[RAMP_N](${HOLE_RAMP.map(([, c]) => toVec3(c)).join(',')});
  vec3 holeGrade(vec3 rgb) {
    float l  = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    float t  = pow(clamp(l, 0.0, 1.0), 1.0 / 2.2);
    vec3 col = RAMP_C[RAMP_N - 1];
    for (int i = 0; i < RAMP_N - 1; i++) {
      if (t <= RAMP_T[i + 1]) { col = mix(RAMP_C[i], RAMP_C[i + 1], (t - RAMP_T[i]) / (RAMP_T[i + 1] - RAMP_T[i])); break; }
    }
    return col * max(1.0, l);   // keep HDR energy above 1 so bloom still works
  }
`;
function gradeMaterial(m) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = RAMP_GLSL + shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      'outgoingLight = holeGrade(outgoingLight);\n#include <opaque_fragment>'
    );
  };
  m.customProgramCacheKey = () => 'holeGrade';
}

/* Per-material tweaks to get closer to the Sketchfab look */
function tuneMaterial(mesh) {
  const m = mesh.material;
  if (/^(black_hole_light[123]|ring2?)$/.test(m.name)) gradeMaterial(m);
  switch (m.name) {
    case 'black_hole_light1':
    case 'black_hole_light2':
    case 'black_hole_light3':
      // Lensed light shells — glow additively so the shadow reads through
      m.transparent = true;
      m.blending    = THREE.AdditiveBlending;
      m.depthWrite  = false;
      m.alphaTest   = 0;
      m.opacity     = 0.9;
      break;
    case 'black_hole_blackoutside':
    case 'black_hole_center':
      // The shadow — opaque black, hides everything behind it
      m.color.set(0x000000);
      m.emissive.set(0x000000);
      m.transparent = false;
      m.opacity     = 1;
      m.depthWrite  = true;
      break;
    case 'black_hole_distortion':
      // Sketchfab-only refraction effect; nothing to render here
      mesh.visible = false;
      break;
    case 'ring':
    case 'ring2':
      m.emissive.set(0xffffff);
      m.emissiveMap       = m.map;
      m.emissiveIntensity = m.name === 'ring' ? 0.5 : 0.6;
      m.blending          = THREE.AdditiveBlending;
      m.depthWrite        = false;
      m.side              = THREE.DoubleSide;
      break;
  }
  m.needsUpdate = true;
}

/* ── Post-processing ─────────────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.6, 0.6);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ── Camera keyframes ────────────────────────────────────── */
/*
  World units are the model's own (disk radius ≈ 1650, horizon ≈ 180,
  planet radius ≈ 7.5 sitting ~1400 out in the disk). Planet-relative
  shots are built after load, once the planet's position is known.
*/
const K = {
  hero:     { pos: new THREE.Vector3(-400, 450, 1800), look: new THREE.Vector3(-700, 0, 200), fov: 50 },
  heroOut:  { pos: new THREE.Vector3(-260, 360, 1450), look: new THREE.Vector3(-560, 0, 160), fov: 50 },
  approach: { pos: new THREE.Vector3(150, 90, 900),    look: new THREE.Vector3(0, 40, 0),     fov: 55, roll: 0.08 },
  core:     { pos: new THREE.Vector3(0, 10, 60),       look: new THREE.Vector3(0, 0, -200),   fov: 95, roll: 0.5 },
  planet: null, // filled in by buildKeyframes()
  drift:  null,
};

// Point relative to the planet: back = away from the hole, right/up = sideways
function nearPlanet(back, right, up) {
  const toHole = PLANET.clone().negate().normalize();
  const side   = new THREE.Vector3().crossVectors(toHole, new THREE.Vector3(0, 1, 0)).normalize();
  return PLANET.clone().addScaledVector(toHole, -back).addScaledVector(side, right).add(new THREE.Vector3(0, up, 0));
}

function buildKeyframes() {
  // Camera sits just behind the planet, looking past it at the lensed
  // horizon with the disk tilted across the frame — the "Planet" view.
  K.planet = { pos: nearPlanet(24, -14, 5), look: new THREE.Vector3(0, 120, -120), fov: 60, roll: -0.25 };
  K.drift  = { pos: nearPlanet(26, -16, 3), look: new THREE.Vector3(-150, 100, 0), fov: 55, roll: -0.12 };

  // Warm fill from behind the camera so the planet isn't a pure silhouette
  planetFill.position.copy(nearPlanet(60, -40, 30));
  planetFill.target.position.copy(PLANET);
}

/* ── Scroll timeline ─────────────────────────────────────── */
const heroOverlay = document.getElementById('hero-overlay');
const warpEl      = document.getElementById('warp');
const voidEl      = document.getElementById('void');
const scrimEl     = document.getElementById('scrim');
const planetPage  = document.getElementById('sec-planet');
const diveSpacer  = document.getElementById('dive-spacer');

// Distance from the top of the document (offsetTop is relative to the
// nearest positioned ancestor, which is <main> for the sections)
const docTop  = (el) => el.getBoundingClientRect().top + window.scrollY;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth  = (t) => t * t * (3 - 2 * t);
const easeIn  = (t) => t * t * t;

function lerpShot(a, b, t, out) {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.look.lerpVectors(a.look, b.look, t);
  out.fov = a.fov + (b.fov - a.fov) * t;
  out.roll = (a.roll || 0) + ((b.roll || 0) - (a.roll || 0)) * t;
}

const target  = { pos: K.hero.pos.clone(), look: K.hero.look.clone(), fov: K.hero.fov, roll: 0 };
const current = { pos: K.hero.pos.clone(), look: K.hero.look.clone(), fov: K.hero.fov, roll: 0 };
let snap = true; // jump straight to target (used at the warp cut)

let planetMix = 0; // 0 = black-hole stages, 1 = planet stages

function updateScroll() {
  const vh = window.innerHeight;
  const y  = window.scrollY;

  const heroEnd = docTop(diveSpacer);     // page 1 is the first 100vh
  const diveEnd = docTop(planetPage);     // the dive spans the spacer
  const docEnd  = document.documentElement.scrollHeight - vh;

  // Hero overlay fades as you start scrolling
  heroOverlay.style.opacity = String(clamp01(1 - (y / heroEnd) * 1.6));
  heroOverlay.style.pointerEvents = y > heroEnd * 0.5 ? 'none' : '';

  // Dim the scene behind the content sections for legibility
  scrimEl.style.opacity = String(clamp01((y - diveEnd) / (vh * 0.8)) * 0.74);

  if (!modelReady) return;

  if (y < heroEnd) {
    // Page 1 — gentle push-in on the hero shot
    lerpShot(K.hero, K.heroOut, smooth(y / heroEnd), target);
    voidEl.style.opacity = warpEl.style.opacity = '0';
    planetMix = 0;
  } else if (y < diveEnd - vh) {
    // Dive — swing down to the disk plane, then fall into the horizon
    const t = clamp01((y - heroEnd) / (diveEnd - vh - heroEnd));
    if (t < 0.5) lerpShot(K.heroOut,  K.approach, smooth(t / 0.5), target);
    else         lerpShot(K.approach, K.core,     easeIn((t - 0.5) / 0.5), target);
    // Swallowed by the dark, then a flash of light on the other side
    voidEl.style.opacity = String(smooth(clamp01((t - 0.7) / 0.18)));
    warpEl.style.opacity = String(easeIn(clamp01((t - 0.86) / 0.14)));
    planetMix = 0;
  } else {
    // Page 2+ — emerge beside the planet, then drift as content scrolls
    const tIn    = clamp01((y - (diveEnd - vh)) / vh);
    const tDrift = clamp01((y - diveEnd) / Math.max(1, docEnd - diveEnd));
    lerpShot(K.planet, K.drift, smooth(tDrift), target);
    if (planetMix === 0) snap = true; // hard cut while the screen is white
    voidEl.style.opacity = '0';
    warpEl.style.opacity = String(1 - smooth(tIn));
    planetMix = 1;
  }
  if (planetMix === 0 && current.pos.distanceTo(PLANET) < 200) snap = true; // scrolling back up

  for (const m of dustMats) m.opacity = 0.2 * (1 - planetMix * 0.9);
}

/* ── Render loop ─────────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.elapsedTime;

  if (snap) {
    current.pos.copy(target.pos); current.look.copy(target.look);
    current.fov = target.fov; current.roll = target.roll;
    snap = false;
  } else {
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent smoothing
    current.pos.lerp(target.pos, k);
    current.look.lerp(target.look, k);
    current.fov += (target.fov - current.fov) * k;
    current.roll += (target.roll - current.roll) * k;
  }

  // Subtle mouse parallax
  const px = (mouseX / window.innerWidth  - 0.5) || 0;
  const py = (mouseY / window.innerHeight - 0.5) || 0;
  const dist = current.pos.distanceTo(current.look);
  camera.position.copy(current.pos);
  camera.lookAt(current.look);
  camera.translateX(px * dist * 0.015);
  camera.translateY(-py * dist * 0.015);
  camera.rotateZ(current.roll);
  camera.fov = current.fov;
  camera.updateProjectionMatrix();

  // Disk rotation
  // The disk meshes are Z-up (thin axis = Z), so spin about local Z
  for (const s of spinners) s.rotation.z = t * 0.04;
  if (planet) planet.rotation.y = t * 0.05;

  composer.render();
}

/* Debug: ?cam=x,y,z&look=x,y,z&fov=n freezes the camera for framing */
if (params.has('cam')) {
  window.__shot = (cam, look, fov = 50, roll = 0) => {
    target.pos.copy(cam); target.look.copy(look); target.fov = fov; target.roll = roll; snap = true;
  };
  const freeze = () => {
    if (params.get('cam') === 'planet') {
      window.__shot(K.planet.pos, K.planet.look, K.planet.fov);
    } else if (params.get('cam') === 'drift') {
      window.__shot(K.drift.pos, K.drift.look, K.drift.fov);
    } else {
      window.__shot(vec(params.get('cam')), vec(params.get('look')), Number(params.get('fov') || 50), Number(params.get('roll') || 0));
    }
  };
  const wait = setInterval(() => { if (modelReady) { clearInterval(wait); freeze(); } }, 50);
  window.updateScrollDisabled = true;
}

animate();

/* ── Resize ──────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  updateScroll();
});

if (!params.has('cam')) {
  window.addEventListener('scroll', updateScroll, { passive: true });
  manager.onLoad = () => { updateScroll(); snap = true; };
  updateScroll();
}

/* ═══════════════════════════════════════════════════════════════
   ②  ANIMATION ENGINE
═══════════════════════════════════════════════════════════════ */

/* ─── Magnetic effect ────────────────────────────────────────── */
if (!reduceMotion) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.22}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ─── Text splitting ─────────────────────────────────────────── */
let charIndex = 0; // continues across hero name lines so the stagger flows
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch) => {
    const s = document.createElement('span');
    s.className = 'char';
    s.style.setProperty('--i', charIndex++);
    s.textContent = ch;
    el.appendChild(s);
  });
}

function splitWords(el) {
  let i = 0;
  el.innerHTML = el.innerHTML.replace(/([^\s<>]+)(?![^<]*>)/g, (w) =>
    `<span class="word" style="--i:${i++}">${w}</span>`
  );
}

function splitLines(el) {
  el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((p) =>
    `<span class="line-wrap"><span class="line-inner">${p}</span></span>`
  ).join('');
}

document.querySelectorAll('#hero-name .name-line').forEach(splitChars);
document.querySelectorAll('[data-split-words]').forEach(splitWords);
document.querySelectorAll('[data-split-lines]').forEach(splitLines);

/* ─── Hero entrance sequence ─────────────────────────────────── */
function startHeroEntrance() {
  heroOverlay.classList.add('ready', 'hero-ready');
  document.getElementById('site-nav')?.classList.add('ready');
  setTimeout(() => document.getElementById('hero-name')?.classList.add('hero-in'), 350);
  setTimeout(() => document.querySelector('.hero-eyebrow')?.classList.add('hero-in'), 550);
  setTimeout(() => document.querySelector('.hero-lede')?.classList.add('hero-in'), 750);
}

/* ─── Scroll reveals ─────────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('[data-reveal], .section-heading, .planet-copy').forEach((el) => io.observe(el));

/* ─── Section headings drift slightly against the scroll ─────── */
const parallaxHeads = [...document.querySelectorAll('.section-heading')];
function parallax() {
  if (reduceMotion) return;
  const vh = window.innerHeight;
  for (const h of parallaxHeads) {
    const r = h.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) continue;
    h.style.transform = 'translateY(' + (((r.top - vh / 2) / vh) * 28).toFixed(1) + 'px)';
  }
}
window.addEventListener('scroll', parallax, { passive: true });
parallax();

/* ─── Spotlight follows the cursor inside panels and projects ── */
document.querySelectorAll('[data-spot]').forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
});

/* ─── Nav: highlight the section currently in view ───────────── */
const navLinks = [...document.querySelectorAll('.nav-link')];
const navMap = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.remove('active'));
    navMap.get(e.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -45% 0px' });
navMap.forEach((_, id) => { const sec = document.getElementById(id); if (sec) spy.observe(sec); });

/* ─── Anchor links: smooth scroll to the section ─────────────── */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? null : document.querySelector(id);
    if (id !== '#top' && !el) return;
    e.preventDefault();
    const dest = el ? docTop(el) : 0;
    if (lenis) lenis.scrollTo(dest, { duration: 1.8 });
    else window.scrollTo({ top: dest, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});
