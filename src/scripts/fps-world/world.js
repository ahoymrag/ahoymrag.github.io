import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initPortals, updatePortalProximity, animatePortals } from './portals.js';
import { initParticles, tickParticles } from './particles.js';

// ============================================================================
// SCENE STATE
// ============================================================================

let scene, camera, renderer, controls;
let composer = null;      // optional — null if postprocessing setup fails
let useComposer = false;  // graceful fallback flag
let clock, delta;
let portalsGroup;
let activePortalURL = null;
let animationRunning = false;
let animationFrameId = null;
let easterPortalAdded = false;
let waterMat = null;
let waterAnimStartTime = null;

// Dawn state
let sky = null;
let sunLight = null;
let godRays = [];
let mistPlanes = [];
let dawnTime = 0;
const DAWN_SPEED = 0.004;
const SUN_AZIMUTH_DEG = 45;

// Movement
const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
const MOVE_SPEED = 8.0;
const SPRINT_MULTIPLIER = 1.5;
const BOUNDARY_RADIUS = 28;

let jumpVelocity = 0;
const GRAVITY = 25;
const JUMP_POWER = 15;
const EYE_HEIGHT = 1.7;
let isGrounded = true;
let screenShakeIntensity = 0;
let jumpsRemaining = 2;

let audioContext = null;

let isSliding = false;
const SLIDE_EYE_HEIGHT = 1.2;
const SLIDE_SPEED_MULTIPLIER = 2.0;
let targetEyeHeight = EYE_HEIGHT;
let currentEyeHeight = EYE_HEIGHT;
const EYE_HEIGHT_LERP_SPEED = 0.15;

let lastSprintParticleTime = 0;
const SPRINT_PARTICLE_INTERVAL = 0.1;

let activeParticles = [];
const MAX_PARTICLES = 200;

// ============================================================================
// WEBGL DETECTION & LAZY INIT
// ============================================================================

function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) { return false; }
}

const isMobile = /Mobi|Android|iPhone|iPad|tablet/i.test(navigator.userAgent);
console.log('[Forest World] WebGL supported:', isWebGLSupported(), 'isMobile:', isMobile);

if (!isWebGLSupported() || isMobile) {
  console.info('[Forest World] WebGL unavailable or mobile — static fallback.');
} else {
  window.addEventListener('ag:enterFPS', () => {
    try { initFPSWorld(); }
    catch (err) { console.error('[Forest World] Init error:', err); showFallbackError(err.message); }
  }, { once: true });
}

// ============================================================================
// AUDIO
// ============================================================================

function initAudio() {
  if (audioContext) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { audioContext = new AC(); } catch (e) { /* silent */ }
}

function playTone(freq, freqEnd, duration, volume = 0.25) {
  if (!audioContext) return;
  try {
    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t); osc.stop(t + duration);
  } catch (e) { /* silent */ }
}

function playJumpSound()  { playTone(200, 400, 0.1, 0.3); }
function playLandSound()  { playTone(100, null, 0.15, 0.2); }
function playSlideSound() { playTone(300, 100, 0.15, 0.25); }

// ============================================================================
// PROGRESS
// ============================================================================

function updateProgress(pct) {
  const bar = document.getElementById('fps-progress-bar');
  const txt = document.getElementById('fps-progress-text');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = pct + '%';
}

// ============================================================================
// INIT
// ============================================================================

