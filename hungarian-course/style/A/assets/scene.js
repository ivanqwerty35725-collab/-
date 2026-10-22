// Procedural Transcarpathian house at golden hour. Deterministic: every frame = f(t).
import * as THREE from "./lib/three.module.min.js";
import { EffectComposer } from "./lib/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./lib/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./lib/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "./lib/jsm/postprocessing/ShaderPass.js";

const W = 1280, H = 720;
const canvas = document.getElementById("gl");

// ---------- seeded helpers ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1337);
const R = (a, b) => a + (b - a) * rnd();
function hash2(x, y) {
  let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const col = (h) => new THREE.Color(h);

// ---------- canvas textures ----------
function canvasTex(w, h, draw, srgb = true, rep = [1, 1]) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  return t;
}
function noiseFill(g, w, h, base, amp, scale, seed = 0, oct = 5) {
  const img = g.createImageData(w, h);
  const [r0, g0, b0] = base;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // tileable by sampling on torus-ish (cheap: wrap coordinates)
    const n = fbm((x / w) * scale + seed, (y / h) * scale + seed * 1.7, oct) - 0.5;
    const n2 = hash2(x + seed * 13, y) - 0.5;
    const k = n * amp + n2 * amp * 0.25;
    const i = (y * w + x) * 4;
    img.data[i] = r0 + k * 255; img.data[i + 1] = g0 + k * 245; img.data[i + 2] = b0 + k * 230; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
const texPlaster = canvasTex(512, 512, (g, w, h) => {
  noiseFill(g, w, h, [238, 233, 222], 0.16, 9, 3);
  // faint streaks / patches of older whitewash
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(${150 + rnd() * 40},${140 + rnd() * 30},${120 + rnd() * 30},${0.03 + rnd() * 0.05})`;
    g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 60, 6 + rnd() * 40, rnd() * 3, 0, 7); g.fill();
  }
}, true, [0.35, 0.35]);
const texPlasterBump = canvasTex(512, 512, (g, w, h) => noiseFill(g, w, h, [128, 128, 128], 0.9, 40, 7, 4), false, [0.35, 0.35]);

function planks(g, w, h, n, base, vary, gap = "rgba(20,12,6,0.85)", vertical = true) {
  const pw = (vertical ? w : h) / n;
  for (let i = 0; i < n; i++) {
    const t = rnd();
    const c = base.map((v, k) => Math.max(0, Math.min(255, v + (t - 0.5) * vary + (k === 2 ? -5 : 0))));
    g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    if (vertical) g.fillRect(i * pw, 0, pw, h); else g.fillRect(0, i * pw, w, pw);
    // grain lines
    for (let j = 0; j < 26; j++) {
      g.strokeStyle = `rgba(30,18,8,${0.05 + rnd() * 0.12})`;
      g.lineWidth = 0.6 + rnd() * 1.4;
      g.beginPath();
      const o = i * pw + rnd() * pw;
      if (vertical) { g.moveTo(o, 0); g.bezierCurveTo(o + R(-4, 4), h * 0.3, o + R(-4, 4), h * 0.7, o + R(-3, 3), h); }
      else { g.moveTo(0, o); g.bezierCurveTo(w * 0.3, o + R(-4, 4), w * 0.7, o + R(-4, 4), w, o + R(-3, 3)); }
      g.stroke();
    }
    // knots
    if (rnd() < 0.5) {
      const kx = vertical ? i * pw + pw * R(0.3, 0.7) : R(0, w), ky = vertical ? R(0, h) : i * pw + pw * R(0.3, 0.7);
      g.fillStyle = "rgba(40,22,10,0.45)"; g.beginPath(); g.ellipse(kx, ky, 3 + rnd() * 4, 6 + rnd() * 6, vertical ? 0 : 1.57, 0, 7); g.fill();
    }
    g.fillStyle = gap;
    if (vertical) g.fillRect(i * pw, 0, 2, h); else g.fillRect(0, i * pw, w, 2);
  }
}
const texWoodDark = canvasTex(512, 512, (g, w, h) => planks(g, w, h, 6, [96, 64, 40], 40), true, [1, 1]);
const texFloor = canvasTex(512, 512, (g, w, h) => planks(g, w, h, 8, [138, 92, 56], 36, "rgba(30,16,6,0.9)", false), true, [0.6, 0.6]);
const texCeil = canvasTex(512, 512, (g, w, h) => planks(g, w, h, 8, [120, 84, 54], 30, "rgba(30,16,6,0.9)", true), true, [0.5, 0.5]);
const texFence = canvasTex(256, 512, (g, w, h) => planks(g, w, h, 1, [128, 104, 80], 30, "rgba(0,0,0,0)"), true, [1, 1]);

// interior plaster with baked corner darkening (v=0 floor, v=1 ceiling)
const texInterior = canvasTex(512, 512, (g, w, h) => {
  noiseFill(g, w, h, [236, 214, 182], 0.12, 7, 11);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "rgba(60,30,10,0.45)");
  gr.addColorStop(0.12, "rgba(60,30,10,0.0)");
  gr.addColorStop(0.82, "rgba(60,30,10,0.0)");
  gr.addColorStop(1, "rgba(60,30,10,0.5)");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // painted folk band near the top (traditional stencil frieze)
  for (let x = 0; x < w; x += 32) {
    g.fillStyle = "rgba(150,52,40,0.55)";
    g.beginPath(); g.moveTo(x + 16, h * 0.13); g.lineTo(x + 24, h * 0.155); g.lineTo(x + 16, h * 0.18); g.lineTo(x + 8, h * 0.155); g.fill();
    g.fillStyle = "rgba(60,90,80,0.5)";
    g.beginPath(); g.arc(x, h * 0.155, 3, 0, 7); g.fill();
  }
  g.fillStyle = "rgba(150,52,40,0.4)"; g.fillRect(0, h * 0.12, w, 2); g.fillRect(0, h * 0.19, w, 2);
}, true, [1, 1]);

const texCloth = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#efe8da"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(120,100,80,${rnd() * 0.04})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  // embroidered border (cross-stitch rhombuses), red + black
  const band = (y0) => {
    for (let x = 0; x < w; x += 24) {
      g.fillStyle = "#a3271f";
      g.beginPath(); g.moveTo(x + 12, y0); g.lineTo(x + 22, y0 + 10); g.lineTo(x + 12, y0 + 20); g.lineTo(x + 2, y0 + 10); g.fill();
      g.fillStyle = "#efe8da"; g.fillRect(x + 10, y0 + 8, 4, 4);
      g.fillStyle = "#2a1b16"; g.fillRect(x, y0 + 9, 3, 3);
    }
    g.fillStyle = "#a3271f"; g.fillRect(0, y0 - 6, w, 3); g.fillRect(0, y0 + 24, w, 3);
  };
  band(30); band(h - 56);
  g.save(); g.translate(w, 0); g.rotate(Math.PI / 2);
  for (let x = 0; x < h; x += 24) { g.fillStyle = "#a3271f"; g.beginPath(); g.moveTo(x + 12, 30); g.lineTo(x + 22, 40); g.lineTo(x + 12, 50); g.lineTo(x + 2, 40); g.fill(); }
  g.restore();
  for (let x = 0; x < h; x += 24) { g.fillStyle = "#a3271f"; g.beginPath(); g.moveTo(30, x + 12); g.lineTo(40, x + 22); g.lineTo(50, x + 12); g.lineTo(40, x + 2); g.fill(); }
}, true, [1, 1]);

const texRug = canvasTex(512, 256, (g, w, h) => {
  const rows = ["#7d2a22", "#2c2420", "#b5532f", "#e0c9a0", "#2f4a46"];
  for (let y = 0; y < h; y += 8) { g.fillStyle = rows[Math.floor(y / 8 + Math.floor(y / 40)) % rows.length]; g.fillRect(0, y, w, 8); }
  for (let x = 40; x < w - 40; x += 48) {
    g.fillStyle = "#e9d7b0";
    g.beginPath(); g.moveTo(x, h / 2 - 50); g.lineTo(x + 24, h / 2); g.lineTo(x, h / 2 + 50); g.lineTo(x - 24, h / 2); g.fill();
    g.fillStyle = "#7d2a22"; g.beginPath(); g.moveTo(x, h / 2 - 22); g.lineTo(x + 11, h / 2); g.lineTo(x, h / 2 + 22); g.lineTo(x - 11, h / 2); g.fill();
  }
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 2, 1); }
}, true, [1, 1]);

const texStoveTile = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#5d7a63"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const gr = g.createRadialGradient(x * 64 + 32, y * 64 + 28, 4, x * 64 + 32, y * 64 + 32, 40);
    gr.addColorStop(0, "#9bb59a"); gr.addColorStop(1, "#4b6652");
    g.fillStyle = gr; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    g.strokeStyle = "rgba(240,230,200,0.5)"; g.lineWidth = 2;
    g.beginPath(); g.arc(x * 64 + 32, y * 64 + 32, 14, 0, 7); g.stroke();
  }
  g.fillStyle = "#d8cdb2"; for (let i = 0; i <= 4; i++) { g.fillRect(i * 64 - 1, 0, 3, h); g.fillRect(0, i * 64 - 1, w, 3); }
}, true, [1, 1]);

const texGround = canvasTex(512, 512, (g, w, h) => {
  noiseFill(g, w, h, [124, 132, 66], 0.35, 12, 21);
  for (let i = 0; i < 9000; i++) {
    const t = rnd();
    g.fillStyle = t < 0.5 ? `rgba(60,80,30,${0.3})` : `rgba(170,160,90,${0.25})`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 2 + rnd() * 4);
  }
}, true, [1, 1]);

// warm "lit interior seen through a curtain" for window glass
const texWindowGlow = canvasTex(128, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#ffcf8a"); gr.addColorStop(0.6, "#ffb260"); gr.addColorStop(1, "#e3863c");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 6) { g.fillStyle = `rgba(120,50,10,${0.08 + 0.1 * Math.abs(Math.sin(x * 0.3))})`; g.fillRect(x, 0, 3, h); }
  const rg = g.createRadialGradient(w * 0.6, h * 0.35, 4, w * 0.6, h * 0.35, w * 0.6);
  rg.addColorStop(0, "rgba(255,240,200,0.8)"); rg.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
}, true, [1, 1]);

const texSoft = canvasTex(128, 128, (g, w, h) => {
  const rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.4, "rgba(255,255,255,0.45)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
}, false);
const texContact = canvasTex(256, 256, (g, w, h) => {
  const rg = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w / 2);
  rg.addColorStop(0, "rgba(0,0,0,0.75)"); rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
}, false);

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;

const scene = new THREE.Scene();
const FOG = col("#dcb59c");
scene.fog = new THREE.FogExp2(FOG, 0.0016);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 12000);

const SUN = new THREE.Vector3(-0.62, 0.17, 0.77).normalize();

// sky dome
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    uSun: { value: SUN },
    uZenith: { value: col("#2a4f98") }, uUpper: { value: col("#7f8cc8") },
    uBelt: { value: col("#ffab88") }, uSunHz: { value: col("#ffb35e") }, uGlow: { value: col("#ffd6a0") },
  },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
  fragmentShader: `uniform vec3 uSun,uZenith,uUpper,uBelt,uSunHz,uGlow; varying vec3 vD;
  float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hh(i),hh(i+vec2(1,0)),u.x), mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<6;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; }
  void main(){ vec3 d = normalize(vD); float y = max(d.y,0.0);
    vec2 a = normalize(d.xz+1e-5), s = normalize(uSun.xz);
    float sideSun = pow(max(dot(a,s)*0.5+0.5,0.0),3.0);
    vec3 hz = mix(uBelt, uSunHz, sideSun);
    vec3 c = mix(hz, uUpper, smoothstep(0.0,0.2,y));
    c = mix(c, uZenith, smoothstep(0.15,0.7,y));
    float mu = max(dot(d,uSun),0.0);
    c += uGlow*(pow(mu,6.0)*0.55 + pow(mu,60.0)*0.8);
    c += vec3(1.0,0.85,0.6)*smoothstep(0.9993,0.9997,mu)*8.0;
    // soft altostratus streaks lit by the low sun
    if (d.y > 0.01) {
      vec2 p = d.xz / (d.y + 0.08) * 1.3;
      p.x *= 0.45;
      float n = fbm(p + vec2(3.0, 1.0));
      float m = smoothstep(0.47, 0.66, n) * smoothstep(0.02, 0.12, d.y) * (1.0 - smoothstep(0.55, 0.9, d.y));
      vec3 cc = mix(vec3(1.0,0.6,0.5), vec3(1.0,0.78,0.5), sideSun) * (0.75 + 0.5*n);
      vec3 under = mix(vec3(0.55,0.5,0.62), cc, smoothstep(0.5,0.8,n));
      c = mix(c, under*1.15, m*0.85);
    }
    gl_FragColor = vec4(c*1.25,1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), skyMat);
sky.renderOrder = -10;
scene.add(sky);

// lights
const hemi = new THREE.HemisphereLight(col("#b9c6e2"), col("#8a7448"), 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(col("#ffb873"), 4.2);
sun.position.copy(SUN).multiplyScalar(60);
sun.target.position.set(0, 0, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 140 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.035;
sun.shadow.radius = 3;
scene.add(sun, sun.target);

// ---------- materials ----------
const M = {
  plaster: new THREE.MeshStandardMaterial({ color: col("#f2ede3"), map: texPlaster, bumpMap: texPlasterBump, bumpScale: 0.6, roughness: 0.93 }),
  plinth: new THREE.MeshStandardMaterial({ color: col("#9c968c"), map: texPlaster, bumpMap: texPlasterBump, bumpScale: 1.2, roughness: 0.97 }),
  wood: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texWoodDark, roughness: 0.8 }),
  woodRaw: new THREE.MeshStandardMaterial({ color: col("#7a5638"), map: texWoodDark, roughness: 0.85 }),
  trim: new THREE.MeshStandardMaterial({ color: col("#5e3f28"), roughness: 0.7 }),
  sash: new THREE.MeshStandardMaterial({ color: col("#ede6d6"), roughness: 0.55 }),
  shutter: new THREE.MeshStandardMaterial({ color: col("#7e9a8f"), map: texWoodDark, roughness: 0.75 }),
  roofBase: new THREE.MeshStandardMaterial({ color: col("#3a241a"), roughness: 0.9 }),
  tile: new THREE.MeshStandardMaterial({ color: col("#ffffff"), roughness: 0.72 }),
  glassOut: new THREE.MeshStandardMaterial({ color: col("#2a1a10"), emissive: col("#ffffff"), emissiveMap: texWindowGlow, emissiveIntensity: 1.35, roughness: 0.15 }),
  glassIn: new THREE.MeshStandardMaterial({ color: col("#1a2030"), emissive: col("#6f80a8"), emissiveIntensity: 0.9, roughness: 0.1 }),
  interior: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texInterior, roughness: 0.95, side: THREE.DoubleSide }),
  floor: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texFloor, roughness: 0.62 }),
  ceil: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texCeil, roughness: 0.9, side: THREE.DoubleSide }),
  beam: new THREE.MeshStandardMaterial({ color: col("#6a4630"), map: texWoodDark, roughness: 0.85 }),
  cloth: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texCloth, roughness: 0.9, side: THREE.DoubleSide }),
  rug: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texRug, roughness: 1 }),
  stove: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texStoveTile, roughness: 0.35 }),
  ceramic: new THREE.MeshStandardMaterial({ color: col("#c9b48e"), roughness: 0.4 }),
  ceramicBlue: new THREE.MeshStandardMaterial({ color: col("#e9e3d4"), roughness: 0.3 }),
  stone: new THREE.MeshStandardMaterial({ color: col("#aaa49a"), map: texPlaster, bumpMap: texPlasterBump, bumpScale: 1.5, roughness: 0.95 }),
  fence: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texFence, roughness: 0.9 }),
  bark: new THREE.MeshStandardMaterial({ color: col("#4a3a2c"), map: texPlasterBump, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: col("#ffffff"), roughness: 0.75, side: THREE.DoubleSide }),
  grass: new THREE.MeshStandardMaterial({ color: col("#ffffff"), roughness: 0.9, side: THREE.DoubleSide, vertexColors: true }),
  ground: new THREE.MeshStandardMaterial({ color: col("#ffffff"), map: texGround, vertexColors: true, roughness: 1 }),
  hay: new THREE.MeshStandardMaterial({ color: col("#a88a4c"), map: texPlasterBump, roughness: 1 }),
  geranium: new THREE.MeshStandardMaterial({ color: col("#c7202a"), roughness: 0.6, emissive: col("#3a0505"), emissiveIntensity: 0.3 }),
  geraLeaf: new THREE.MeshStandardMaterial({ color: col("#3f6b2c"), roughness: 0.8 }),
  bread: new THREE.MeshStandardMaterial({ color: col("#b5793c"), roughness: 0.8 }),
  apple: new THREE.MeshStandardMaterial({ color: col("#a8241c"), roughness: 0.45 }),
  lampShade: new THREE.MeshStandardMaterial({ color: col("#e9c99a"), emissive: col("#ffb46a"), emissiveIntensity: 0.55, roughness: 0.8, side: THREE.DoubleSide }),
  bulb: new THREE.MeshBasicMaterial({ color: col("#fff1d0") }),
  iron: new THREE.MeshStandardMaterial({ color: col("#2a2622"), roughness: 0.6, metalness: 0.4 }),
};
M.bulb.color.multiplyScalar(2.2);

