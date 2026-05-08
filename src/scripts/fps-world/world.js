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

// Robustness: expose to window
window.initFPSWorld = initFPSWorld;
console.log('[Forest World] Script loaded and ready.');

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
    root.style.visibility = 'visible';
    root.style.opacity = '1';
    root.style.zIndex = '99999'; // Ensure it's on top of EVERYTHING

    const loadIndicator = document.getElementById('fps-load-indicator');
    loadIndicator.style.display = 'block';

    document.querySelector('header').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.querySelector('.centered-input').style.display = 'none';

    // --- SCENE ---
    console.log('[Forest World] Creating scene...');
    scene = new THREE.Scene();

    // CMYK Game Aesthetic: Vibrant Cyan mist
    scene.background = new THREE.Color(0x00ffff); // Cyan
    scene.fog = new THREE.FogExp2(0x00ffff, 0.015);

    // --- CAMERA ---
    updateProgress(15);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, EYE_HEIGHT, 5); // Start slightly back to see origin
    currentEyeHeight = EYE_HEIGHT;

    // --- RENDERER ---
    console.log('[Forest World] Creating renderer...');
    try {
      renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance'
      });
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
    renderer.toneMapping = THREE.NoToneMapping; // Raw CMYK colors
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // --- POST-PROCESSING ---
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // High intensity Bloom for that "Game" glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5,  // strong strength
      0.5,  // radius
      0.1   // low threshold for maximum glow
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // --- DEBUG OBJECT ---
    // A bright Magenta cube at the center to confirm rendering works
    const debugBox = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({ color: 0xff00ff }) // Magenta
    );
    debugBox.position.set(0, 1, 0);
    scene.add(debugBox);

    // --- LIGHTING ---
    updateProgress(35);

    // CMYK Light: Magenta Sun
    sunLight = new THREE.DirectionalLight(0xff00ff, 2.0);
    sunLight.position.set(50, 50, 50); 
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Cyan Fill
    const ambientLight = new THREE.AmbientLight(0x00ffff, 0.5);
    scene.add(ambientLight);

    // Yellow ground bounce
    const fillLight = new THREE.HemisphereLight(0x00ffff, 0xffff00, 1.0);
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
    controls.object.position.set(0, EYE_HEIGHT, 10); // Safe starting position

    // --- CLOCK ---
    clock = new THREE.Clock();

    // --- EVENT LISTENERS ---
    bindUIEvents();
    bindKeys();
    window.addEventListener('resize', onResize);
    window.addEventListener('ag:easterEgg', onEasterEgg);

    updateProgress(100);
    console.log('[Forest World] Initialization completed');

    // Start loop immediately
    startLoop();

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
  const count = 10;
  const azRad = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const sunBaseX = Math.cos(azRad);
  const sunBaseZ = Math.sin(azRad);

  for (let i = 0; i < count; i++) {
    const len = 150 + Math.random() * 100;
    const wid = 5 + Math.random() * 10;
    const geo = new THREE.PlaneGeometry(wid, len);
    geo.translate(0, len * 0.5, 0);

    const baseOpacity = 0.05 + Math.random() * 0.1;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xff00ff), // Magenta rays
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ray = new THREE.Mesh(geo, mat);

    const spread = 40;
    const px = sunBaseX * 50 + (Math.random() - 0.5) * spread;
    const pz = sunBaseZ * 50 + (Math.random() - 0.5) * spread;
    const py = 5 + Math.random() * 15;
    ray.position.set(px, py, pz);

    ray.lookAt(
      (Math.random() - 0.5) * 20,
      -50,
      (Math.random() - 0.5) * 20
    );
    ray.rotateX(Math.PI / 2 + (Math.random() - 0.5) * 0.5);

    scene.add(ray);
    godRays.push({ mesh: ray, baseOpacity, phase: Math.random() * Math.PI * 2 });
  }
}

function addGroundMist() {
  const mistCount = 12;
  for (let i = 0; i < mistCount; i++) {
    const w = 50 + Math.random() * 60;
    const d = 40 + Math.random() * 50;
    const geo = new THREE.PlaneGeometry(w, d, 1, 1);
    const baseOpacity = 0.15 + Math.random() * 0.2;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ffff), // Cyan mist
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const mist = new THREE.Mesh(geo, mat);
    mist.rotation.x = -Math.PI / 2;
    const bx = (Math.random() - 0.5) * 80;
    const bz = (Math.random() - 0.5) * 80;
    const by = 0.2 + Math.random() * 1.5;
    mist.position.set(bx, by, bz);
    mist.userData = { baseOpacity, bx, bz, by, phase: Math.random() * Math.PI * 2, driftX: (Math.random() - 0.5) * 0.5, driftZ: (Math.random() - 0.5) * 0.5 };
    scene.add(mist);
    mistPlanes.push(mist);
  }
}

function addHorizonGlow() {
  const azRad = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const hx = Math.cos(azRad) * 250;
  const hz = Math.sin(azRad) * 250;

  const geo = new THREE.PlaneGeometry(200, 60);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff00ff), // Magenta horizon
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(geo, mat);
  glow.position.set(hx * 0.3, 10, hz * 0.3);
  glow.lookAt(0, 10, 0);
  scene.add(glow);
}

// ============================================================================
// WORLD GEOMETRY
// ============================================================================

