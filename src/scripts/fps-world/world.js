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

let scene, camera, renderer, controls, composer;
let clock, delta;
let portalsGroup;
let activePortalURL = null;
let animationRunning = false;
let animationFrameId = null;
let easterPortalAdded = false;
let waterMat = null;
let waterAnimStartTime = null;

// Dawn atmospheric state
let sky = null;
let sunLight = null;
let godRays = [];
let mistPlanes = [];
let dawnTime = 0; // 0 = pre-dawn glow, 1 = golden morning
const DAWN_SPEED = 0.004; // progresses per second of gameplay
const SUN_AZIMUTH_DEG = 45; // southeast

// Key state for movement
const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
const MOVE_SPEED = 8.0;
const SPRINT_MULTIPLIER = 1.5;
const BOUNDARY_RADIUS = 28;

// Jump and gravity
let jumpVelocity = 0;
const GRAVITY = 25;
const JUMP_POWER = 15;
const EYE_HEIGHT = 1.7;
let isGrounded = true;
let screenShakeIntensity = 0;
let jumpsRemaining = 2;

// Audio
let audioContext = null;

// Slide mechanic
let isSliding = false;
const SLIDE_EYE_HEIGHT = 1.2;
const SLIDE_SPEED_MULTIPLIER = 2.0;
let targetEyeHeight = EYE_HEIGHT;
let currentEyeHeight = EYE_HEIGHT;
const EYE_HEIGHT_LERP_SPEED = 0.15;

// Sprint particles
let lastSprintParticleTime = 0;
const SPRINT_PARTICLE_INTERVAL = 0.1;

// Particle tracking
let activeParticles = [];
const MAX_PARTICLES = 200;

// ============================================================================
// WEBGL DETECTION & LAZY INITIALIZATION
// ============================================================================

function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

const isMobile = /Mobi|Android|iPhone|iPad|tablet/i.test(navigator.userAgent);

console.log('[Forest World] WebGL supported:', isWebGLSupported(), 'isMobile:', isMobile);

if (!isWebGLSupported() || isMobile) {
  console.info('[Forest World] WebGL unavailable or mobile — using static fallback.');
} else {
  // Only initialize when the user explicitly chooses the 3D mode
  window.addEventListener('ag:enterFPS', () => {
    try {
      initFPSWorld();
    } catch (err) {
      console.error('[Forest World] Initialization error:', err);
      showFallbackError();
    }
  }, { once: true });
}

// ============================================================================
// AUDIO SYNTHESIS
// ============================================================================

function initAudio() {
  if (audioContext) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    console.warn('[Forest World] Web Audio API not supported');
    return;
  }

  try {
    audioContext = new AudioContextClass();
  } catch (e) {
    console.warn('[Forest World] Audio context creation failed:', e);
  }
}

function playJumpSound() {
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    console.warn('[Forest World] Jump sound failed:', e);
  }
}

function playLandSound() {
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(100, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn('[Forest World] Land sound failed:', e);
  }
}

function playSprintSound() {
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(50, now);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn('[Forest World] Sprint sound failed:', e);
  }
}

function playSlideSound() {
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn('[Forest World] Slide sound failed:', e);
  }
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