function initFPSWorld() {
  console.log('[Forest World] Initializing...');
  updateProgress(5);

  const root   = document.getElementById('fps-world-root');
  const canvas = document.getElementById('fps-canvas');
  if (!root || !canvas) throw new Error('DOM elements missing');

  root.style.display = 'block';
  const loadIndicator = document.getElementById('fps-load-indicator');
  if (loadIndicator) loadIndicator.style.display = 'block';

  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const input  = document.querySelector('.centered-input');
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (input)  input.style.display  = 'none';

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0f05);
  scene.fog = new THREE.FogExp2(0xd4641a, 0.014);

  // Camera
  updateProgress(15);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, EYE_HEIGHT, 0);
  currentEyeHeight = EYE_HEIGHT;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const W = Math.max(window.innerWidth, 320);
  const H = Math.max(window.innerHeight, 240);
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  updateProgress(25);

  canvas.addEventListener('webglcontextlost',     e => { e.preventDefault(); console.warn('[Forest World] Context lost'); });
  canvas.addEventListener('webglcontextrestored', () => console.log('[Forest World] Context restored'));

  // Post-processing — optional, never crashes world if it fails
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 1.1, 0.55, 0.32));
    composer.addPass(new OutputPass());
    useComposer = true;
    console.log('[Forest World] Bloom post-processing enabled');
  } catch (e) {
    console.warn('[Forest World] Post-processing unavailable, using direct render:', e.message);
    composer = null;
    useComposer = false;
  }

  // Lighting
  updateProgress(35);
  sunLight = new THREE.DirectionalLight(0xff6a00, 0.4);
  sunLight.position.set(60, 8, 60);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -80; sunLight.shadow.camera.right = 80;
  sunLight.shadow.camera.top  =  80; sunLight.shadow.camera.bottom = -80;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x3d1a00, 1.2));
  scene.add(new THREE.HemisphereLight(0xff7a20, 0x1a0800, 0.5));

  // World
  updateProgress(45);
  addDawnSky();    // optional — won't crash if Sky fails
  buildGround();
  buildWater();
  updateProgress(60);
  buildForestTrees();

  updateProgress(75);
  portalsGroup = initPortals(scene);
  updateProgress(85);
  initParticles(scene);

  // Controls
  controls = new PointerLockControls(camera, document.body);
  scene.add(controls.object);
  clock = new THREE.Clock();

  bindUIEvents();
  bindKeys();
  window.addEventListener('resize', onResize);
  window.addEventListener('ag:easterEgg', onEasterEgg);

  updateProgress(100);
  console.log('[Forest World] Ready');

  setTimeout(() => {
    if (loadIndicator) loadIndicator.style.display = 'none';
    const ss = document.getElementById('fps-start-screen');
    if (ss) ss.style.display = 'flex';
  }, 300);
}

function showFallbackError(detail) {
  const root = document.getElementById('fps-world-root');
  if (root) root.style.display = 'none';

  ['header', 'footer'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = '';
  });
  const inp = document.querySelector('.centered-input');
  if (inp) inp.style.display = '';

  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.92);color:#fff;padding:2rem;border-radius:8px;max-width:480px;text-align:center;font-family:monospace;z-index:99999;';
  div.innerHTML = `
    <h2 style="margin:0 0 0.8rem;color:#ff7a50">Forest path blocked</h2>
    <p style="opacity:.7;margin:0 0 1.5rem;font-size:.85rem">${detail || 'WebGL or loading issue.'}</p>
    <button id="err-retry" style="background:#d4641a;color:#fff;border:none;padding:.7rem 1.4rem;border-radius:4px;cursor:pointer;font-family:monospace;margin-right:.5rem">Retry</button>
    <button id="err-back"  style="background:transparent;color:#fff;border:1px solid #555;padding:.7rem 1.4rem;border-radius:4px;cursor:pointer;font-family:monospace">Back to site</button>
  `;
  document.body.appendChild(div);
  document.getElementById('err-retry').onclick = () => { div.remove(); initFPSWorld(); };
  document.getElementById('err-back').onclick  = () => div.remove();
}

// ============================================================================
// DAWN ATMOSPHERE
// ============================================================================

