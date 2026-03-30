import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { initPortals, updatePortalProximity, animatePortals } from './portals.js';
import { initParticles, tickParticles } from './particles.js';

// ============================================================================
// WEBGL DETECTION & INITIALIZATION GATE
// ============================================================================

// ============================================================================
// SCENE STATE — must be declared before initialization code
// ============================================================================

let scene, camera, renderer, controls;
let clock, delta;
let portalsGroup;
let activePortalURL = null;
let animationRunning = false;
let animationFrameId = null;
let easterPortalAdded = false;
let waterMat = null;
let waterAnimStartTime = null;

// Key state for movement
const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
const MOVE_SPEED = 8.0;
const SPRINT_MULTIPLIER = 1.5;
const BOUNDARY_RADIUS = 28; // player stays within the forest clearing

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

// ============================================================================
// WEBGL DETECTION & INITIALIZATION GATE
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
  try {
    initFPSWorld();
  } catch (err) {
    console.error('[Forest World] Initialization error:', err);
  }
}

// ============================================================================
// AUDIO SYNTHESIS
// ============================================================================

function initAudio() {
  if (audioContext) return; // Already initialized

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

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  // Chirp: 200 Hz to 400 Hz over 0.1 seconds
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  osc.start(now);
  osc.stop(now + 0.1);
}

function playLandSound() {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  // Low tone: 100 Hz, quick decay
  osc.frequency.setValueAtTime(100, now);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  osc.start(now);
  osc.stop(now + 0.15);
}

function playSprintSound() {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  // Wind sound: low frequency with filtered white noise effect
  osc.frequency.setValueAtTime(50, now);
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.setValueAtTime(0.15, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.2);
}

function playSlideSound() {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  // Whoosh: descending frequency 300 Hz to 100 Hz
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  osc.start(now);
  osc.stop(now + 0.15);
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
  console.log('[Forest World] Starting initialization...');
  updateProgress(5);

  // --- DOM SETUP ---
  const root = document.getElementById('fps-world-root');
  const canvas = document.getElementById('fps-canvas');

  if (!root || !canvas) {
    console.error('[Forest World] Required DOM elements missing (fps-world-root or fps-canvas)');
    return;
  }

  root.style.display = 'block';

  const loadIndicator = document.getElementById('fps-load-indicator');
  loadIndicator.style.display = 'block';

  // Hide existing content but keep in DOM for fallback
  document.querySelector('header').style.display = 'none';
  document.querySelector('footer').style.display = 'none';
  document.querySelector('.centered-input').style.display = 'none';

  // --- SCENE ---
  console.log('[Forest World] Creating scene...');
  scene = new THREE.Scene();

  // Forest sky gradient: warm sunlight filtering through trees
  const skyColor = new THREE.Color(0xa8d5ba); // Warm forest green-tinted sky
  scene.background = new THREE.Color(0x8aba98); // Forest canopy
  scene.fog = new THREE.FogExp2(0xa8d5ba, 0.015); // Soft depth fog

  // --- CAMERA ---
  updateProgress(15);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, EYE_HEIGHT, 0); // Eye height
  currentEyeHeight = EYE_HEIGHT;

  // --- RENDERER ---
  console.log('[Forest World] Creating renderer...');
  console.log('[Forest World] Canvas found:', canvas);

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    console.log('[Forest World] Renderer created successfully');
  } catch (e) {
    console.error('[Forest World] Renderer creation failed:', e);
    throw e;
  }

  updateProgress(25);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  try {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (renderer.shadowMap.mapSize) {
      renderer.shadowMap.mapSize.width = 2048;
      renderer.shadowMap.mapSize.height = 2048;
    }
  } catch (e) {
    console.warn('[Forest World] Shadow map configuration partial:', e);
  }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  console.log('[Forest World] Renderer configured');

  // --- LIGHTING ---
  updateProgress(35);
  // Warm directional sunlight (golden hour)
  const sunLight = new THREE.DirectionalLight(0xfdb813, 1.2);
  sunLight.position.set(15, 40, 25);
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

  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x90ee90, 0.6);
  scene.add(ambientLight);

  // Sky dome for realistic lighting
  addSkyDome();

  // --- WORLD GEOMETRY ---
  updateProgress(45);
  buildGround();
  buildWater();

  updateProgress(60);
  buildForestTrees();

  // --- PORTALS ---
  updateProgress(75);
  portalsGroup = initPortals(scene);

  // --- PARTICLES / BOKEH EFFECT ---
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

  // Initialization complete — user will click Start button to lock controls
  updateProgress(100);
  console.log('[Forest World] Initialization completed');

  // Show start screen with fade-out of load indicator
  setTimeout(() => {
    loadIndicator.style.display = 'none';
    document.getElementById('fps-start-screen').style.display = 'flex';
  }, 300);
}