function updateProgress(percent) {
  const bar = document.getElementById('fps-progress-bar');
  const text = document.getElementById('fps-progress-text');
  if (bar) bar.style.width = percent + '%';
  if (text) text.textContent = percent + '%';
  console.log(`[Forest World] Progress: ${percent}%`);
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

function initFPSWorld() {
  try {
    console.log('[Forest World] Starting initialization...');
    updateProgress(5);

    const root = document.getElementById('fps-world-root');
    const canvas = document.getElementById('fps-canvas');

    if (!root || !canvas) {
      throw new Error('Required DOM elements missing (fps-world-root or fps-canvas)');
    }

    root.style.display = 'block';

    const loadIndicator = document.getElementById('fps-load-indicator');
    loadIndicator.style.display = 'block';

    document.querySelector('header').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.querySelector('.centered-input').style.display = 'none';

    // --- SCENE ---
    console.log('[Forest World] Creating scene...');
    scene = new THREE.Scene();

    // Pre-dawn: warm amber mist at ground level
    scene.background = new THREE.Color(0x1a0f05);
    scene.fog = new THREE.FogExp2(0xd4641a, 0.014);

    // --- CAMERA ---
    updateProgress(15);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, EYE_HEIGHT, 0);
    currentEyeHeight = EYE_HEIGHT;

    // --- RENDERER ---
    console.log('[Forest World] Creating renderer...');
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      console.log('[Forest World] Renderer created successfully');
    } catch (e) {
      console.error('[Forest World] Renderer creation failed:', e);
      throw e;
    }

    updateProgress(25);

    const width = Math.max(window.innerWidth, 320);
    const height = Math.max(window.innerHeight, 240);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[Forest World] WebGL context lost');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('[Forest World] WebGL context restored');
    });

    try {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (e) {
      console.warn('[Forest World] Shadow map configuration partial:', e);
    }

    // --- POST-PROCESSING ---
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.2,  // strength — strong bloom for god rays and emissives
      0.6,  // radius
      0.3   // threshold — low so dawn glow blooms
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    console.log('[Forest World] Renderer and post-processing configured');

    // --- LIGHTING ---
    updateProgress(35);

    // Pre-dawn directional light: deep orange from low southeast
    sunLight = new THREE.DirectionalLight(0xff6a00, 0.4);
    sunLight.position.set(60, 8, 60); // low southeast angle
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // Warm ambient: pre-dawn sky glow bouncing from ground
    const ambientLight = new THREE.AmbientLight(0x3d1a00, 1.2);
    scene.add(ambientLight);

    // Horizon fill light: soft warm from east
    const fillLight = new THREE.HemisphereLight(0xff7a20, 0x1a0800, 0.5);
    scene.add(fillLight);

    // --- WORLD GEOMETRY ---
    updateProgress(45);
    addDawnSky();
    buildGround();
    buildWater();

    updateProgress(60);
    buildForestTrees();

    // --- PORTALS ---
    updateProgress(75);
    portalsGroup = initPortals(scene);

    // --- PARTICLES ---
    updateProgress(85);
    initParticles(scene);

    // --- CONTROLS ---
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.object);

    // --- CLOCK ---
    clock = new THREE.Clock();

    // --- EVENT LISTENERS ---
    bindUIEvents();
    bindKeys();
    window.addEventListener('resize', onResize);
    window.addEventListener('ag:easterEgg', onEasterEgg);

    updateProgress(100);
    console.log('[Forest World] Initialization completed');

    setTimeout(() => {
      loadIndicator.style.display = 'none';
      document.getElementById('fps-start-screen').style.display = 'flex';
    }, 300);

  } catch (error) {
    console.error('[Forest World] Initialization failed:', error);
    showFallbackError();
  }
}