function box(w, h, d, mat, x, y, z, parent = scene, cast = true, recv = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv;
  parent.add(m); return m;
}

// ---------- house dimensions ----------
const HW = 5, HD = 3, WH = 3.0, T = 0.38, FL = 0.42, CEIL = 2.92;
const RIDGE = WH + 2.45, PITCH = 2.45 / HD; // rise / run
const house = new THREE.Group();
scene.add(house);

function wallShape(x0, x1, y0, y1, holes) {
  const s = new THREE.Shape();
  const notches = holes.filter(([cx, cy, w, h]) => cy - h / 2 <= y0 + 0.002).sort((a, b) => a[0] - b[0]);
  s.moveTo(x0, y0);
  for (const [cx, cy, w, h] of notches) { s.lineTo(cx - w / 2, y0); s.lineTo(cx - w / 2, cy + h / 2); s.lineTo(cx + w / 2, cy + h / 2); s.lineTo(cx + w / 2, y0); }
  s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.lineTo(x0, y0);
  for (const [cx, cy, w, h] of holes.filter((h) => !notches.includes(h))) {
    const p = new THREE.Path();
    p.moveTo(cx - w / 2, cy - h / 2); p.lineTo(cx - w / 2, cy + h / 2); p.lineTo(cx + w / 2, cy + h / 2); p.lineTo(cx + w / 2, cy - h / 2); p.lineTo(cx - w / 2, cy - h / 2);
    s.holes.push(p);
  }
  return s;
}
const WIN = { w: 0.98, h: 1.22, cy: 1.85 };
const DOOR = { w: 1.08, h: 2.12, cx: 0 };
const frontHoles = [[-2.75, WIN.cy, WIN.w, WIN.h], [2.75, WIN.cy, WIN.w, WIN.h], [DOOR.cx, FL + DOOR.h / 2, DOOR.w, DOOR.h]];
const backHoles = [[1.9, WIN.cy, WIN.w, WIN.h]];
const sideHoles = [[0.2, WIN.cy, WIN.w, WIN.h]];

function addWall(shape, place) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
  const m = new THREE.Mesh(g, M.plaster);
  m.castShadow = m.receiveShadow = true;
  place(m); house.add(m); return m;
}
// front (outer face z=HD), back, left, right
addWall(wallShape(-HW, HW, 0, WH, frontHoles), (m) => m.position.set(0, 0, HD - T));
addWall(wallShape(-HW, HW, 0, WH, backHoles.map(([x, y, w, h]) => [-x, y, w, h])), (m) => { m.rotation.y = Math.PI; m.position.set(0, 0, -HD + T); });
addWall(wallShape(-HD + T, HD - T, 0, WH, sideHoles), (m) => { m.rotation.y = -Math.PI / 2; m.position.set(-HW + T, 0, 0); });
addWall(wallShape(-HD + T, HD - T, 0, WH, sideHoles.map(([x, y, w, h]) => [-x, y, w, h])), (m) => { m.rotation.y = Math.PI / 2; m.position.set(HW - T, 0, 0); });

// plinth band (stone socle) slightly proud of the wall
{
  const pz = HD + 0.04, ph = FL + 0.05;
  const segs = [[-HW - 0.04, -DOOR.w / 2], [DOOR.w / 2, HW + 0.04]];
  for (const [a, b] of segs) box(b - a, ph, 0.08, M.plinth, (a + b) / 2, ph / 2, pz - 0.02, house);
  box(HW * 2 + 0.08, ph, 0.08, M.plinth, 0, ph / 2, -HD - 0.02, house);
  box(0.08, ph, HD * 2 + 0.08, M.plinth, -HW - 0.02, ph / 2, 0, house);
  box(0.08, ph, HD * 2 + 0.08, M.plinth, HW + 0.02, ph / 2, 0, house);
}