// ============================================================================
// WORLD GEOMETRY
// ============================================================================

function addSkyDome() {
  // Create a large sphere for sky
  const skyGeo = new THREE.SphereGeometry(300, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0xa8d5ba,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);
}

function buildGround() {
  // Main clearing ground with grass-like appearance
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x6ba876,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x2d5a3d,
    emissiveIntensity: 0.15,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add some variation with low-poly grass tufts
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    const grassHeight = 0.4 + Math.random() * 0.6;

    const grassGeo = new THREE.ConeGeometry(0.3, grassHeight, 6);
    const grassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.35, 0.6, 0.35 + Math.random() * 0.15),
      roughness: 0.8,
      metalness: 0.0,
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.set(x, grassHeight / 2, z);
    grass.castShadow = true;
    grass.receiveShadow = true;
    scene.add(grass);
  }
}

function buildWater() {
  // Simple flowing water stream through the forest
  const waterGeo = new THREE.PlaneGeometry(4, 15);
  waterMat = new THREE.MeshStandardMaterial({
    color: 0x4da6e6,
    roughness: 0.3,
    metalness: 0.6,
    emissive: 0x1a3a66,
    emissiveIntensity: 0.1,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.01, 0); // Slightly above ground
  water.receiveShadow = true;
  scene.add(water);

  // Animation will be updated in main loop
  waterAnimStartTime = Date.now();
}

function buildForestTrees() {
  // Create a forest of simple trees around the player
  const treePositions = [
    [-15, -8], [-20, 5], [-12, 18], [-25, 25],
    [15, -10], [22, 8], [18, 20], [28, 28],
    [-5, -25], [8, -22], [20, -15], [-18, -20],
    [0, 30], [12, -28], [-22, 12],
  ];

  treePositions.forEach(([x, z]) => {
    const treeHeight = 12 + Math.random() * 6;
    const trunkRadius = 0.6 + Math.random() * 0.4;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, treeHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08, 0.5, 0.25),
      roughness: 0.9,
      metalness: 0.0,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, treeHeight / 2, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    // Foliage (simple cone for canopy)
    const foliageGeo = new THREE.ConeGeometry(treeHeight * 0.6, treeHeight * 0.8, 12);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.35, 0.7, 0.35 + Math.random() * 0.1),
      roughness: 0.7,
      metalness: 0.0,
      emissive: 0x1a3a1a,
      emissiveIntensity: 0.1,
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(x, treeHeight * 0.6, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
  });
}

// ============================================================================
// CONTROLS & INPUT
// ============================================================================