function buildGround() {
  const SEG = 40;
  const groundGeo = new THREE.PlaneGeometry(150, 150, SEG, SEG);

  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const distFromCenter = Math.sqrt(x * x + y * y);
    const edgeFade = Math.max(0, 1 - distFromCenter / 70);
    pos.setZ(i, (Math.random() - 0.5) * 2.0 * edgeFade);
  }
  pos.needsUpdate = true;
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xffff00,      // Pure Yellow ground
    emissive: 0xff00ff,   // Magenta glow in cracks
    emissiveIntensity: 0.1,
    roughness: 0.1,
    metalness: 0.5,
    flatShading: true,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // CMYK Obelisks
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 70;
    const z = (Math.random() - 0.5) * 70;
    const h = 1 + Math.random() * 5;
    
    const obeliskGeo = new THREE.CylinderGeometry(0.1, 0.4, h, 4);
    const obeliskMat = new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? 0x00ffff : (i % 3 === 1 ? 0xff00ff : 0x000000), // C, M, or K
      emissive: i % 3 === 2 ? 0x000000 : 0x000000,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.set(x, h / 2, z);
    obelisk.rotation.y = Math.random() * Math.PI;
    obelisk.castShadow = true;
    scene.add(obelisk);
  }
}

function buildWater() {
  // Magenta Neon Stream
  const waterGeo = new THREE.PlaneGeometry(10, 30);
  waterMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff, // Neon Magenta
    roughness: 0.0,
    metalness: 1.0,
    emissive: 0xff00ff,
    emissiveIntensity: 1.0,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.05, 0);
  water.receiveShadow = true;
  scene.add(water);
  waterAnimStartTime = Date.now();
}

function buildForestTrees() {
  const treePositions = [
    [-25, -15], [-30, 10], [-20, 30], [-40, 40],
    [25, -18], [35, 15], [28, 30], [45, 45],
    [-12, -40], [15, -35], [30, -25], [-30, -30],
    [0, 50], [20, -45], [-35, 20],
  ];

  // CMYK Forest: Key (Black) trunks with vibrant highlights
  treePositions.forEach(([x, z]) => {
    const treeHeight = 15 + Math.random() * 10;
    
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.6, treeHeight, 4);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x000000, // Black trunk
      roughness: 0.1,
      metalness: 1.0,
      flatShading: true,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, treeHeight / 2, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Neon foliage rings
    [0.8, 0.6, 0.4].forEach((scale, tier) => {
      const ringGeo = new THREE.TorusGeometry(treeHeight * 0.2 * scale, 0.2, 8, 4);
      const ringMat = new THREE.MeshStandardMaterial({
        color: tier === 0 ? 0x00ffff : (tier === 1 ? 0xff00ff : 0xffff00), // C, M, Y
        emissive: tier === 0 ? 0x00ffff : (tier === 1 ? 0xff00ff : 0xffff00),
        emissiveIntensity: 1.5,
        flatShading: true,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, treeHeight * (0.5 + tier * 0.2), z);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      scene.add(ring);
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

  // Animate sky: transitioning to a vibrant Cyan morning
  if (sky) {
    const elevation = 1.2 + dawnTime * 20.8;
    const sunVec = getSunVector(elevation);
    sky.material.uniforms['sunPosition'].value.copy(sunVec);

    // High intensity scattering for arcade feel
    sky.material.uniforms['rayleigh'].value = 4.0 - dawnTime * 1.0;
    sky.material.uniforms['turbidity'].value = 10 - dawnTime * 2;
    sky.material.uniforms['mieCoefficient'].value = 0.02 - dawnTime * 0.01;
  }

  // Animate sun light: Neon Magenta
  if (sunLight) {
    const startColor = new THREE.Color(0xff00ff);
    const endColor = new THREE.Color(0xff00ff);
    sunLight.color.lerpColors(startColor, endColor, dawnTime);
    sunLight.intensity = 2.0 + dawnTime * 1.0;

    const elevation = 1.2 + dawnTime * 20.8;
    const sunVec = getSunVector(elevation);
    sunLight.position.copy(sunVec.multiplyScalar(100));
  }

  // Fog: Cyan mist
  if (scene.fog) {
    const fogColor = new THREE.Color(0x00ffff);
    scene.fog.color.copy(fogColor);
    renderer.setClearColor(scene.fog.color);
  }

  // God rays: Magenta pulsing
  for (const ray of godRays) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 0.5 + ray.phase);
    const dawnBoost = 1.0 + dawnTime * 0.5;
    ray.mesh.material.opacity = ray.baseOpacity * pulse * dawnBoost;
    ray.mesh.material.color.setHex(0xff00ff);
  }

  // Ground mist
  for (const mist of mistPlanes) {
    const ud = mist.userData;
    mist.position.x = ud.bx + Math.sin(t * ud.driftX + ud.phase) * 6;
    mist.position.z = ud.bz + Math.cos(t * ud.driftZ + ud.phase) * 5;
    mist.material.opacity = ud.baseOpacity * (0.7 + 0.3 * Math.sin(t * 0.3));
  }

  // Water reflects neon magenta
  if (waterMat && waterAnimStartTime) {
    const elapsed = (Date.now() - waterAnimStartTime) * 0.0001;
    waterMat.emissiveIntensity = 1.0 + Math.sin(elapsed * 4) * 0.2;
    waterMat.emissive.setHex(0xff00ff);
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
  try {
    composer.render();
  } catch (e) {
    console.warn('[Forest World] Composer failed, falling back to basic render:', e);
    renderer.render(scene, camera);
  }
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