// interior linings (warm plaster with baked AO), floor, ceiling
function lining(x0, x1, holes, place) {
  const s = wallShape(x0, x1, FL, CEIL, holes);
  const g = new THREE.ShapeGeometry(s);
  const uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 3.2, (p.getY(i) - FL) / (CEIL - FL));
  const m = new THREE.Mesh(g, M.interior);
  m.receiveShadow = true; place(m); house.add(m);
}
const IN = 0.004;
lining(-HW + T, HW - T, frontHoles, (m) => m.position.set(0, 0, HD - T - IN));
lining(-HW + T, HW - T, backHoles.map(([x, y, w, h]) => [-x, y, w, h]), (m) => { m.rotation.y = Math.PI; m.position.set(0, 0, -HD + T + IN); });
lining(-HD + T, HD - T, sideHoles, (m) => { m.rotation.y = -Math.PI / 2; m.position.set(-HW + T + IN, 0, 0); });
lining(-HD + T, HD - T, sideHoles.map(([x, y, w, h]) => [-x, y, w, h]), (m) => { m.rotation.y = Math.PI / 2; m.position.set(HW - T - IN, 0, 0); });
{
  const f = new THREE.Mesh(new THREE.PlaneGeometry((HW - T) * 2, (HD - T) * 2), M.floor);
  f.rotation.x = -Math.PI / 2; f.position.y = FL; f.receiveShadow = true; house.add(f);
  const uv = f.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4.4, uv.getY(i) * 2.6);
  const c = new THREE.Mesh(new THREE.PlaneGeometry((HW - T) * 2, (HD - T) * 2), M.ceil);
  c.rotation.x = Math.PI / 2; c.position.y = CEIL; house.add(c);
  const cuv = c.geometry.attributes.uv; for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cuv.getX(i) * 4.4, cuv.getY(i) * 2.6);
  // ceiling plate under the attic (blocks light leaks, casts shadow)
  box(HW * 2, 0.1, HD * 2, M.roofBase, 0, WH - 0.02, 0, house, true, false);
  for (let x = -HW + T + 0.5; x < HW - T; x += 1.15) box(0.16, 0.18, (HD - T) * 2, M.beam, x, CEIL - 0.09, 0, house, false, true);
  box(0.24, 0.24, (HD - T) * 2, M.beam, 0.0, CEIL - 0.12, 0, house, false, true);
  // base under floor
  box(HW * 2 - 0.1, FL, HD * 2 - 0.1, M.plinth, 0, FL / 2 - 0.001, 0, house, false, false);
}

// ---------- roof ----------
const SL = Math.hypot(HD + 0.7, (HD + 0.7) * PITCH); // slope length to eave
const ANG = Math.atan(PITCH);
const OVX = 0.65; // gable overhang
const roofW = (HW + OVX) * 2;
const PCUT = 1.45 + 0.3; // porch half-width + margin: front eave is cut there
for (const side of [1, -1]) {
  const segs = side > 0 ? [[-HW - OVX, -PCUT, SL], [PCUT, HW + OVX, SL], [-PCUT, PCUT, HD / Math.cos(ANG)]] : [[-HW - OVX, HW + OVX, SL]];
  for (const [xa, xb, len] of segs) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(xb - xa, 0.12, len), M.roofBase);
    const mid = len / 2;
    m.position.set((xa + xb) / 2, RIDGE - Math.sin(ANG) * mid - 0.06, side * Math.cos(ANG) * mid);
    m.rotation.x = side * ANG;
    m.castShadow = m.receiveShadow = true;
    house.add(m);
  }
  // fascia
  const ez = side * (HD + 0.7), ey = RIDGE - (HD + 0.7) * PITCH;
  if (side > 0) {
    const wl = HW + OVX - PCUT;
    box(wl, 0.22, 0.05, M.trim, -(PCUT + wl / 2), ey - 0.12, ez + 0.02, house);
    box(wl, 0.22, 0.05, M.trim, PCUT + wl / 2, ey - 0.12, ez + 0.02, house);
  } else box(roofW, 0.22, 0.05, M.trim, 0, ey - 0.12, ez + side * 0.02, house);
  // rafter tails
  for (let x = -HW - OVX + 0.3; x < HW + OVX; x += 0.6) {
    if (side > 0 && Math.abs(x) < PCUT) continue;
    const r = box(0.08, 0.12, 0.7, M.trim, x, ey + 0.2, side * (HD + 0.35), house, false, true);
    r.rotation.x = side * ANG;
  }
}
// gable timber triangles (vertical planks) + bargeboards
for (const sx of [-1, 1]) {
  const s = new THREE.Shape();
  s.moveTo(-HD - 0.05, WH); s.lineTo(HD + 0.05, WH); s.lineTo(0, RIDGE - 0.08); s.lineTo(-HD - 0.05, WH);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.8, uv.getY(i) / 2.5);
  const m = new THREE.Mesh(g, M.woodRaw);
  m.rotation.y = -Math.PI / 2 * sx;
  m.position.set(sx * (HW + 0.02) + (sx > 0 ? -0.06 : 0.06) * 0 , 0, 0);
  if (sx > 0) m.position.x = HW + 0.06; else m.position.x = -HW - 0.06;
  m.castShadow = m.receiveShadow = true;
  house.add(m);
  // little attic vent (dark opening with louver look)
  box(0.04, 0.5, 0.36, M.roofBase, sx * (HW + 0.09), WH + 1.2, 0, house, false);
  for (const side of [1, -1]) {
    const len = Math.hypot(HD + 0.75, (HD + 0.75) * PITCH);
    const b = box(0.06, 0.26, len, M.trim, sx * (HW + OVX - 0.02), RIDGE - (HD + 0.75) * PITCH / 2 + 0.02, side * (HD + 0.75) / 2, house);
    b.rotation.x = side * ANG;
  }
}

// beaver-tail tiles (instanced) ------------------------------------------------
function tileGeometry(w, L, th) {
  const s = new THREE.Shape();
  const r = w / 2;
  s.moveTo(-r, L); s.lineTo(-r, r * 0.9);
  s.absarc(0, r * 0.9, r, Math.PI, 0, false);
  s.lineTo(r, L); s.lineTo(-r, L);
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 7 });
  g.computeVertexNormals();
  return g;
}
const TILE_W = 0.205, TILE_L = 0.42, EXPOSE = 0.165;
const tileGeo = tileGeometry(TILE_W, TILE_L, 0.016);
function tileColor(c, x, row) {
  const n = fbm(x * 0.7, row * 0.35, 3);
  const pick = rnd();
  c.set("#b25a37");
  c.offsetHSL(R(-0.015, 0.02), R(-0.12, 0.08), R(-0.09, 0.06) + (n - 0.5) * 0.12);
  if (pick < 0.08) c.lerp(col("#5b4a3a"), 0.45); // weathered dark
  else if (pick < 0.13) c.lerp(col("#7d7a55"), 0.35); // lichen
  else if (pick < 0.2) c.lerp(col("#d0794b"), 0.35); // newer, orange
}
function layTiles(spans, basis, origin, slopeLen, widthRange) {
  // spans: number of tiles per row determined by widthRange
  const [x0, x1] = widthRange;
  const rows = Math.ceil(slopeLen / EXPOSE) + 1;
  const per = Math.ceil((x1 - x0) / TILE_W) + 1;
  const count = rows * per;
  const im = new THREE.InstancedMesh(tileGeo, M.tile, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const B = new THREE.Matrix4().makeBasis(basis.X, basis.Y, basis.Z);
  const c = new THREE.Color();
  let k = 0;
  for (let r = 0; r < rows; r++) {
    const sBottom = slopeLen - r * EXPOSE; // distance from ridge to tile bottom end
    if (sBottom < -0.05) continue;
    const off = (r % 2) * TILE_W * 0.5;
    for (let i = 0; i < per; i++) {
      const x = x0 + off + i * TILE_W - TILE_W * 0.25;
      if (x > x1 + 0.02) continue;
      // local position on slope: u along X, v uphill along Y, w normal Z
      const u = x + R(-0.006, 0.006);
      const v = -sBottom + R(-0.008, 0.008);
      p.copy(origin).addScaledVector(basis.X, u).addScaledVector(basis.Y, v + slopeLen * 0).addScaledVector(basis.Z, 0.012 + R(0, 0.006));
      e.set(-0.05 + R(-0.02, 0.02), R(-0.015, 0.015), R(-0.03, 0.03));
      q.setFromEuler(e);
      m4.compose(new THREE.Vector3(), q, s);
      m4.premultiply(B);
      m4.setPosition(p);
      if (basis.skip && basis.skip(p)) continue;
      im.setMatrixAt(k, m4);
      tileColor(c, x, r); im.setColorAt(k, c);
      k++;
    }
  }
  im.count = k;
  im.castShadow = true; im.receiveShadow = true;
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  house.add(im);
  return im;
}
{
  const sA = Math.sin(ANG), cA = Math.cos(ANG);
  // front slope: origin = ridge line point, Y uphill => tiles placed at v = -sBottom from ridge
  const ridgeO = new THREE.Vector3(0, RIDGE, 0);
  layTiles(0, { X: new THREE.Vector3(1, 0, 0), Y: new THREE.Vector3(0, sA, -cA), Z: new THREE.Vector3(0, cA, sA), skip: (p) => Math.abs(p.x) < PCUT - 0.1 && p.z > HD + 0.05 }, ridgeO, SL, [-HW - OVX, HW + OVX]);
  layTiles(0, { X: new THREE.Vector3(-1, 0, 0), Y: new THREE.Vector3(0, sA, cA), Z: new THREE.Vector3(0, cA, -sA) }, ridgeO, SL, [-HW - OVX, HW + OVX]);
  // ridge caps
  const capG = new THREE.CylinderGeometry(0.13, 0.15, 0.42, 10, 1, true, 0, Math.PI);
  const caps = new THREE.InstancedMesh(capG, M.tile, 40);
  const m4 = new THREE.Matrix4(), cc = new THREE.Color();
  let n = 0;
  for (let x = -HW - OVX + 0.2; x <= HW + OVX - 0.1; x += 0.38) {
    m4.makeRotationZ(Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2 + 0));
    const rz = new THREE.Matrix4().makeRotationZ(-Math.PI / 2);
    const rx = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    m4.copy(rz).multiply(rx);
    m4.setPosition(x, RIDGE + 0.06, 0);
    caps.setMatrixAt(n, m4); tileColor(cc, x, 3); cc.multiplyScalar(0.85); caps.setColorAt(n, cc); n++;
  }
  caps.count = n; caps.castShadow = true; caps.receiveShadow = true;
  house.add(caps);
}

// chimney
{
  const cx = 2.3, cz = -0.9;
  const ch = box(0.62, 2.4, 0.62, M.plaster, cx, RIDGE - 0.3, cz, house);
  box(0.8, 0.08, 0.8, M.plinth, cx, RIDGE + 0.94, cz, house);
  box(0.5, 0.16, 0.5, M.roofBase, cx, RIDGE + 1.02, cz, house);
  box(0.7, 0.05, 0.7, M.trim, cx, RIDGE + 0.6, cz, house);
}