function bindKeys() {
  document.addEventListener('keydown', e => {
    // Initialize audio on first user input
    initAudio();

    if (e.code === 'KeyW') {
      keys.w = true;
      updateKeyVisuals('W', true);
    }
    if (e.code === 'KeyA') {
      keys.a = true;
      updateKeyVisuals('A', true);
    }
    if (e.code === 'KeyS') {
      keys.s = true;
      updateKeyVisuals('S', true);
    }
    if (e.code === 'KeyD') {
      keys.d = true;
      updateKeyVisuals('D', true);
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.shift = true;
      updateKeyVisuals('Shift', true);
    }
    if (e.code === 'Space') {
      e.preventDefault();
      keys.space = true;
      // Double jump logic
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
    if (e.code === 'KeyW') {
      keys.w = false;
      updateKeyVisuals('W', false);
    }
    if (e.code === 'KeyA') {
      keys.a = false;
      updateKeyVisuals('A', false);
    }
    if (e.code === 'KeyS') {
      keys.s = false;
      updateKeyVisuals('S', false);
    }
    if (e.code === 'KeyD') {
      keys.d = false;
      updateKeyVisuals('D', false);
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      keys.shift = false;
      updateKeyVisuals('Shift', false);
    }
    if (e.code === 'Space') {
      keys.space = false;
    }
  });
}

function updateKeyVisuals(key, isActive) {
  const keyEl = document.querySelector(`[data-key="${key}"]`);
  if (keyEl) {
    if (isActive) {
      keyEl.classList.add('active');
    } else {
      keyEl.classList.remove('active');
    }
  }
}

function tickMovement() {
  if (!controls.isLocked) return;

  const pos = controls.object.position;
  const isMoving = keys.w || keys.a || keys.s || keys.d;

  // Apply gravity
  jumpVelocity -= GRAVITY * delta;
  pos.y += jumpVelocity * delta;

  // Landing detection and particle burst (use EYE_HEIGHT as ground level)
  if (pos.y <= EYE_HEIGHT && jumpVelocity < 0) {
    // Landing impact feedback (check before resetting velocity)
    const impactStrength = Math.abs(jumpVelocity);
    if (impactStrength > 3) {
      screenShakeIntensity = 0.15;
      createLandingBurst(pos);
      playLandSound();
    }

    pos.y = EYE_HEIGHT;
    jumpVelocity = 0;
    isGrounded = true;
    jumpsRemaining = 2; // Reset jumps when grounded
  } else if (pos.y > EYE_HEIGHT + 0.1) {
    isGrounded = false;
  }

  // Slide mechanic
  const shouldSlide = keys.shift && isMoving && isGrounded;
  if (shouldSlide && !isSliding) {
    isSliding = true;
    targetEyeHeight = SLIDE_EYE_HEIGHT;
    playSlideSound();
  } else if (!shouldSlide && isSliding) {
    isSliding = false;
    targetEyeHeight = EYE_HEIGHT;
  }

  // Smooth camera height interpolation (for slide effect)
  currentEyeHeight += (targetEyeHeight - currentEyeHeight) * EYE_HEIGHT_LERP_SPEED;

  // Determine speed multiplier
  let speedMultiplier = 1.0;
  if (isSliding) {
    speedMultiplier = SLIDE_SPEED_MULTIPLIER;
  } else if (keys.shift) {
    speedMultiplier = SPRINT_MULTIPLIER;
  }
  const speed = MOVE_SPEED * speedMultiplier * delta;

  if (keys.w) controls.moveForward(speed);
  if (keys.s) controls.moveForward(-speed);
  if (keys.a) controls.moveRight(-speed);
  if (keys.d) controls.moveRight(speed);

  // Soft boundary: keep player in the clearing
  const flatDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (flatDist > BOUNDARY_RADIUS) {
    const angle = Math.atan2(pos.z, pos.x);
    pos.x = Math.cos(angle) * BOUNDARY_RADIUS;
    pos.z = Math.sin(angle) * BOUNDARY_RADIUS;
  }

  // Maintain eye height (locked to ground, but use the base EYE_HEIGHT for ground)
  // The slide effect is just a camera offset, not actual ground change
  if (pos.y < EYE_HEIGHT) {
    pos.y = EYE_HEIGHT;
    jumpVelocity = 0;
  }

  // Apply slide camera offset after all other position logic
  const slideOffset = currentEyeHeight - EYE_HEIGHT;
  pos.y += slideOffset;
}

function bindUIEvents() {
  const startBtn = document.getElementById('fps-start-btn');
  const resumeBtn = document.getElementById('fps-resume-btn');
  const exitLink = document.getElementById('fps-exit-link');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      controls.lock();
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      controls.lock();
    });
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

  // E key — portal entry
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

  // Apply camera jitter
  const shake = screenShakeIntensity;
  camera.position.x += (Math.random() - 0.5) * shake;
  camera.position.z += (Math.random() - 0.5) * shake;

  // Decay intensity
  screenShakeIntensity *= 0.85;
  if (screenShakeIntensity < 0.01) screenShakeIntensity = 0;
}