function showFallbackError() {
  const root = document.getElementById('fps-world-root');
  if (root) root.style.display = 'none';

  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const input = document.querySelector('.centered-input');
  if (header) header.style.display = '';
  if (footer) footer.style.display = '';
  if (input) input.style.display = '';

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.9); color: #fff;
    padding: 2rem; border-radius: 8px;
    max-width: 500px; text-align: center;
    font-family: monospace; z-index: 9999;
  `;
  errorDiv.innerHTML = `
    <h2 style="margin:0 0 1rem 0;color:#ff6b6b;">The forest path is blocked...</h2>
    <p style="margin:0 0 1.5rem 0;opacity:0.8;">
      The 3D explorer requires WebGL support or encountered a loading issue.
    </p>
    <button id="error-retry-btn" style="background:#76c043;color:#000;border:none;padding:0.75rem 1.5rem;border-radius:4px;cursor:pointer;font-weight:bold;margin-right:0.5rem;font-family:monospace;">Retry</button>
    <button id="error-back-btn" style="background:transparent;color:#fff;border:1px solid #666;padding:0.75rem 1.5rem;border-radius:4px;cursor:pointer;font-family:monospace;">Back to site</button>
  `;
  document.body.appendChild(errorDiv);
  document.getElementById('error-retry-btn').addEventListener('click', () => {
    errorDiv.remove();
    initFPSWorld();
  });
  document.getElementById('error-back-btn').addEventListener('click', () => {
    errorDiv.remove();
  });
}

// ============================================================================
// DAWN ATMOSPHERE
// ============================================================================

function getSunVector(elevationDeg) {
  const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
  const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const v = new THREE.Vector3();
  v.setFromSphericalCoords(1, phi, theta);
  return v;
}

function addDawnSky() {
  // THREE.Sky: physically-based Preetham atmospheric model
  sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  const u = sky.material.uniforms;
  u['turbidity'].value = 8;        // atmospheric haze
  u['rayleigh'].value = 3.0;       // blue sky scattering — high for vivid dawn
  u['mieCoefficient'].value = 0.01; // mist/haze particles
  u['mieDirectionalG'].value = 0.9; // strong forward scatter → bright halo around sun

  // Start sun just grazing the horizon (1.2°)
  const sunVec = getSunVector(1.2);
  u['sunPosition'].value.copy(sunVec);

  addGodRays();
  addGroundMist();
  addHorizonGlow();
}

function addGodRays() {
  // Translucent planes with additive blending fan out from sun direction
  const count = 9;
  const azRad = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const sunBaseX = Math.cos(azRad);
  const sunBaseZ = Math.sin(azRad);

  for (let i = 0; i < count; i++) {
    const len = 90 + Math.random() * 70;
    const wid = 5 + Math.random() * 9;
    const geo = new THREE.PlaneGeometry(wid, len);
    // Offset geometry so the "top" of the plane is at origin (rays fan from sky down)
    geo.translate(0, len * 0.5, 0);

    const baseOpacity = 0.012 + Math.random() * 0.022;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.65, 0.25),
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ray = new THREE.Mesh(geo, mat);

    // Fan positions: cluster near sun direction but spread wide
    const spread = 22;
    const px = sunBaseX * 38 + (Math.random() - 0.5) * spread;
    const pz = sunBaseZ * 38 + (Math.random() - 0.5) * spread;
    const py = 2 + Math.random() * 6;
    ray.position.set(px, py, pz);

    // Tilt each ray slightly differently toward scene center
    ray.lookAt(
      (Math.random() - 0.5) * 10,
      -30,
      (Math.random() - 0.5) * 10
    );
    ray.rotateX(Math.PI / 2 + (Math.random() - 0.5) * 0.4);
    ray.rotateZ((Math.random() - 0.5) * 0.6);

    scene.add(ray);
    godRays.push({ mesh: ray, baseOpacity, phase: Math.random() * Math.PI * 2 });
  }
}

function addGroundMist() {
  // Layered translucent planes drifting at ground level
  const mistCount = 6;
  for (let i = 0; i < mistCount; i++) {
    const w = 35 + Math.random() * 45;
    const d = 20 + Math.random() * 30;
    const geo = new THREE.PlaneGeometry(w, d, 1, 1);
    const baseOpacity = 0.06 + Math.random() * 0.08;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.75, 0.5),
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const mist = new THREE.Mesh(geo, mat);
    mist.rotation.x = -Math.PI / 2;
    const bx = (Math.random() - 0.5) * 50;
    const bz = (Math.random() - 0.5) * 50;
    const by = 0.15 + Math.random() * 0.6;
    mist.position.set(bx, by, bz);
    mist.userData = { baseOpacity, bx, bz, by, phase: Math.random() * Math.PI * 2, driftX: (Math.random() - 0.5) * 0.4, driftZ: (Math.random() - 0.5) * 0.4 };
    scene.add(mist);
    mistPlanes.push(mist);
  }
}

function addHorizonGlow() {
  // A bright additive ring on the horizon in the sun's direction — dawn blush
  const azRad = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const hx = Math.cos(azRad) * 200;
  const hz = Math.sin(azRad) * 200;

  const geo = new THREE.PlaneGeometry(120, 30);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.4, 0.1),
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(geo, mat);
  glow.position.set(hx * 0.15, 4, hz * 0.15);
  glow.lookAt(0, 4, 0);
  scene.add(glow);
}

// ============================================================================
// WORLD GEOMETRY
// ============================================================================

function buildGround() {
  // Lo-poly faceted terrain — warm earthy dawn tones
  const SEG = 30;
  const groundGeo = new THREE.PlaneGeometry(120, 120, SEG, SEG);

  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const distFromCenter = Math.sqrt(x * x + y * y);
    const edgeFade = Math.max(0, 1 - distFromCenter / 50);
    pos.setZ(i, (Math.random() - 0.5) * 1.4 * edgeFade);
  }
  pos.needsUpdate = true;
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2a1506,      // deep burnt sienna
    emissive: 0x3d1200,
    emissiveIntensity: 0.15,
    roughness: 1.0,
    metalness: 0.0,
    flatShading: true,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Dawn-kissed stones: warm amber and rose quartz
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    const h = 0.3 + Math.random() * 0.8;
    const shardGeo = new THREE.ConeGeometry(0.15, h, 4);
    const hues = [0.06, 0.09, 0.04, 0.7]; // orange, amber, red-orange, violet accent
    const shardMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hues[Math.floor(Math.random() * hues.length)], 0.7, 0.3 + Math.random() * 0.15),
      emissive: new THREE.Color().setHSL(0.07, 0.9, 0.15),
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
      flatShading: true,
    });
    const shard = new THREE.Mesh(shardGeo, shardMat);
    shard.position.set(x, h / 2, z);
    shard.rotation.y = Math.random() * Math.PI;
    shard.castShadow = true;
    scene.add(shard);
  }
}

function buildWater() {
  // Golden dawn reflection pool
  const waterGeo = new THREE.PlaneGeometry(4, 15);
  waterMat = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    roughness: 0.02,
    metalness: 0.95,
    emissive: 0xff4400,
    emissiveIntensity: 0.5,
    normalScale: new THREE.Vector2(0.2, 0.2),
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.01, 0);
  water.receiveShadow = true;
  scene.add(water);
  waterAnimStartTime = Date.now();
}

function buildForestTrees() {
  const treePositions = [
    [-15, -8], [-20, 5], [-12, 18], [-25, 25],
    [15, -10], [22, 8], [18, 20], [28, 28],
    [-5, -25], [8, -22], [20, -15], [-18, -20],
    [0, 30], [12, -28], [-22, 12],
  ];

  // Dawn forest palette: silhouetted dark trunks, warm-lit foliage
  const treePalettes = [
    { trunk: 0x1a0800, foliage: 0xff6600 }, // dark / orange-lit
    { trunk: 0x120400, foliage: 0xff9933 }, // dark / amber
    { trunk: 0x0d0200, foliage: 0xcc3300 }, // near-black / deep red-orange
    { trunk: 0x1a0d00, foliage: 0xffcc44 }, // dark / golden
  ];

  treePositions.forEach(([x, z]) => {
    const treeHeight = 10 + Math.random() * 5;
    const scheme = treePalettes[Math.floor(Math.random() * treePalettes.length)];

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, treeHeight, 5);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: scheme.trunk,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, treeHeight / 2, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Foliage: 3 stacked cones, bright amber/orange on dawn side
    [0.8, 0.55, 0.35].forEach((scale, tier) => {
      const coneH = treeHeight * 0.55 * scale;
      const coneR = treeHeight * 0.45 * scale;
      const foliageGeo = new THREE.ConeGeometry(coneR, coneH, 6);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(scheme.foliage).multiplyScalar(0.35 + tier * 0.15),
        emissive: new THREE.Color(scheme.foliage),
        emissiveIntensity: 0.12 + tier * 0.08, // upper tiers glow brighter (catching dawn)
        roughness: 0.8,
        metalness: 0.0,
        flatShading: true,
      });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(x, treeHeight * (0.5 + tier * 0.25), z);
      foliage.castShadow = true;
      scene.add(foliage);
    });
  });
}

// ============================================================================
// CONTROLS & INPUT
// ============================================================================

function bindKeys() {
  document.addEventListener('keydown', e => {
    initAudio();

    if (e.code === 'KeyW') { keys.w = true; updateKeyVisuals('W', true); }
    if (e.code === 'KeyA') { keys.a = true; updateKeyVisuals('A', true); }
    if (e.code === 'KeyS') { keys.s = true; updateKeyVisuals('S', true); }
    if (e.code === 'KeyD') { keys.d = true; updateKeyVisuals('D', true); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.shift = true;
      updateKeyVisuals('Shift', true);
    }
    if (e.code === 'Space') {
      e.preventDefault();
      keys.space = true;
      if (jumpsRemaining > 0) {
        const jumpPower = jumpsRemaining === 2 ? JUMP_POWER : JUMP_POWER * 0.8;
        jumpVelocity = jumpPower;
        jumpsRemaining--;
        isGrounded = false;
        playJumpSound();
      }
    }
  });

  document.addEventListener('keyup', e => {
    if (e.code === 'KeyW') { keys.w = false; updateKeyVisuals('W', false); }
    if (e.code === 'KeyA') { keys.a = false; updateKeyVisuals('A', false); }
    if (e.code === 'KeyS') { keys.s = false; updateKeyVisuals('S', false); }
    if (e.code === 'KeyD') { keys.d = false; updateKeyVisuals('D', false); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.shift = false;
      updateKeyVisuals('Shift', false);
    }
    if (e.code === 'Space') { keys.space = false; }
  });
}

function updateKeyVisuals(key, isActive) {
  const keyEl = document.querySelector(`[data-key="${key}"]`);
  if (keyEl) {
    if (isActive) keyEl.classList.add('active');
    else keyEl.classList.remove('active');
  }
}

function tickMovement() {
  if (!controls.isLocked) return;

  const pos = controls.object.position;
  const isMoving = keys.w || keys.a || keys.s || keys.d;

  jumpVelocity -= GRAVITY * delta;
  pos.y += jumpVelocity * delta;

  if (pos.y <= EYE_HEIGHT && jumpVelocity < 0) {
    const impactStrength = Math.abs(jumpVelocity);
    if (impactStrength > 3) {
      screenShakeIntensity = 0.15;
      createLandingBurst(pos);
      playLandSound();
    }
    pos.y = EYE_HEIGHT;
    jumpVelocity = 0;
    isGrounded = true;
    jumpsRemaining = 2;
  } else if (pos.y > EYE_HEIGHT + 0.1) {
    isGrounded = false;
  }

  const shouldSlide = keys.shift && isMoving && isGrounded;
  if (shouldSlide && !isSliding) {
    isSliding = true;
    targetEyeHeight = SLIDE_EYE_HEIGHT;
    playSlideSound();
  } else if (!shouldSlide && isSliding) {
    isSliding = false;
    targetEyeHeight = EYE_HEIGHT;
  }

  currentEyeHeight += (targetEyeHeight - currentEyeHeight) * EYE_HEIGHT_LERP_SPEED;

  let speedMultiplier = 1.0;
  if (isSliding) speedMultiplier = SLIDE_SPEED_MULTIPLIER;
  else if (keys.shift) speedMultiplier = SPRINT_MULTIPLIER;

  const speed = MOVE_SPEED * speedMultiplier * delta;

  if (keys.w) controls.moveForward(speed);
  if (keys.s) controls.moveForward(-speed);
  if (keys.a) controls.moveRight(-speed);
  if (keys.d) controls.moveRight(speed);

  const flatDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (flatDist > BOUNDARY_RADIUS) {
    const angle = Math.atan2(pos.z, pos.x);
    pos.x = Math.cos(angle) * BOUNDARY_RADIUS;
    pos.z = Math.sin(angle) * BOUNDARY_RADIUS;
  }

  if (pos.y < EYE_HEIGHT) {
    pos.y = EYE_HEIGHT;
    jumpVelocity = 0;
  }

  const slideOffset = currentEyeHeight - EYE_HEIGHT;
  pos.y += slideOffset;
}

function bindUIEvents() {
  const startBtn = document.getElementById('fps-start-btn');
  const resumeBtn = document.getElementById('fps-resume-btn');
  const exitLink = document.getElementById('fps-exit-link');

  if (startBtn) {
    startBtn.addEventListener('click', () => { controls.lock(); });
  }
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => { controls.lock(); });
  }
  if (exitLink) {
    exitLink.addEventListener('click', e => {
      e.preventDefault();
      exitFPSMode();
    });
  }

  controls.addEventListener('lock', () => {
    document.getElementById('fps-load-indicator').style.display = 'none';
    document.getElementById('fps-start-screen').style.display = 'none';
    document.getElementById('fps-paused-screen').style.display = 'none';
    document.getElementById('fps-hud').style.display = 'block';
    if (!animationRunning) startLoop();
  });

  controls.addEventListener('unlock', () => {
    document.getElementById('fps-hud').style.display = 'none';
    document.getElementById('fps-paused-screen').style.display = 'flex';
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'KeyE' && activePortalURL) {
      window.location.href = activePortalURL;
    }
  });
}

function exitFPSMode() {
  controls.unlock();
  if (animationRunning) {
    cancelAnimationFrame(animationFrameId);
    animationRunning = false;
  }

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const particle = activeParticles[i];
    scene.remove(particle);
    if (particle.geometry) particle.geometry.dispose();
    if (particle.material) particle.material.dispose();
  }
  activeParticles = [];

  document.getElementById('fps-world-root').style.display = 'none';
  document.querySelector('header').style.display = '';
  document.querySelector('footer').style.display = '';
  document.querySelector('.centered-input').style.display = '';
}

// ============================================================================
// GAMEPLAY FEEDBACK
// ============================================================================

function applyScreenShake() {
  if (screenShakeIntensity <= 0) return;

  const shake = screenShakeIntensity;
  camera.position.x += (Math.random() - 0.5) * shake;
  camera.position.z += (Math.random() - 0.5) * shake;

  screenShakeIntensity *= 0.85;
  if (screenShakeIntensity < 0.01) screenShakeIntensity = 0;
}

function createLandingBurst(position) {
  if (activeParticles.length >= MAX_PARTICLES) return;

  const burstCount = Math.min(8, MAX_PARTICLES - activeParticles.length);
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const radius = 0.5;
    const vx = Math.cos(angle) * radius;
    const vz = Math.sin(angle) * radius;

    const geo = new THREE.SphereGeometry(0.1, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.6,
    });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.copy(position);
    particle.userData = {
      velocity: new THREE.Vector3(vx, 2, vz),
      lifetime: 0.5,
      age: 0,
    };
    scene.add(particle);
    activeParticles.push(particle);
  }
}

function createSprintTrail(position) {
  if (activeParticles.length >= MAX_PARTICLES) return;

  const trailCount = Math.min(3, MAX_PARTICLES - activeParticles.length);
  for (let i = 0; i < trailCount; i++) {
    const offsetX = (Math.random() - 0.5) * 0.4;
    const offsetZ = (Math.random() - 0.5) * 0.4;
    const vx = Math.random() * 0.5 - 0.25;
    const vz = Math.random() * 0.5 - 0.25;

    const geo = new THREE.SphereGeometry(0.05, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: isSliding ? 0xffcc00 : 0xff8800,
      transparent: true,
      opacity: 0.5,
    });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.set(position.x + offsetX, position.y - 0.5, position.z + offsetZ);
    particle.userData = {
      velocity: new THREE.Vector3(vx, 0.5, vz),
      lifetime: 0.3,
      age: 0,
    };
    scene.add(particle);
    activeParticles.push(particle);
  }
}

// ============================================================================
// DAWN ANIMATION
// ============================================================================

function tickDawn(t) {
  // Slowly advance dawn
  dawnTime = Math.min(dawnTime + delta * DAWN_SPEED, 1.0);

  // Animate sky: sun rises from 1.2° to 22° above horizon
  if (sky) {
    const elevation = 1.2 + dawnTime * 20.8;
    const sunVec = getSunVector(elevation);
    sky.material.uniforms['sunPosition'].value.copy(sunVec);

    // As sun rises, sky becomes less rayleigh-saturated (transitions from orange to blue)
    sky.material.uniforms['rayleigh'].value = 3.0 - dawnTime * 1.2;
    sky.material.uniforms['turbidity'].value = 8 - dawnTime * 4;
    sky.material.uniforms['mieCoefficient'].value = 0.01 - dawnTime * 0.005;
  }

  // Animate sun light: warm orange → golden white
  if (sunLight) {
    const startColor = new THREE.Color(0xff6a00);
    const endColor = new THREE.Color(0xfff5cc);
    sunLight.color.lerpColors(startColor, endColor, dawnTime);
    sunLight.intensity = 0.4 + dawnTime * 1.2;

    // Sun position moves up as dawn progresses
    const elevation = 1.2 + dawnTime * 20.8;
    const sunVec = getSunVector(elevation);
    sunLight.position.copy(sunVec.multiplyScalar(100));
  }

  // Fog: warm amber → light golden haze
  if (scene.fog) {
    const fogStart = new THREE.Color(0xd4641a);
    const fogEnd = new THREE.Color(0xf0c878);
    scene.fog.color.lerpColors(fogStart, fogEnd, dawnTime);
    renderer.setClearColor(scene.fog.color);
  }

  // God rays: pulse opacity, warm to golden over time
  for (const ray of godRays) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.25 + ray.phase);
    const dawnBoost = 0.4 + dawnTime * 0.8;
    ray.mesh.material.opacity = ray.baseOpacity * pulse * dawnBoost;

    // Color warms from orange to gold
    const r = 1.0;
    const g = 0.55 + dawnTime * 0.2;
    const b = 0.1 + dawnTime * 0.05;
    ray.mesh.material.color.setRGB(r, g, b);
  }

  // Ground mist: drift and pulse
  for (const mist of mistPlanes) {
    const ud = mist.userData;
    mist.position.x = ud.bx + Math.sin(t * ud.driftX + ud.phase) * 4;
    mist.position.z = ud.bz + Math.cos(t * ud.driftZ + ud.phase) * 3;
    // Mist brightens with dawn then burns off at full light
    const burnOff = dawnTime > 0.7 ? 1 - (dawnTime - 0.7) / 0.3 : 1.0;
    mist.material.opacity = ud.baseOpacity * burnOff * (0.7 + 0.3 * Math.sin(t * 0.15));
  }

  // Water reflects dawn
  if (waterMat && waterAnimStartTime) {
    const elapsed = (Date.now() - waterAnimStartTime) * 0.0001;
    const dawnGlow = 0.3 + dawnTime * 0.5;
    waterMat.emissiveIntensity = dawnGlow + Math.sin(elapsed * 3) * 0.1;
    const wStart = new THREE.Color(0xff4400);
    const wEnd = new THREE.Color(0xffcc33);
    waterMat.emissive.lerpColors(wStart, wEnd, dawnTime);
  }
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function startLoop() {
  animationRunning = true;
  clock.start();
  loop();
}

function loop() {
  animationFrameId = requestAnimationFrame(loop);
  delta = clock.getDelta();

  if (!isFinite(delta) || delta < 0 || delta > 0.2) {
    delta = 0.016;
  } else {
    delta = Math.min(delta, 0.05);
  }

  tickMovement();
  applyScreenShake();

  // Animate burst/trail particles
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const particle = activeParticles[i];
    particle.userData.age += delta;
    const progress = particle.userData.age / particle.userData.lifetime;

    if (progress >= 1) {
      scene.remove(particle);
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
      activeParticles.splice(i, 1);
    } else {
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.y -= GRAVITY * delta;
      if (particle.material) particle.material.opacity = 0.6 * (1 - progress);
    }
  }

  // Sprint particle trail
  const isMoving = keys.w || keys.a || keys.s || keys.d;
  if ((keys.shift || isSliding) && isMoving && isGrounded) {
    lastSprintParticleTime += delta;
    if (lastSprintParticleTime > SPRINT_PARTICLE_INTERVAL) {
      createSprintTrail(camera.position);
      lastSprintParticleTime = 0;
    }
  } else {
    lastSprintParticleTime = 0;
  }

  const tooltip = document.getElementById('fps-portal-tooltip');
  const nameEl = document.getElementById('fps-portal-name');
  activePortalURL = updatePortalProximity(camera, tooltip, nameEl);

  animatePortals();

  const t = performance.now() * 0.001;
  tickParticles(t);
  tickDawn(t);

  // Render via post-processing composer (bloom)
  composer.render();
}

function onResize() {
  const width = Math.max(window.innerWidth, 320);
  const height = Math.max(window.innerHeight, 240);

  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  try {
    renderer.setSize(width, height);
    composer.setSize(width, height);
  } catch (e) {
    console.warn('[Forest World] Resize failed:', e);
  }
}

// ============================================================================
// EASTER EGG: HIDDEN 8TH PORTAL
// ============================================================================

function onEasterEgg() {
  if (easterPortalAdded) return;
  easterPortalAdded = true;
  console.log('[Easter Egg] Portal unlocked!');
  addEasterEggPortal();
}

function addEasterEggPortal() {
  const EASTER_DATA = {
    label: '1153',
    url: './projects/index.html',
    color: 0xff1493,
  };

  const position = new THREE.Vector3(0, 0, 0);

  const torusGeo = new THREE.TorusGeometry(2.8, 0.18, 12, 48);
  const torusMat = new THREE.MeshStandardMaterial({
    color: EASTER_DATA.color,
    emissive: EASTER_DATA.color,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.8,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.y = 2.5;
  torus.rotateX(Math.PI / 2);
  scene.add(torus);

  const discGeo = new THREE.CircleGeometry(2.6, 48);
  const discMat = new THREE.MeshBasicMaterial({
    color: EASTER_DATA.color,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.copy(torus.position);
  disc.rotation.copy(torus.rotation);
  scene.add(disc);

  const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: EASTER_DATA.color,
    emissive: EASTER_DATA.color,
    emissiveIntensity: 1.0,
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 1.25;
  scene.add(pillar);

  const labelSprite = makeLabelSprite(EASTER_DATA.label, EASTER_DATA.color);
  labelSprite.position.y = 5.5;
  labelSprite.scale.set(8, 2, 1);
  scene.add(labelSprite);

  const light = new THREE.PointLight(EASTER_DATA.color, 2.0, 25);
  light.position.y = 2.5;
  scene.add(light);

  scene.userData.easterPortal = {
    position,
    data: EASTER_DATA,
    torus,
    light,
  };
}

// ============================================================================
// UTILITY
// ============================================================================

function makeLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 20);
  ctx.fill();

  const hexColor = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = hexColor;
  ctx.font = 'bold 56px Barlow, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(mat);
}