function getSunVector(elevDeg) {
  const phi   = THREE.MathUtils.degToRad(90 - elevDeg);
  const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

function addDawnSky() {
  try {
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    const u = sky.material.uniforms;
    u['turbidity'].value        = 8;
    u['rayleigh'].value         = 3.0;
    u['mieCoefficient'].value   = 0.01;
    u['mieDirectionalG'].value  = 0.9;
    u['sunPosition'].value.copy(getSunVector(1.2));
    console.log('[Forest World] Sky initialized');
  } catch (e) {
    console.warn('[Forest World] Sky failed, using fallback:', e.message);
    sky = null;
    // Simple dark gradient dome fallback
    const geo = new THREE.SphereGeometry(440, 32, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a0c04, side: THREE.BackSide });
    scene.add(new THREE.Mesh(geo, mat));
  }

  addGodRays();
  addGroundMist();
  addHorizonGlow();
}

function addGodRays() {
  const azRad = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const bx = Math.cos(azRad), bz = Math.sin(azRad);

  for (let i = 0; i < 9; i++) {
    const len = 90 + Math.random() * 70;
    const wid = 5 + Math.random() * 9;
    const geo = new THREE.PlaneGeometry(wid, len);
    geo.translate(0, len * 0.5, 0);
    const baseOp = 0.012 + Math.random() * 0.022;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.65, 0.25),
      transparent: true, opacity: baseOp,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ray = new THREE.Mesh(geo, mat);
    const spread = 22;
    ray.position.set(
      bx * 38 + (Math.random() - 0.5) * spread,
      2 + Math.random() * 6,
      bz * 38 + (Math.random() - 0.5) * spread
    );
    ray.lookAt((Math.random() - 0.5) * 10, -30, (Math.random() - 0.5) * 10);
    ray.rotateX(Math.PI / 2 + (Math.random() - 0.5) * 0.4);
    ray.rotateZ((Math.random() - 0.5) * 0.6);
    scene.add(ray);
    godRays.push({ mesh: ray, baseOp, phase: Math.random() * Math.PI * 2 });
  }
}

function addGroundMist() {
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.PlaneGeometry(35 + Math.random() * 45, 20 + Math.random() * 30);
    const baseOp = 0.06 + Math.random() * 0.08;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.75, 0.5),
      transparent: true, opacity: baseOp,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    const bx = (Math.random() - 0.5) * 50;
    const bz = (Math.random() - 0.5) * 50;
    m.position.set(bx, 0.15 + Math.random() * 0.6, bz);
    m.userData = { baseOp, bx, bz, phase: Math.random() * Math.PI * 2, dx: (Math.random() - 0.5) * 0.4, dz: (Math.random() - 0.5) * 0.4 };
    scene.add(m);
    mistPlanes.push(m);
  }
}

function addHorizonGlow() {
  const az = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const geo = new THREE.PlaneGeometry(120, 30);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.4, 0.1), transparent: true, opacity: 0.08,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const glow = new THREE.Mesh(geo, mat);
  glow.position.set(Math.cos(az) * 30, 4, Math.sin(az) * 30);
  glow.lookAt(0, 4, 0);
  scene.add(glow);
}

// ============================================================================
// WORLD GEOMETRY
// ============================================================================

function buildGround() {
  const geo = new THREE.PlaneGeometry(120, 120, 30, 30);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const fade = Math.max(0, 1 - Math.sqrt(x*x + y*y) / 50);
    pos.setZ(i, (Math.random() - 0.5) * 1.4 * fade);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a1506, emissive: 0x3d1200, emissiveIntensity: 0.15, roughness: 1, flatShading: true });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 50, z = (Math.random() - 0.5) * 50, h = 0.3 + Math.random() * 0.8;
    const hues = [0.06, 0.09, 0.04, 0.7];
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, h, 4),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hues[Math.floor(Math.random()*4)], 0.7, 0.3), emissive: new THREE.Color().setHSL(0.07, 0.9, 0.15), emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5, flatShading: true })
    );
    shard.position.set(x, h/2, z);
    shard.rotation.y = Math.random() * Math.PI;
    shard.castShadow = true;
    scene.add(shard);
  }
}