// ---------- porch ----------
const PZ0 = HD, PZ1 = HD + 2.1, PX = 1.45, PE = 2.62, PR = 3.62;
{
  // deck
  box(PX * 2 + 0.2, 0.1, PZ1 - PZ0 + 0.05, M.floor, 0, FL - 0.05, (PZ0 + PZ1) / 2, house);
  box(PX * 2 + 0.2, FL - 0.1, 0.1, M.plinth, 0, (FL - 0.1) / 2, PZ1 - 0.02, house);
  box(0.1, FL - 0.1, PZ1 - PZ0, M.plinth, -PX - 0.05, (FL - 0.1) / 2, (PZ0 + PZ1) / 2, house);
  box(0.1, FL - 0.1, PZ1 - PZ0, M.plinth, PX + 0.05, (FL - 0.1) / 2, (PZ0 + PZ1) / 2, house);
  // steps (stone)
  box(1.5, 0.14, 0.36, M.stone, 0, 0.07, PZ1 + 0.3, house);
  box(1.5, 0.28, 0.3, M.stone, 0, 0.14, PZ1 + 0.08, house);
  // posts with brackets
  for (const sx of [-1, 1]) {
    for (const z of [PZ1 - 0.12]) {
      box(0.15, PE - FL, 0.15, M.wood, sx * (PX - 0.1), FL + (PE - FL) / 2, z, house);
      box(0.24, 0.1, 0.24, M.wood, sx * (PX - 0.1), FL + 0.05, z, house);
      const br = box(0.08, 0.7, 0.08, M.wood, sx * (PX - 0.36), PE - 0.3, z, house);
      br.rotation.z = sx * 0.75;
    }
    // side balustrade
    box(0.08, 0.06, PZ1 - PZ0 - 0.2, M.wood, sx * (PX - 0.1), FL + 0.85, (PZ0 + PZ1) / 2 - 0.05, house);
    box(0.08, 0.06, PZ1 - PZ0 - 0.2, M.wood, sx * (PX - 0.1), FL + 0.12, (PZ0 + PZ1) / 2 - 0.05, house);
    const lathe = new THREE.LatheGeometry([[0.025, 0], [0.04, 0.08], [0.022, 0.2], [0.035, 0.38], [0.022, 0.55], [0.04, 0.66], [0.025, 0.72]].map(([a, b]) => new THREE.Vector2(a, b)), 8);
    for (let z = PZ0 + 0.2; z < PZ1 - 0.2; z += 0.16) {
      const m = new THREE.Mesh(lathe, M.wood); m.position.set(sx * (PX - 0.1), FL + 0.14, z); m.castShadow = true; house.add(m);
    }
  }
  // beam across front
  box(PX * 2 + 0.2, 0.16, 0.16, M.wood, 0, PE + 0.02, PZ1 - 0.12, house);
  // porch ceiling (planked soffit) closes the roof cavity
  {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(PX * 2 + 0.3, PZ1 - HD + 0.1), M.ceil);
    c.rotation.x = Math.PI / 2; c.position.set(0, PE + 0.1, (HD + PZ1) / 2); c.receiveShadow = true; house.add(c);
    const uv = c.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.6, uv.getY(i) * 1.2);
    box(PX * 2 + 0.3, 0.12, 0.12, M.wood, 0, PE + 0.04, HD + 0.08, house);
  }
  // porch roof
  const sl = Math.hypot(PX + 0.25, PR - PE + 0.2);
  const pa = Math.atan2(PR - PE, PX);
  const zLen = PZ1 - 2.1 + 0.35;
  for (const sx of [-1, 1]) {
    const m = box(sl, 0.1, zLen, M.roofBase, sx * (PX + 0.25) / 2, (PR + PE - 0.2) / 2 - 0.02, 2.1 + zLen / 2 - 0.1, house);
    m.rotation.z = -sx * pa;
  }
  // porch tiles
  {
    const sA = Math.sin(pa), cA = Math.cos(pa);
    const zs = [2.6, PZ1 + 0.28];
    const ridgeO = new THREE.Vector3(0, PR + 0.0, 0);
    const len = Math.hypot(PX + 0.25, (PX + 0.25) * Math.tan(pa));
    // right slope (x>0): X along -z? use X along z, Y uphill (-x,+y), Z normal
    layTiles(0, { X: new THREE.Vector3(0, 0, -1), Y: new THREE.Vector3(-cA, sA, 0), Z: new THREE.Vector3(sA, cA, 0) }, ridgeO, len, [-zs[1], -zs[0]]);
    layTiles(0, { X: new THREE.Vector3(0, 0, 1), Y: new THREE.Vector3(cA, sA, 0), Z: new THREE.Vector3(-sA, cA, 0) }, ridgeO, len, [zs[0], zs[1]]);
    // ridge cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, zs[1] - zs[0], 10, 1, true, 0, Math.PI), M.tile.clone());
    cap.material.color.set("#9c4b2e");
    cap.rotation.x = Math.PI / 2; cap.rotation.y = Math.PI / 2;
    cap.rotation.set(Math.PI / 2, 0, 0);
    cap.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    cap.position.set(0, PR + 0.07, (zs[0] + zs[1]) / 2); cap.castShadow = true; house.add(cap);
  }
  // decorative gable on porch front: vertical planks + sunburst slats
  const s = new THREE.Shape();
  s.moveTo(-PX - 0.05, PE + 0.1); s.lineTo(PX + 0.05, PE + 0.1); s.lineTo(0, PR - 0.05); s.lineTo(-PX - 0.05, PE + 0.1);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 1.2);
  const gm = new THREE.Mesh(g, M.woodRaw); gm.position.z = PZ1 - 0.06; gm.castShadow = true; gm.receiveShadow = true; house.add(gm);
  for (let i = -4; i <= 4; i++) {
    const a = (i / 4) * 1.0;
    const r = box(0.03, 0.62, 0.02, M.sash, Math.sin(a) * 0.3, PE + 0.32 + Math.cos(a) * 0.3, PZ1 + 0.0, house, false);
    r.rotation.z = -a;
  }
  for (const sx of [-1, 1]) {
    const len = Math.hypot(PX + 0.35, (PX + 0.35) * Math.tan(pa));
    const b = box(len, 0.2, 0.05, M.trim, sx * (PX + 0.3) / 2, (PR + PE) / 2 + 0.06, PZ1 + 0.3, house);
    b.rotation.z = -sx * pa;
  }
}

// leaf-card bush helper (instanced round leaves, inner leaves darker)
const leafCard = new THREE.CircleGeometry(0.5, 7);
leafCard.translate(0, 0.5, 0);
function bush(parent, cx, cy, cz, rx, ry, rz, n, color, size, flowers = 0, flowerCol = "#d0202a") {
  const im = new THREE.InstancedMesh(leafCard, M.leaf, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, th = rnd() * 6.283, r = Math.cbrt(rnd());
    p.set(Math.sqrt(1 - u * u) * Math.cos(th) * rx * r, Math.abs(u) * ry * r, Math.sqrt(1 - u * u) * Math.sin(th) * rz * r);
    e.set(-1.2 + rnd() * 0.9, rnd() * 6.28, rnd() * 0.6 - 0.3, "YXZ"); q.setFromEuler(e);
    const sc = size * (0.7 + rnd() * 0.6);
    m4.compose(p.clone().add(new THREE.Vector3(cx, cy, cz)), q, new THREE.Vector3(sc, sc, sc));
    im.setMatrixAt(i, m4);
    c.set(color).offsetHSL(rnd() * 0.03, 0, rnd() * 0.1 - 0.05).multiplyScalar(0.55 + 0.6 * r);
    im.setColorAt(i, c);
  }
  im.castShadow = true; im.receiveShadow = true; parent.add(im);
  if (flowers) {
    const fg = new THREE.IcosahedronGeometry(0.018, 1);
    const fi = new THREE.InstancedMesh(fg, M.geranium, flowers * 9);
    let k = 0;
    for (let f = 0; f < flowers; f++) {
      const fx = cx + (rnd() * 2 - 1) * rx * 0.85, fy = cy + ry * (0.75 + rnd() * 0.45), fz = cz + (rnd() * 2 - 1) * rz * 0.7;
      for (let j = 0; j < 9; j++) {
        m4.makeTranslation(fx + (rnd() - 0.5) * 0.06, fy + (rnd() - 0.5) * 0.04, fz + (rnd() - 0.5) * 0.06);
        fi.setMatrixAt(k, m4); c.set(flowerCol).offsetHSL(0, 0, rnd() * 0.12 - 0.06); fi.setColorAt(k, c); k++;
      }
    }
    fi.castShadow = true; parent.add(fi);
  }
}
const texLace = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = "rgba(250,246,238,0.92)"; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-out";
  for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x + ((y / 16) % 2) * 8, y, 4.2, 0, 7); g.fill(); }
}, true, [3, 3]);
const curtainMat = new THREE.MeshStandardMaterial({ color: col("#fff8ec"), map: texLace, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, emissive: col("#ffe6c0"), emissiveIntensity: 0.06 });
function curtain(parent, x, y, z, w, h) {
  const g = new THREE.PlaneGeometry(w, h, 30, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 38) * 0.025);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, curtainMat); m.position.set(x, y, z); parent.add(m);
}