function createLandingBurst(position) {
  // Create visual burst using sprites (simplified version)
  // This creates a temporary visual effect at landing position

  // Create a burst of small particles as visual feedback
  const burstCount = 8;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const radius = 0.5;
    const vx = Math.cos(angle) * radius;
    const vz = Math.sin(angle) * radius;

    // Create a temporary small sphere that fades and disappears
    const geo = new THREE.SphereGeometry(0.1, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x90ee90,
      transparent: true,
      opacity: 0.6,
    });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.copy(position);

    // Store burst particle metadata for animation
    particle.userData = {
      velocity: new THREE.Vector3(vx, 2, vz),
      lifetime: 0.5,
      age: 0,
    };

    scene.add(particle);
  }
}

function createSprintTrail(position) {
  // Create particle trail during sprint/slide
  const trailCount = 3;
  for (let i = 0; i < trailCount; i++) {
    const offsetX = (Math.random() - 0.5) * 0.4;
    const offsetZ = (Math.random() - 0.5) * 0.4;
    const vx = Math.random() * 0.5 - 0.25;
    const vz = Math.random() * 0.5 - 0.25;

    const geo = new THREE.SphereGeometry(0.05, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: isSliding ? 0xffd700 : 0xffc700, // Gold for sprint, brighter gold for slide
      transparent: true,
      opacity: 0.5,
    });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.set(
      position.x + offsetX,
      position.y - 0.5,
      position.z + offsetZ
    );

    particle.userData = {
      velocity: new THREE.Vector3(vx, 0.5, vz),
      lifetime: 0.3,
      age: 0,
    };

    scene.add(particle);
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
  delta = Math.min(clock.getDelta(), 0.05);

  // Movement
  tickMovement();

  // Screen shake feedback
  applyScreenShake();

  // Animate burst particles
  const burstParticles = scene.children.filter(obj => obj.userData && obj.userData.velocity);
  burstParticles.forEach(particle => {
    particle.userData.age += delta;
    const progress = particle.userData.age / particle.userData.lifetime;

    if (progress >= 1) {
      scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    } else {
      // Update position
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.y -= GRAVITY * delta;

      // Fade out
      particle.material.opacity = 0.6 * (1 - progress);
    }
  });

  // Sprint particle trail emission
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

  // Portal proximity
  const tooltip = document.getElementById('fps-portal-tooltip');
  const nameEl = document.getElementById('fps-portal-name');
  activePortalURL = updatePortalProximity(camera, tooltip, nameEl);

  // Portal pulse animation
  const t = performance.now() * 0.001;
  animatePortals();

  // Particle animation
  tickParticles(t);

  // Water animation
  if (waterMat && waterAnimStartTime) {
    const elapsed = (Date.now() - waterAnimStartTime) * 0.0001;
    waterMat.emissiveIntensity = 0.1 + Math.sin(elapsed) * 0.05;
  }

  // Render
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
  // Create hidden portal at center of clearing, rising from ground
  const EASTER_DATA = {
    label: '1153',
    url: './projects/index.html',
    color: 0xff1493, // Deep pink
  };

  const position = new THREE.Vector3(0, 0, 0);

  // Portal ring (torus)
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

  // Inner disc
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

  // Pillar
  const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: EASTER_DATA.color,
    emissive: EASTER_DATA.color,
    emissiveIntensity: 1.0,
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 1.25;
  scene.add(pillar);

  // Label sprite
  const labelSprite = makeLabelSprite(EASTER_DATA.label, EASTER_DATA.color);
  labelSprite.position.y = 5.5;
  labelSprite.scale.set(8, 2, 1);
  scene.add(labelSprite);

  // Light
  const light = new THREE.PointLight(EASTER_DATA.color, 2.0, 25);
  light.position.y = 2.5;
  scene.add(light);

  // Add to portal data for proximity checking
  // Store as a special entry in the scene
  scene.userData.easterPortal = {
    position,
    data: EASTER_DATA,
    torus,
    light,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function makeLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 20);
  ctx.fill();

  // Text
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