function buildWater() {
  waterMat = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.02, metalness: 0.95, emissive: 0xff4400, emissiveIntensity: 0.5 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4, 15), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.01, 0);
  water.receiveShadow = true;
  scene.add(water);
  waterAnimStartTime = Date.now();
}

function buildForestTrees() {
  const positions = [[-15,-8],[-20,5],[-12,18],[-25,25],[15,-10],[22,8],[18,20],[28,28],[-5,-25],[8,-22],[20,-15],[-18,-20],[0,30],[12,-28],[-22,12]];
  const palettes  = [{ trunk: 0x1a0800, foliage: 0xff6600 }, { trunk: 0x120400, foliage: 0xff9933 }, { trunk: 0x0d0200, foliage: 0xcc3300 }, { trunk: 0x1a0d00, foliage: 0xffcc44 }];

  positions.forEach(([x, z]) => {
    const h = 10 + Math.random() * 5;
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, h, 5),
      new THREE.MeshStandardMaterial({ color: p.trunk, roughness: 0.95, flatShading: true })
    );
    trunk.position.set(x, h/2, z);
    trunk.castShadow = true;
    scene.add(trunk);

    [0.8, 0.55, 0.35].forEach((sc, tier) => {
      const ch = h * 0.55 * sc, cr = h * 0.45 * sc;
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(cr, ch, 6),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(p.foliage).multiplyScalar(0.35 + tier*0.15), emissive: new THREE.Color(p.foliage), emissiveIntensity: 0.12 + tier*0.08, roughness: 0.8, flatShading: true })
      );
      foliage.position.set(x, h*(0.5 + tier*0.25), z);
      foliage.castShadow = true;
      scene.add(foliage);
    });
  });
}

// ============================================================================
// INPUT
// ============================================================================

function bindKeys() {
  document.addEventListener('keydown', e => {
    initAudio();
    if (e.code === 'KeyW')  { keys.w = true;  updateKeyVisuals('W', true); }
    if (e.code === 'KeyA')  { keys.a = true;  updateKeyVisuals('A', true); }
    if (e.code === 'KeyS')  { keys.s = true;  updateKeyVisuals('S', true); }
    if (e.code === 'KeyD')  { keys.d = true;  updateKeyVisuals('D', true); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keys.shift = true; updateKeyVisuals('Shift', true); }
    if (e.code === 'Space') {
      e.preventDefault();
      if (jumpsRemaining > 0) {
        jumpVelocity = jumpsRemaining === 2 ? JUMP_POWER : JUMP_POWER * 0.8;
        jumpsRemaining--;
        isGrounded = false;
        playJumpSound();
      }
    }
    if (e.code === 'KeyE' && activePortalURL) window.location.href = activePortalURL;
  });

  document.addEventListener('keyup', e => {
    if (e.code === 'KeyW')  { keys.w = false;  updateKeyVisuals('W', false); }
    if (e.code === 'KeyA')  { keys.a = false;  updateKeyVisuals('A', false); }
    if (e.code === 'KeyS')  { keys.s = false;  updateKeyVisuals('S', false); }
    if (e.code === 'KeyD')  { keys.d = false;  updateKeyVisuals('D', false); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keys.shift = false; updateKeyVisuals('Shift', false); }
    if (e.code === 'Space') keys.space = false;
  });
}

function updateKeyVisuals(key, active) {
  const el = document.querySelector(`[data-key="${key}"]`);
  if (el) el.classList.toggle('active', active);
}