// ---------- windows & door ----------
function windowAt(place, flowerBox = true) {
  const g = new THREE.Group();
  const { w, h } = WIN;
  // reveal depth: glass set 0.12 inside
  const gz = -0.13;
  // outer casing
  const cw = 0.11;
  box(w + cw * 2, cw, 0.05, M.trim, 0, h / 2 + cw / 2, 0.02, g);
  box(w + cw * 2 + 0.08, 0.06, 0.08, M.trim, 0, h / 2 + cw + 0.03, 0.04, g);
  box(cw, h, 0.05, M.trim, -w / 2 - cw / 2, 0, 0.02, g);
  box(cw, h, 0.05, M.trim, w / 2 + cw / 2, 0, 0.02, g);
  // sill
  box(w + 0.3, 0.06, 0.24, M.trim, 0, -h / 2 - 0.03, 0.06, g);
  // sash frame + muntins
  const f = 0.06;
  box(w, f, 0.06, M.sash, 0, h / 2 - f / 2, gz, g);
  box(w, f, 0.06, M.sash, 0, -h / 2 + f / 2, gz, g);
  box(f, h, 0.06, M.sash, -w / 2 + f / 2, 0, gz, g);
  box(f, h, 0.06, M.sash, w / 2 - f / 2, 0, gz, g);
  box(0.045, h, 0.05, M.sash, 0, 0, gz, g);
  box(w, 0.045, 0.05, M.sash, 0, h * 0.18, gz, g);
  // glass planes
  const go = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), M.glassOut); go.position.z = gz + 0.005; g.add(go);
  const gi = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), M.glassIn); gi.position.z = gz - 0.005; gi.rotation.y = Math.PI; g.add(gi);
  // shutters (open against the wall)
  for (const sx of [-1, 1]) {
    const sh = box(w / 2, h + 0.02, 0.04, M.shutter, sx * (w / 2 + cw + w / 4 + 0.02), 0, 0.03, g);
    box(w / 2 - 0.06, 0.05, 0.02, M.shutter, sx * (w / 2 + cw + w / 4 + 0.02), h * 0.28, 0.06, g);
    box(w / 2 - 0.06, 0.05, 0.02, M.shutter, sx * (w / 2 + cw + w / 4 + 0.02), -h * 0.28, 0.06, g);
    const dia = box(0.04, h * 0.6, 0.02, M.shutter, sx * (w / 2 + cw + w / 4 + 0.02), 0, 0.06, g);
    dia.rotation.z = sx * 0.6;
  }
  if (flowerBox) {
    box(w + 0.1, 0.18, 0.2, M.trim, 0, -h / 2 - 0.16, 0.2, g);
    bush(g, 0, -h / 2 - 0.07, 0.2, w / 2, 0.16, 0.12, 260, "#3f6b2c", 0.07, 7);
  }
  curtain(g, -w / 2 + 0.12, 0.05, -T - 0.035, 0.42, h + 0.32);
  curtain(g, w / 2 - 0.12, 0.05, -T - 0.035, 0.42, h + 0.32);
  box(w + 0.5, 0.03, 0.03, M.iron, 0, h / 2 + 0.22, -T - 0.035, g, false);
  g.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  place(g); house.add(g);
}
windowAt((g) => g.position.set(-2.75, WIN.cy, HD));
windowAt((g) => g.position.set(2.75, WIN.cy, HD));
windowAt((g) => { g.rotation.y = Math.PI; g.position.set(1.9, WIN.cy, -HD); }, false);
windowAt((g) => { g.rotation.y = -Math.PI / 2; g.position.set(-HW, WIN.cy, 0.2); });
windowAt((g) => { g.rotation.y = Math.PI / 2; g.position.set(HW, WIN.cy, -0.2); });

// door: casing + open leaf (swung inward)
{
  const { w, h } = DOOR;
  const y0 = FL;
  box(w + 0.24, 0.14, 0.06, M.trim, 0, y0 + h + 0.07, HD + 0.02, house);
  box(0.12, h, 0.06, M.trim, -w / 2 - 0.06, y0 + h / 2, HD + 0.02, house);
  box(0.12, h, 0.06, M.trim, w / 2 + 0.06, y0 + h / 2, HD + 0.02, house);
  box(w, 0.05, T + 0.02, M.trim, 0, y0 + 0.02, HD - T / 2, house); // threshold
  const leaf = new THREE.Group();
  const lw = w - 0.04;
  box(lw, h - 0.03, 0.06, M.wood, lw / 2, (h - 0.03) / 2, 0, leaf);
  box(lw - 0.1, 0.12, 0.03, M.trim, lw / 2, 0.45, 0.045, leaf);
  box(lw - 0.1, 0.12, 0.03, M.trim, lw / 2, h - 0.45, 0.045, leaf);
  const dd = box(0.1, h * 0.75, 0.03, M.trim, lw / 2, h / 2, 0.045, leaf); dd.rotation.z = 0.42;
  box(0.05, 0.05, 0.08, M.iron, lw - 0.1, 1.0, 0.07, leaf);
  leaf.position.set(-w / 2 + 0.02, y0 + 0.01, HD - T - 0.03);
  leaf.rotation.y = 1.45;
  leaf.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  house.add(leaf);
}

// bench by the wall, woodpile under the left eave
{
  box(1.6, 0.06, 0.36, M.woodRaw, 3.6, 0.46, HD + 0.32);
  for (const x of [2.95, 4.25]) box(0.08, 0.44, 0.3, M.woodRaw, x, 0.22, HD + 0.32);
  const logG = new THREE.CylinderGeometry(0.11, 0.11, 0.55, 9);
  const logs = new THREE.InstancedMesh(logG, M.woodRaw, 90);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const cc = new THREE.Color();
  let n = 0;
  for (let row = 0; row < 6; row++) for (let i = 0; i < 14; i++) {
    if (n >= 90) break;
    e.set(0, 0, Math.PI / 2 + R(-0.05, 0.05)); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(-HW - 0.45 + R(-0.03, 0.03), 0.12 + row * 0.2, -2.3 + i * 0.22 + (row % 2) * 0.11), q, new THREE.Vector3(1, 1, 1));
    logs.setMatrixAt(n, m4); cc.set("#8a6a48").offsetHSL(0, R(-0.05, 0.05), R(-0.08, 0.08)); logs.setColorAt(n, cc); n++;
  }
  logs.count = n; logs.castShadow = logs.receiveShadow = true; scene.add(logs);
}

// ---------- interior ----------
const lampPos = new THREE.Vector3(-0.55, 2.28, -0.95);
{
  const tableY = FL + 0.78, tx = -0.55, tz = -0.95;
  // table
  box(1.7, 0.06, 0.95, M.woodRaw, tx, tableY, tz);
  const legG = new THREE.LatheGeometry([[0.03, 0], [0.045, 0.1], [0.03, 0.3], [0.05, 0.5], [0.035, 0.75]].map(([a, b]) => new THREE.Vector2(a, b)), 10);
  for (const [dx, dz] of [[-0.75, -0.38], [0.75, -0.38], [-0.75, 0.38], [0.75, 0.38]]) {
    const l = new THREE.Mesh(legG, M.woodRaw); l.position.set(tx + dx, FL, tz + dz); l.castShadow = true; scene.add(l);
  }
  // tablecloth with drape
  const cg = new THREE.PlaneGeometry(1.95, 1.2, 40, 26);
  const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), y = cp.getY(i);
    const ox = Math.max(0, Math.abs(x) - 0.86), oy = Math.max(0, Math.abs(y) - 0.48);
    const o = Math.max(ox, oy);
    let zz = -o * 1.6 + Math.sin(x * 22) * 0.008 * smooth(0, 0.1, o);
    cp.setZ(i, zz + (o > 0 ? 0 : 0));
    if (ox > 0) cp.setX(i, Math.sign(x) * (0.86 + ox * 0.25));
    if (oy > 0) cp.setY(i, Math.sign(y) * (0.48 + oy * 0.25));
  }
  cg.computeVertexNormals();
  const cloth = new THREE.Mesh(cg, M.cloth);
  cloth.rotation.x = -Math.PI / 2; cloth.position.set(tx, tableY + 0.035, tz); cloth.castShadow = true; cloth.receiveShadow = true; scene.add(cloth);
  // things on the table
  const jug = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.1, 0.06], [0.11, 0.13], [0.08, 0.22], [0.055, 0.28], [0.065, 0.31]].map(([a, b]) => new THREE.Vector2(a, b)), 24), M.ceramic);
  jug.position.set(tx + 0.35, tableY + 0.04, tz - 0.1); jug.castShadow = true; scene.add(jug);
  const cupG = new THREE.LatheGeometry([[0, 0], [0.035, 0], [0.045, 0.02], [0.05, 0.09], [0.047, 0.09]].map(([a, b]) => new THREE.Vector2(a, b)), 18);
  for (const [dx, dz] of [[0.1, 0.22], [-0.45, 0.2]]) { const c = new THREE.Mesh(cupG, M.ceramicBlue); c.position.set(tx + dx, tableY + 0.04, tz + dz); c.castShadow = true; scene.add(c); }
  const bread = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), M.bread); bread.scale.set(1, 0.55, 0.8);
  bread.position.set(tx - 0.25, tableY + 0.11, tz - 0.12); bread.castShadow = true; scene.add(bread);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.08, 0], [0.16, 0.05], [0.19, 0.1], [0.185, 0.1]].map(([a, b]) => new THREE.Vector2(a, b)), 24), M.ceramic);
  bowl.material = M.ceramic.clone(); bowl.material.color.set("#7c4a2a"); bowl.material.side = THREE.DoubleSide;
  bowl.position.set(tx - 0.62, tableY + 0.04, tz + 0.08); bowl.castShadow = true; scene.add(bowl);
  for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), M.apple); a.position.set(tx - 0.62 + R(-0.08, 0.08), tableY + 0.12 + R(0, 0.03), tz + 0.08 + R(-0.08, 0.08)); a.castShadow = true; scene.add(a); }
  // chairs
  for (const [cx, cz, ry] of [[tx - 0.3, tz + 0.75, 0.1], [tx + 0.45, tz - 0.78, Math.PI - 0.15], [tx + 1.15, tz + 0.1, -Math.PI / 2 + 0.2]]) {
    const ch = new THREE.Group();
    box(0.44, 0.04, 0.42, M.woodRaw, 0, 0.46, 0, ch);
    for (const [a, b] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) box(0.04, 0.46, 0.04, M.woodRaw, a, 0.23, b, ch);
    box(0.44, 0.5, 0.035, M.woodRaw, 0, 0.75, 0.2, ch);
    ch.position.set(cx, FL, cz); ch.rotation.y = ry; ch.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(ch);
  }
  // rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.5), M.rug); rug.rotation.x = -Math.PI / 2; rug.position.set(tx, FL + 0.005, tz + 0.05); rug.receiveShadow = true; scene.add(rug);
  // pendant lamp
  const shade = new THREE.Mesh(new THREE.LatheGeometry([[0.04, 0.2], [0.09, 0.17], [0.2, 0.06], [0.27, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 32), M.lampShade);
  shade.position.copy(lampPos).add(new THREE.Vector3(0, -0.05, 0)); scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.bulb); bulb.position.copy(lampPos).add(new THREE.Vector3(0, 0.0, 0)); scene.add(bulb);
  box(0.012, CEIL - lampPos.y - 0.15, 0.012, M.iron, lampPos.x, (CEIL + lampPos.y + 0.15) / 2, lampPos.z, scene, false, false);
  // tiled stove in back-right corner
  const st = new THREE.Group();
  box(1.0, 1.7, 0.9, M.stove, 0, 0.85, 0, st);
  box(1.1, 0.08, 1.0, M.ceramic, 0, 1.74, 0, st);
  box(0.8, 0.5, 0.7, M.stove, 0, 2.03, 0, st);
  box(0.9, 0.06, 0.8, M.ceramic, 0, 2.31, 0, st);
  box(0.36, 0.3, 0.02, M.iron, 0, 0.45, 0.46, st);
  st.position.set(HW - T - 0.6, FL, -HD + T + 0.55); st.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(st);
  // dresser with plates on left wall
  const dr = new THREE.Group();
  box(0.5, 0.9, 1.6, M.woodRaw, 0, 0.45, 0, dr);
  box(0.3, 1.0, 1.6, M.woodRaw, -0.1, 1.45, 0, dr);
  box(0.36, 0.04, 1.6, M.woodRaw, -0.07, 1.25, 0, dr);
  box(0.36, 0.04, 1.6, M.woodRaw, -0.07, 1.65, 0, dr);
  const plateG = new THREE.CylinderGeometry(0.15, 0.12, 0.02, 24);
  const plateM = M.ceramicBlue.clone(); plateM.color.set("#ece4d2");
  for (const yy of [1.27, 1.67]) for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(plateG, plateM); p.rotation.z = Math.PI / 2 - 0.25; p.position.set(-0.1, yy + 0.15, -0.6 + i * 0.4); p.castShadow = true; dr.add(p);
  }
  dr.position.set(-HW + T + 0.27, FL, -0.6); dr.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(dr);
  // bench along back wall
  box(2.0, 0.06, 0.38, M.woodRaw, -1.9, FL + 0.45, -HD + T + 0.22);
  for (const x of [-2.75, -1.05]) box(0.06, 0.45, 0.34, M.woodRaw, x, FL + 0.22, -HD + T + 0.22);
  // framed picture with embroidered towel (rushnyk)
  box(0.5, 0.62, 0.03, M.trim, -0.6, FL + 1.75, -HD + T + 0.02);
  const pic = box(0.4, 0.52, 0.01, M.ceramic, -0.6, FL + 1.75, -HD + T + 0.04, scene, false); pic.material = M.ceramic.clone(); pic.material.color.set("#6e5a3a");
  const tw = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.9), M.cloth); tw.position.set(-0.98, FL + 1.55, -HD + T + 0.05); tw.rotation.z = 0.05; scene.add(tw);
  const tw2 = tw.clone(); tw2.position.x = -0.22; tw2.rotation.z = -0.05; scene.add(tw2);
  const tw3 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.16), M.cloth); tw3.position.set(-0.6, FL + 2.1, -HD + T + 0.06); scene.add(tw3);
  // potted plant on back window sill (inside)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.15, 16), M.ceramic); pot.material = M.ceramic.clone(); pot.material.color.set("#9a4c2c");
  pot.position.set(1.9, WIN.cy - WIN.h / 2 + 0.08, -HD + T + 0.05); scene.add(pot);
  bush(scene, 1.9, WIN.cy - WIN.h / 2 + 0.15, -HD + T + 0.06, 0.14, 0.2, 0.1, 160, "#4a7a32", 0.06, 3, "#e0505a");
  // wall shelf with jugs
  box(0.9, 0.04, 0.2, M.woodRaw, 0.55, FL + 1.55, -HD + T + 0.1);
  for (const [dx, hh, cc] of [[0.25, 0.26, "#b8743e"], [0.55, 0.2, "#e6dcc6"], [0.82, 0.3, "#6d4a2e"]]) {
    const j = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.075, hh * 0.35], [0.06, hh * 0.75], [0.035, hh * 0.9], [0.045, hh]].map(([a, b]) => new THREE.Vector2(a, b)), 20), M.ceramic.clone());
    j.material.color.set(cc); j.position.set(dx + 0.0, FL + 1.57, -HD + T + 0.1); j.castShadow = true; scene.add(j);
  }
}
const lamp = new THREE.PointLight(col("#ffad5c"), 4.2, 0, 2);
lamp.position.copy(lampPos).add(new THREE.Vector3(0, -0.05, 0));
lamp.castShadow = true; lamp.shadow.mapSize.set(512, 512); lamp.shadow.bias = -0.002; lamp.shadow.radius = 4;
lamp.shadow.camera.near = 0.1; lamp.shadow.camera.far = 8;
scene.add(lamp);
const fill = new THREE.PointLight(col("#ff9d55"), 1.4, 0, 2);
fill.position.set(1.5, 2.4, 1.2); scene.add(fill);