function bindUIEvents() {
  const startBtn  = document.getElementById('fps-start-btn');
  const resumeBtn = document.getElementById('fps-resume-btn');
  const exitLink  = document.getElementById('fps-exit-link');

  function tryLock() {
    document.body.focus();
    controls.lock();
  }

  if (startBtn)  startBtn.addEventListener('click',  tryLock);
  if (resumeBtn) resumeBtn.addEventListener('click', tryLock);
  if (exitLink)  exitLink.addEventListener('click',  e => { e.preventDefault(); exitFPSMode(); });

  // Surface pointer-lock failures so the user knows what happened
  document.addEventListener('pointerlockerror', () => {
    console.warn('[Forest World] Pointer lock denied');
    const ss = document.getElementById('fps-start-screen');
    const pp = document.getElementById('fps-paused-screen');
    // Show a small hint under whichever screen is visible
    [ss, pp].forEach(panel => {
      if (!panel || panel.style.display === 'none') return;
      let hint = panel.querySelector('.fps-lock-error');
      if (!hint) {
        hint = document.createElement('p');
        hint.className = 'fps-lock-error';
        hint.style.cssText = 'color:#ff9966;font-size:.75rem;margin-top:.75rem;font-family:monospace;';
        panel.querySelector('.fps-start-card').appendChild(hint);
      }
      hint.textContent = 'Click "Enter the Forest" again to lock controls.';
    });
  });

  controls.addEventListener('lock', () => {
    document.getElementById('fps-load-indicator').style.display  = 'none';
    document.getElementById('fps-start-screen').style.display    = 'none';
    document.getElementById('fps-paused-screen').style.display   = 'none';
    document.getElementById('fps-hud').style.display             = 'block';
    if (!animationRunning) startLoop();  // start rendering only once locked
  });

  controls.addEventListener('unlock', () => {
    document.getElementById('fps-hud').style.display           = 'none';
    document.getElementById('fps-paused-screen').style.display = 'flex';
  });
}

function exitFPSMode() {
  controls.unlock();
  if (animationRunning) { cancelAnimationFrame(animationFrameId); animationRunning = false; }

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    scene.remove(p);
    p.geometry?.dispose();
    p.material?.dispose();
  }
  activeParticles = [];

  document.getElementById('fps-world-root').style.display = 'none';
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const input  = document.querySelector('.centered-input');
  if (header) header.style.display = '';
  if (footer) footer.style.display = '';
  if (input)  input.style.display  = '';
}

// ============================================================================
// GAMEPLAY FEEDBACK
// ============================================================================

function applyScreenShake() {
  if (screenShakeIntensity <= 0) return;
  camera.position.x += (Math.random() - 0.5) * screenShakeIntensity;
  camera.position.z += (Math.random() - 0.5) * screenShakeIntensity;
  screenShakeIntensity *= 0.85;
  if (screenShakeIntensity < 0.01) screenShakeIntensity = 0;
}

function createLandingBurst(position) {
  if (activeParticles.length >= MAX_PARTICLES) return;
  const count = Math.min(8, MAX_PARTICLES - activeParticles.length);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.6 }));
    p.position.copy(position);
    p.userData = { velocity: new THREE.Vector3(Math.cos(angle)*0.5, 2, Math.sin(angle)*0.5), lifetime: 0.5, age: 0 };
    scene.add(p); activeParticles.push(p);
  }
}

function createSprintTrail(position) {
  if (activeParticles.length >= MAX_PARTICLES) return;
  const count = Math.min(3, MAX_PARTICLES - activeParticles.length);
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), new THREE.MeshBasicMaterial({ color: isSliding ? 0xffcc00 : 0xff8800, transparent: true, opacity: 0.5 }));
    p.position.set(position.x + (Math.random()-0.5)*0.4, position.y-0.5, position.z + (Math.random()-0.5)*0.4);
    p.userData = { velocity: new THREE.Vector3((Math.random()-0.5)*0.5, 0.5, (Math.random()-0.5)*0.5), lifetime: 0.3, age: 0 };
    scene.add(p); activeParticles.push(p);
  }
}

function tickMovement() {
  if (!controls.isLocked) return;
  const pos = controls.object.position;
  const moving = keys.w || keys.a || keys.s || keys.d;

  jumpVelocity -= GRAVITY * delta;
  pos.y += jumpVelocity * delta;

  if (pos.y <= EYE_HEIGHT && jumpVelocity < 0) {
    if (Math.abs(jumpVelocity) > 3) { screenShakeIntensity = 0.15; createLandingBurst(pos); playLandSound(); }
    pos.y = EYE_HEIGHT; jumpVelocity = 0; isGrounded = true; jumpsRemaining = 2;
  } else if (pos.y > EYE_HEIGHT + 0.1) {
    isGrounded = false;
  }

  const shouldSlide = keys.shift && moving && isGrounded;
  if (shouldSlide && !isSliding)  { isSliding = true;  targetEyeHeight = SLIDE_EYE_HEIGHT; }
  if (!shouldSlide && isSliding)  { isSliding = false; targetEyeHeight = EYE_HEIGHT; }
  currentEyeHeight += (targetEyeHeight - currentEyeHeight) * EYE_HEIGHT_LERP_SPEED;

  const speed = MOVE_SPEED * (isSliding ? SLIDE_SPEED_MULTIPLIER : keys.shift ? SPRINT_MULTIPLIER : 1) * delta;
  if (keys.w) controls.moveForward(speed);
  if (keys.s) controls.moveForward(-speed);
  if (keys.a) controls.moveRight(-speed);
  if (keys.d) controls.moveRight(speed);

  const flat = Math.sqrt(pos.x*pos.x + pos.z*pos.z);
  if (flat > BOUNDARY_RADIUS) {
    const ang = Math.atan2(pos.z, pos.x);
    pos.x = Math.cos(ang) * BOUNDARY_RADIUS;
    pos.z = Math.sin(ang) * BOUNDARY_RADIUS;
  }
  if (pos.y < EYE_HEIGHT) { pos.y = EYE_HEIGHT; jumpVelocity = 0; }
  pos.y += currentEyeHeight - EYE_HEIGHT;
}

// ============================================================================
// DAWN ANIMATION
// ============================================================================

function tickDawn(t) {
  dawnTime = Math.min(dawnTime + delta * DAWN_SPEED, 1.0);

  if (sky) {
    const elev = 1.2 + dawnTime * 20.8;
    sky.material.uniforms['sunPosition'].value.copy(getSunVector(elev));
    sky.material.uniforms['rayleigh'].value        = 3.0 - dawnTime * 1.2;
    sky.material.uniforms['turbidity'].value        = 8   - dawnTime * 4;
    sky.material.uniforms['mieCoefficient'].value   = 0.01 - dawnTime * 0.005;
  }

  if (sunLight) {
    sunLight.color.lerpColors(new THREE.Color(0xff6a00), new THREE.Color(0xfff5cc), dawnTime);
    sunLight.intensity = 0.4 + dawnTime * 1.2;
    sunLight.position.copy(getSunVector(1.2 + dawnTime * 20.8).multiplyScalar(100));
  }

  if (scene.fog) {
    scene.fog.color.lerpColors(new THREE.Color(0xd4641a), new THREE.Color(0xf0c878), dawnTime);
    renderer.setClearColor(scene.fog.color);
  }

  for (const r of godRays) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.25 + r.phase);
    r.mesh.material.opacity = r.baseOp * pulse * (0.4 + dawnTime * 0.8);
    r.mesh.material.color.setRGB(1.0, 0.55 + dawnTime * 0.2, 0.1 + dawnTime * 0.05);
  }

  for (const m of mistPlanes) {
    const ud = m.userData;
    m.position.x = ud.bx + Math.sin(t * ud.dx + ud.phase) * 4;
    m.position.z = ud.bz + Math.cos(t * ud.dz + ud.phase) * 3;
    const burnOff = dawnTime > 0.7 ? 1 - (dawnTime - 0.7) / 0.3 : 1.0;
    m.material.opacity = ud.baseOp * burnOff * (0.7 + 0.3 * Math.sin(t * 0.15));
  }

  if (waterMat && waterAnimStartTime) {
    const e = (Date.now() - waterAnimStartTime) * 0.0001;
    waterMat.emissiveIntensity = 0.3 + dawnTime * 0.5 + Math.sin(e * 3) * 0.1;
    waterMat.emissive.lerpColors(new THREE.Color(0xff4400), new THREE.Color(0xffcc33), dawnTime);
  }
}