// ---------- terrain ----------
function heightAt(x, z) {
  const d = Math.hypot(x, z);
  let h = (fbm(x * 0.05, z * 0.05, 3) - 0.5) * 0.35;
  const far = smooth(28, 220, d);
  const back = 1 + smooth(0, -600, z) * 1.2;
  h += far * ((fbm(x * 0.004 + 4, z * 0.004, 5) - 0.4) * 34 * back + d * 0.008);
  // rolling foothills in the middle distance
  h += smooth(250, 900, d) * Math.pow(fbm(x * 0.0018 + 7, z * 0.0018 + 3, 5), 1.6) * 150;
  // dip in front (valley road) so the yard reads as a terrace
  h -= smooth(30, 200, z) * 6 * smooth(10, 60, d);
  return h;
}
function groundColor(x, z, c) {
  const n = fbm(x * 0.08, z * 0.08, 4), n2 = fbm(x * 0.012 + 9, z * 0.012, 4);
  c.setRGB(1.0, 0.98, 0.66);
  c.lerp(new THREE.Color(1.2, 0.98, 0.58), smooth(0.4, 0.7, n) * 0.6); // dry patches
  c.lerp(new THREE.Color(0.45, 0.58, 0.35), smooth(0.5, 0.2, n2) * 0.5);
  // path from gate to steps + road outside the fence
  const path = Math.max(1 - smooth(0.5, 1.0, Math.abs(x + Math.sin(z * 0.4) * 0.15)) * (z > 5.3 && z < 12.2 ? 1 : 0), 0);
  const rdz = Math.abs(z - 14.5 - Math.sin(x * 0.05) * 1.5);
  const road = (1 - smooth(1.3, 2.0, rdz)) * smooth(0.25, 0.5, rdz);
  const dirt = Math.max(z > 5.3 && z < 12.2 ? 1 - smooth(0.45, 0.95, Math.abs(x)) : 0, road * smooth(400, 300, Math.abs(x)));
  c.lerp(new THREE.Color(0.86, 0.7, 0.52), dirt * 0.85);
  // contact darkening near house
  const dh = Math.max(Math.abs(x) - HW, Math.abs(z) - HD - (Math.abs(x) < PX + 0.3 ? 2.6 : 0));
  c.multiplyScalar(0.65 + 0.35 * smooth(0, 1.4, dh));
  return c;
}
function makeTerrain(size, seg, drop) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, heightAt(x, z) - drop);
    groundColor(x, z, c);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    uv.setXY(i, x / 7, z / 7);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, M.ground);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
makeTerrain(150, 150, 0);
makeTerrain(5000, 250, 0.4);

// ---------- far mountains (layered, hazy, alpenglow on crests) ----------
const mtnMat = (base, haze, glow, amt) => new THREE.ShaderMaterial({
  fog: false,
  uniforms: { uBase: { value: col(base) }, uHaze: { value: col(haze) }, uGlow: { value: col(glow) }, uAmt: { value: amt } },
  vertexShader: `attribute float aH; varying float vH; varying float vN; void main(){ vH = aH; vN = position.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uBase,uHaze,uGlow; uniform float uAmt; varying float vH; varying float vN;
    void main(){ vec3 c = mix(uBase, uGlow, smoothstep(0.5,1.0,vH)*0.6);
      float mist = 1.0 - smoothstep(0.0, 0.55, vH);
      c = mix(c, uHaze, clamp(uAmt + mist*0.65, 0.0, 1.0));
      gl_FragColor = vec4(c,1.0); }`,
});
function ridge(radius, height, base, haze, glow, amt, seed, a0 = -2.2, a1 = 2.2) {
  const N = 600;
  const pos = [], hs = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = a0 + (a1 - a0) * (i / N);
    let n = 0, amp = 1, f = 1;
    for (let o = 0; o < 6; o++) { n += amp * (1 - Math.abs(vnoise(a * 3.2 * f + seed, seed * 3.1) * 2 - 1)); amp *= 0.5; f *= 2.1; }
    n = n / 1.9;
    const hgt = height * (0.35 + n * 0.85);
    const x = Math.sin(a) * radius, z = -Math.cos(a) * radius;
    pos.push(x, -60, z, x, hgt, z);
    hs.push(0, 1);
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aH", new THREE.Float32BufferAttribute(hs, 1));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mtnMat(base, haze, glow, amt));
  m.material.side = THREE.DoubleSide;
  m.frustumCulled = false;
  scene.add(m);
}
ridge(7400, 950, "#8c8fb4", "#d8b9b0", "#f6c4a8", 0.55, 3.1);
ridge(5600, 680, "#6f7798", "#d0b0a8", "#eeb59a", 0.42, 7.7);
ridge(4000, 440, "#58637e", "#c4a7a0", "#d9a088", 0.32, 1.9);
ridge(2700, 230, "#4a5a5c", "#b9a196", "#c79576", 0.26, 5.3);

// ---------- forest on the hills (instanced spruce) ----------
{
  const parts = [];
  for (let i = 0; i < 4; i++) { const cg = new THREE.ConeGeometry(1 - i * 0.2, 0.42, 7, 1).toNonIndexed(); cg.translate(0, 0.21 + i * 0.22, 0); parts.push(cg); }
  const sprG = new THREE.BufferGeometry();
  const arr = []; parts.forEach((g) => arr.push(...g.attributes.position.array));
  sprG.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); sprG.computeVertexNormals();
  const count = 5200;
  const im = new THREE.InstancedMesh(sprG, new THREE.MeshStandardMaterial({ color: col("#ffffff"), roughness: 1 }), count);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  let n = 0;
  const rr = mulberry32(99);
  for (let tries = 0; tries < 60000 && n < count; tries++) {
    const a = (rr() - 0.5) * 4.2, d = 120 + Math.pow(rr(), 0.8) * 1100;
    const x = Math.sin(a) * d, z = -Math.cos(a) * d;
    const forest = fbm(x * 0.006 + 2, z * 0.006 + 5, 4);
    if (forest < 0.5) continue;
    const h = heightAt(x, z) - 0.4;
    const s = 9 + rr() * 12;
    m4.makeScale(s * 0.28, s, s * 0.28);
    m4.setPosition(x, h - 0.5, z);
    im.setMatrixAt(n, m4);
    c.set("#2f4a33").offsetHSL(rr() * 0.04 - 0.02, 0, rr() * 0.06 - 0.03);
    im.setColorAt(n, c);
    n++;
  }
  im.count = n;
  im.receiveShadow = false;
  scene.add(im);
}