// ============================================================================
// LOOP
// ============================================================================

function startLoop() {
  animationRunning = true;
  clock.start();
  loop();
}

function loop() {
  animationFrameId = requestAnimationFrame(loop);
  delta = clock.getDelta();
  if (!isFinite(delta) || delta < 0 || delta > 0.2) delta = 0.016;
  delta = Math.min(delta, 0.05);

  tickMovement();
  applyScreenShake();

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.userData.age += delta;
    const prog = p.userData.age / p.userData.lifetime;
    if (prog >= 1) {
      scene.remove(p); p.geometry?.dispose(); p.material?.dispose();
      activeParticles.splice(i, 1);
    } else {
      p.position.addScaledVector(p.userData.velocity, delta);
      p.userData.velocity.y -= GRAVITY * delta;
      if (p.material) p.material.opacity = 0.6 * (1 - prog);
    }
  }

  const moving = keys.w || keys.a || keys.s || keys.d;
  if ((keys.shift || isSliding) && moving && isGrounded) {
    lastSprintParticleTime += delta;
    if (lastSprintParticleTime > SPRINT_PARTICLE_INTERVAL) { createSprintTrail(camera.position); lastSprintParticleTime = 0; }
  } else { lastSprintParticleTime = 0; }

  activePortalURL = updatePortalProximity(camera, document.getElementById('fps-portal-tooltip'), document.getElementById('fps-portal-name'));
  animatePortals();

  const t = performance.now() * 0.001;
  tickParticles(t);
  tickDawn(t);

  // Render — prefer composer (bloom), fall back to direct render
  if (useComposer && composer) {
    try { composer.render(); }
    catch (e) { useComposer = false; renderer.render(scene, camera); }
  } else {
    renderer.render(scene, camera);
  }
}

function onResize() {
  const W = Math.max(window.innerWidth, 320), H = Math.max(window.innerHeight, 240);
  if (!isFinite(W) || !isFinite(H)) return;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  try {
    renderer.setSize(W, H);
    if (useComposer && composer) composer.setSize(W, H);
  } catch (e) { /* ignore */ }
}

// ============================================================================
// EASTER EGG
// ============================================================================

function onEasterEgg() {
  if (easterPortalAdded) return;
  easterPortalAdded = true;
  const DATA = { label: '1153', url: './projects/index.html', color: 0xff1493 };
  const pos  = new THREE.Vector3(0, 0, 0);

  const torus = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.18, 12, 48), new THREE.MeshStandardMaterial({ color: DATA.color, emissive: DATA.color, emissiveIntensity: 2.0, roughness: 0.2, metalness: 0.8 }));
  torus.position.y = 2.5; torus.rotateX(Math.PI / 2);
  scene.add(torus);

  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ color: DATA.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  disc.position.copy(torus.position); disc.rotation.copy(torus.rotation);
  scene.add(disc);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), new THREE.MeshStandardMaterial({ color: DATA.color, emissive: DATA.color, emissiveIntensity: 1.0 }));
  pillar.position.y = 1.25; scene.add(pillar);

  const label = makeLabelSprite(DATA.label, DATA.color);
  label.position.y = 5.5; label.scale.set(8, 2, 1); scene.add(label);

  const light = new THREE.PointLight(DATA.color, 2.0, 25);
  light.position.y = 2.5; scene.add(light);

  scene.userData.easterPortal = { position: pos, data: DATA, torus, light };
}

function makeLabelSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.roundRect(8, 8, 496, 112, 20); ctx.fill();
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = 'bold 56px Barlow, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 256, 64);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
}