// ---------- trees (branches + thousands of leaf cards) ----------
function buildTree(x, z, scale, seed, leafCol, leaves) {
  const r = mulberry32(seed);
  const g = new THREE.Group();
  const tips = [];
  const up = new THREE.Vector3(0, 1, 0);
  function branch(start, dir, len, rad, depth) {
    const end = start.clone().addScaledVector(dir, len);
    const geo = new THREE.CylinderGeometry(rad * 0.68, rad, len, 7, 1);
    geo.translate(0, len / 2, 0);
    const m = new THREE.Mesh(geo, M.bark);
    m.quaternion.setFromUnitVectors(up, dir);
    m.position.copy(start);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    if (depth === 0) { tips.push(end); return; }
    const kids = depth > 2 ? 3 : 2 + (r() < 0.5 ? 1 : 0);
    for (let i = 0; i < kids; i++) {
      const nd = dir.clone();
      const ax = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize();
      nd.applyAxisAngle(ax, 0.35 + r() * 0.5);
      nd.y = Math.max(nd.y, 0.15);
      nd.normalize();
      branch(end, nd, len * (0.62 + r() * 0.18), rad * 0.62, depth - 1);
    }
    if (depth <= 2) tips.push(end.clone().lerp(start, 0.3));
  }
  branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(r() * 0.1 - 0.05, 1, r() * 0.1 - 0.05).normalize(), 1.9 * scale, 0.2 * scale, 4);
  // leaves
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.045, 0.06, 0, 0, 0.14, 0, -0.045, 0.06, 0], 3));
  lg.setIndex([0, 1, 2, 0, 2, 3]);
  lg.computeVertexNormals();
  const im = new THREE.InstancedMesh(lg, M.leaf, leaves);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  // crown centroid for inner darkening
  const cen = new THREE.Vector3(); tips.forEach((t) => cen.add(t)); cen.divideScalar(tips.length);
  let maxd = 0; tips.forEach((t) => { maxd = Math.max(maxd, t.distanceTo(cen)); });
  for (let i = 0; i < leaves; i++) {
    const t = tips[Math.floor(r() * tips.length)];
    const rad = (0.45 + r() * 0.5) * scale;
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = Math.cbrt(r()) * rad;
    p.set(Math.sqrt(1 - u * u) * Math.cos(th), u * 0.8, Math.sqrt(1 - u * u) * Math.sin(th)).multiplyScalar(rr).add(t);
    e.set(r() * 6.28, r() * 6.28, r() * 6.28); q.setFromEuler(e);
    const sc = (0.9 + r() * 0.7) * scale;
    s.set(sc, sc, sc);
    m4.compose(p, q, s); im.setMatrixAt(i, m4);
    const depth = p.distanceTo(cen) / (maxd + rad);
    c.set(leafCol).offsetHSL(r() * 0.05 - 0.025, r() * 0.1 - 0.05, r() * 0.12 - 0.06);
    c.multiplyScalar(0.45 + 0.65 * Math.min(1, depth) + (p.y - cen.y) * 0.04);
    im.setColorAt(i, c);
  }
  im.castShadow = true; im.receiveShadow = true;
  g.add(im);
  g.position.set(x, heightAt(x, z) - 0.05, z);
  g.rotation.y = r() * 6.28;
  scene.add(g);
  return g;
}
buildTree(-9.6, 8.6, 1.05, 11, "#5f8434", 9000);
buildTree(8.2, -3.8, 1.35, 23, "#557a32", 11000);
buildTree(-9.5, -5.5, 1.15, 37, "#5d7d34", 8000);
buildTree(12.5, 8.5, 0.9, 51, "#62833a", 6000);
// scattered orchard trees and haystacks in the middle distance
for (const [x, z, sc, sd] of [[-28, -18, 0.9, 61], [-41, 4, 1.0, 62], [26, -26, 1.1, 63], [38, 6, 0.85, 64], [-20, -40, 1.0, 65], [17, -44, 0.9, 66], [52, -12, 1.0, 67], [-55, -22, 1.1, 68]]) buildTree(x, z, sc, sd, "#5b7d33", 1800);
for (const [x, z] of [[-24, -9], [31, -15], [-36, -30], [22, 16]]) {
  const hg = new THREE.ConeGeometry(1.3, 3.0, 18, 4);
  const h = new THREE.Mesh(hg, M.hay); h.position.set(x, heightAt(x, z) + 1.4, z); h.scale.set(1, 1, 1); h.castShadow = h.receiveShadow = true; scene.add(h);
  box(0.07, 1.0, 0.07, M.woodRaw, x, heightAt(x, z) + 3.2, z);
}

// tall spruces behind the house: trunk + tiers of drooping fronds (instanced)
{
  const sprM = new THREE.MeshStandardMaterial({ color: col("#ffffff"), roughness: 0.95 });
  const fg = new THREE.ConeGeometry(0.32, 1, 6, 1);
  fg.translate(0, 0.5, 0); fg.scale(1, 1, 0.45);
  const pts = [[-14, -13, 15], [-18, -8, 12], [15, -15, 16], [19, -9, 12], [-4, -20, 14], [5, -23, 17], [-22, -16, 13], [24, -18, 15]];
  const fronds = [];
  const rr = mulberry32(555);
  for (const [x, z, h] of pts) {
    const y0 = heightAt(x, z);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, h * 0.95, 6), M.bark); tr.position.set(x, y0 + h * 0.47, z); tr.castShadow = true; scene.add(tr);
    const tiers = 22;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const y = y0 + h * (0.12 + t * 0.86);
      const len = (1 - t) * h * 0.3 + 0.35;
      const per = Math.max(4, Math.round(9 - t * 4));
      for (let j = 0; j < per; j++) {
        const a = (j / per) * 6.283 + rr() * 0.6 + i * 0.7;
        fronds.push([x, y, z, a, len * (0.85 + rr() * 0.3), 1.9 + rr() * 0.25 - t * 0.5, rr()]);
      }
    }
  }
  const im = new THREE.InstancedMesh(fg, sprM, fronds.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  fronds.forEach(([x, y, z, a, len, droop, v], i) => {
    e.set(0, a, -droop, "YXZ"); // tilt cone (pointing +y) outward and downward
    q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1 + len * 0.25, len, 1 + len * 0.25));
    im.setMatrixAt(i, m4);
    c.set("#34502f").offsetHSL(v * 0.03 - 0.015, 0, v * 0.08 - 0.05);
    im.setColorAt(i, c);
  });
  im.castShadow = true; im.receiveShadow = true;
  scene.add(im);
}

// ---------- fence ----------
{
  const pick = new THREE.BufferGeometry();
  // picket with pointed top
  const pw = 0.09, ph = 1.15, pt = 0.022;
  const s = new THREE.Shape(); s.moveTo(-pw / 2, 0); s.lineTo(pw / 2, 0); s.lineTo(pw / 2, ph - 0.07); s.lineTo(0, ph); s.lineTo(-pw / 2, ph - 0.07); s.lineTo(-pw / 2, 0);
  const pg = new THREE.ExtrudeGeometry(s, { depth: pt, bevelEnabled: false });
  const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / pw, uv.getY(i) / ph);
  const lines = [];
  const FZ = 12.2;
  // front line with gate gap
  for (let x = -11; x <= 11; x += 0.155) if (Math.abs(x) > 0.75) lines.push([x, FZ, 0]);
  for (let z = FZ; z >= -8; z -= 0.155) { lines.push([-11, z, Math.PI / 2]); lines.push([11, z, Math.PI / 2]); }
  const im = new THREE.InstancedMesh(pg, M.fence, lines.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  lines.forEach(([x, z, ry], i) => {
    e.set(R(-0.03, 0.03), ry + R(-0.03, 0.03), R(-0.04, 0.04)); q.setFromEuler(e);
    const sc = 1 + R(-0.06, 0.05);
    m4.compose(new THREE.Vector3(x, heightAt(x, z) - 0.05, z), q, new THREE.Vector3(1, sc, 1));
    im.setMatrixAt(i, m4);
    c.set("#b9a084").offsetHSL(R(-0.02, 0.02), R(-0.08, 0.05), R(-0.12, 0.06)); im.setColorAt(i, c);
  });
  im.castShadow = true; im.receiveShadow = true; scene.add(im);
  // rails + posts
  const railM = M.woodRaw;
  for (const y of [0.3, 0.85]) {
    box(10.25, 0.07, 0.05, railM, -5.875, y, FZ - 0.05);
    box(10.25, 0.07, 0.05, railM, 5.875, y, FZ - 0.05);
    box(0.05, 0.07, 20.2, railM, -11 + 0.06, y, (FZ - 8) / 2);
    box(0.05, 0.07, 20.2, railM, 11 - 0.06, y, (FZ - 8) / 2);
  }
  for (let x = -11; x <= 11.01; x += 2.2) if (Math.abs(x) > 0.7) box(0.12, 1.25, 0.12, railM, x, 0.6, FZ - 0.08);
  box(0.16, 1.5, 0.16, railM, -0.8, 0.72, FZ - 0.05); box(0.16, 1.5, 0.16, railM, 0.8, 0.72, FZ - 0.05);
  // open gate leaf
  const gate = new THREE.Group();
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(pg, M.fence); p.position.set(0.08 + i * 0.15, 0.05, 0); p.castShadow = true; gate.add(p); }
  box(0.78, 0.07, 0.04, railM, 0.4, 0.35, -0.02, gate); box(0.78, 0.07, 0.04, railM, 0.4, 0.85, -0.02, gate);
  gate.position.set(-0.75, 0, FZ - 0.04); gate.rotation.y = 1.2; scene.add(gate);
}

// stepping stones on the path
{
  const sg = new THREE.CylinderGeometry(0.28, 0.3, 0.05, 9);
  const im = new THREE.InstancedMesh(sg, M.stone, 20);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  let n = 0;
  for (let z = 5.9; z < 12; z += 0.62) {
    e.set(R(-0.03, 0.03), R(0, 3), R(-0.03, 0.03)); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(R(-0.1, 0.1) + Math.sin(z * 0.4) * 0.12, heightAt(0, z) + 0.01, z), q, new THREE.Vector3(R(0.8, 1.15), 1, R(0.7, 1.0)));
    im.setMatrixAt(n, m4); c.set("#9c968a").offsetHSL(0, 0, R(-0.08, 0.06)); im.setColorAt(n, c); n++;
  }
  im.count = n; im.receiveShadow = true; im.castShadow = true; scene.add(im);
}

// haystack on a pole (traditional), back of the yard
{
  const hg = new THREE.ConeGeometry(1.4, 3.2, 24, 8);
  const p = hg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + (hash2(x * 7, z * 7 + y) - 0.5) * 0.08 + Math.sin(y * 3) * 0.03;
    const bulge = 1 + 0.18 * Math.sin((y / 3.2 + 0.5) * Math.PI);
    p.setX(i, x * k * bulge); p.setZ(i, z * k * bulge);
  }
  hg.computeVertexNormals();
  const h = new THREE.Mesh(hg, M.hay); h.position.set(7.8, 1.6, -8.5); h.castShadow = h.receiveShadow = true; scene.add(h);
  box(0.08, 1.4, 0.08, M.woodRaw, 7.8, 3.6, -8.5);
}

// ---------- grass blades (instanced, swaying via uniform time) ----------
const grassUniforms = { uTime: { value: 0 } };
{
  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.Float32BufferAttribute([-0.014, 0, 0, 0.014, 0, 0, -0.009, 0.45, 0.02, 0.009, 0.45, 0.02, 0, 1, 0.08], 3));
  bg.setAttribute("color", new THREE.Float32BufferAttribute([0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 1.15, 1.15, 1.1], 3));
  bg.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  bg.computeVertexNormals();
  // normals point up-ish for soft look
  const nrm = bg.attributes.normal; for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 0.8, 0.6);
  const count = 125000;
  const im = new THREE.InstancedMesh(bg, M.grass, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  const rr = mulberry32(4242);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 6; tries++) {
    const x = (rr() - 0.5) * 84, z = -26 + rr() * 74;
    const dc = Math.hypot(x * 0.8, z - 6);
    if (rr() > Math.min(1, Math.max(0.035, 1.25 * Math.exp(-dc / 13)))) continue;
    if (Math.abs(x) < HW + 0.25 && Math.abs(z) < HD + 0.25) continue;
    if (Math.abs(x) < PX + 0.3 && z > HD && z < HD + 2.9) continue;
    if (z > 5.3 && z < 12.2 && Math.abs(x) < 0.7) continue;
    const dz = Math.abs(z - 14.5 - Math.sin(x * 0.05) * 1.5);
    if (dz > 0.35 && dz < 1.6) continue;
    const dens = fbm(x * 0.3, z * 0.3, 3);
    if (rr() > 0.55 + dens) continue;
    const grow = 1 + dc / 16;
    const hgt = (0.09 + rr() * 0.2) * (0.7 + dens * 0.8) * (z > 12.2 ? 1.5 : 1) * Math.min(1.8, 1 + dc / 40);
    e.set(R(-0.25, 0.25) * 1, rr() * 6.28, R(-0.25, 0.25)); q.setFromEuler(e);
    s.set((1 + rr() * 0.6) * grow, hgt, 1);
    p.set(x, heightAt(x, z) - 0.02, z);
    m4.compose(p, q, s); im.setMatrixAt(n, m4);
    const g = rr();
    c.setRGB(0.5, 0.68, 0.25).lerp(new THREE.Color(0.95, 0.82, 0.4), g * g * g * 0.85);
    c.multiplyScalar(0.8 + rr() * 0.4);
    im.setColorAt(n, c);
    n++;
  }
  im.count = n;
  im.receiveShadow = true;
  M.grass.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = grassUniforms.uTime;
    sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float ph = instanceMatrix[3].x*0.7 + instanceMatrix[3].z*0.5;
       float bend = position.y*position.y;
       transformed.x += sin(uTime*1.6 + ph)*0.05*bend;
       transformed.z += cos(uTime*1.2 + ph*1.3)*0.03*bend;`);
  };
  scene.add(im);
  // wildflowers
  const fg = new THREE.IcosahedronGeometry(0.025, 0);
  const fm = new THREE.MeshStandardMaterial({ color: col("#ffffff"), roughness: 0.6 });
  const fi = new THREE.InstancedMesh(fg, fm, 900);
  const cols = ["#f4efe2", "#f2c94c", "#b49ad8", "#e9e2f0", "#d9534f"];
  let k = 0;
  for (let tries = 0; k < 900 && tries < 9000; tries++) {
    const x = (rr() - 0.5) * 34, z = -9 + rr() * 27;
    if (Math.abs(x) < HW + 0.6 && Math.abs(z) < HD + 0.6) continue;
    if (Math.abs(x) < PX + 0.5 && z > HD && z < HD + 3) continue;
    if (Math.abs(x) < 0.9 && z > 5 && z < 12.5) continue;
    if (Math.abs(z - 14.5) < 2.2) continue;
    m4.makeTranslation(x, heightAt(x, z) + 0.12 + rr() * 0.2, z);
    fi.setMatrixAt(k, m4); c.set(cols[Math.floor(rr() * cols.length)]); fi.setColorAt(k, c); k++;
  }
  fi.count = k; scene.add(fi);
}

// contact shadow decal under the house
{
  const d = new THREE.Mesh(new THREE.PlaneGeometry(14, 11), new THREE.MeshBasicMaterial({ map: texContact, transparent: true, depthWrite: false, opacity: 0.55, color: 0x000000 }));
  d.material.color.set(0x000000); d.material.alphaMap = texContact; d.material.map = null;
  d.rotation.x = -Math.PI / 2; d.position.set(0, 0.03, 0.8); scene.add(d);
}

// ---------- smoke from the chimney & dust motes ----------
const smoke = [];
{
  const sm = new THREE.SpriteMaterial({ map: texSoft, color: col("#d8d2cf"), transparent: true, depthWrite: false, opacity: 0.3, fog: true });
  for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(sm.clone()); scene.add(s); smoke.push(s); }
}
const dustOut = (() => {
  const N = 500, pos = new Float32Array(N * 3), base = [];
  const rr = mulberry32(777);
  for (let i = 0; i < N; i++) base.push([(rr() - 0.5) * 16, 0.3 + rr() * 4, 2 + rr() * 20, rr() * 6.28, 0.2 + rr() * 0.5]);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: 0.035, map: texSoft, color: col("#ffd9a0"), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); scene.add(pts);
  return { pts, base, pos };
})();
const dustIn = (() => {
  const N = 260, pos = new Float32Array(N * 3), base = [];
  const rr = mulberry32(778);
  for (let i = 0; i < N; i++) base.push([lampPos.x + (rr() - 0.5) * 3.2, FL + 0.6 + rr() * 2.0, lampPos.z + (rr() - 0.5) * 2.6 + 0.6, rr() * 6.28, 0.1 + rr() * 0.3]);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: 0.012, map: texSoft, color: col("#ffcf8f"), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); scene.add(pts);
  return { pts, base, pos };
})();

// ---------- camera path ----------
// keys: time, position, look target, fov
const KEYS = [
  [0.0, [14.5, 6.6, 33.0], [-0.5, 4.6, 0.0], 38],
  [1.5, [7.2, 3.8, 19.0], [0.0, 2.6, 1.0], 38],
  [2.9, [1.6, 2.15, 9.2], [0.0, 1.85, 2.5], 40],
  [3.65, [0.05, 1.95, 5.6], [0.0, 1.8, 0.0], 44],
  [4.25, [0.0, 1.9, 3.2], [-0.25, 1.55, -1.5], 50],
  [5.2, [0.28, 1.86, 1.55], [-0.5, 1.35, -1.2], 52],
  [6.6, [-0.05, 1.82, 1.05], [-0.62, 1.3, -1.1], 52],
  [7.35, [0.0, 1.9, 2.6], [-0.4, 1.4, -1.0], 50],
  [8.05, [0.0, 1.98, 5.2], [0.0, 1.7, 0.0], 44],
  [9.6, [-3.0, 2.8, 11.5], [0.1, 1.6, 0.5], 40],
  [11.6, [-10.5, 5.2, 22.5], [0.3, 1.2, 0.5], 38],
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[1])), false, "catmullrom", 0.5);
const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[2])), false, "catmullrom", 0.5);
// monotone cubic (Fritsch–Carlson) mapping time -> curve parameter
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0] * 0.25; m[n - 1] = d[n - 2] * 0.6;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
const tParam = monotone(KEYS.map((k) => k[0]), KEYS.map((_, i) => i / (KEYS.length - 1)));
const fovAt = monotone(KEYS.map((k) => k[0]), KEYS.map((k) => k[3]));
const _p = new THREE.Vector3(), _t = new THREE.Vector3();

// ---------- post ----------
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.32, 0.5, 1.05);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
      // gentle filmic split-tone: warm highlights, cool-teal shadows
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c*c*(3.0-2.0*c), 0.2);
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(vec3(l), c, 1.12);
      c = mix(c, c*vec3(0.92,0.98,1.06), (1.0-smoothstep(0.0,0.45,l))*0.35);
      c = mix(c, c*vec3(1.05,1.0,0.93), smoothstep(0.5,1.0,l)*0.3);
      vec2 q = vUv - 0.5; q.x *= uRes.x/uRes.y;
      float v = smoothstep(1.05, 0.35, length(q));
      c *= mix(0.72, 1.0, v);
      float g = h(floor(vUv*uRes) + fract(uTime*7.31)*113.0) - 0.5;
      c += g*0.028;
      gl_FragColor = vec4(c,1.0); }`,
});
composer.addPass(grade);

// ---------- render at t ----------
const DEBUG = window.__HF_DEBUG_CAMS || null;
function renderAt(t) {
  const u = Math.min(1, Math.max(0, tParam(t)));
  posCurve.getPoint(u, _p); tgtCurve.getPoint(u, _t);
  if (DEBUG) { const k = DEBUG[Math.min(DEBUG.length - 1, Math.floor(t))]; _p.set(...k[0]); _t.set(...k[1]); }
  camera.position.copy(_p);
  camera.lookAt(_t);
  camera.fov = fovAt(t);
  camera.updateProjectionMatrix();
  grassUniforms.uTime.value = t;
  grade.uniforms.uTime.value = t;
  // smoke
  const top = new THREE.Vector3(2.3, RIDGE + 1.15, -0.9);
  smoke.forEach((s, i) => {
    const age = (t * 0.16 + i / smoke.length) % 1;
    s.position.set(top.x + age * 2.6 + Math.sin(i * 3 + t * 0.5) * 0.15 * age, top.y + age * 3.4, top.z + age * 0.8);
    const sc = 0.5 + age * 2.6; s.scale.set(sc, sc, 1);
    s.material.opacity = 0.22 * Math.sin(Math.PI * Math.min(1, age * 1.2)) ;
    s.material.rotation = i + age;
  });
  // dust
  for (const D of [dustOut, dustIn]) {
    D.base.forEach(([x, y, z, ph, sp], i) => {
      D.pos[i * 3] = x + Math.sin(t * sp + ph) * 0.3;
      D.pos[i * 3 + 1] = y + Math.sin(t * sp * 0.7 + ph * 2) * 0.2 + t * 0.02;
      D.pos[i * 3 + 2] = z + Math.cos(t * sp * 0.8 + ph) * 0.3;
    });
    D.pts.geometry.attributes.position.needsUpdate = true;
  }
  composer.render();
}

// shadows are static (sun fixed, scene static) except grass sway (receivers only) -> bake once
renderer.shadowMap.needsUpdate = true;
renderAt(0);
renderer.shadowMap.needsUpdate = false;

window.__hfScene = { renderAt, camera, scene };
let last = window.__hfLastT ?? 0;
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(last);
window.__hfResolveScene && window.__hfResolveScene();
