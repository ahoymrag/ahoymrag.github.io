import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { initPortals, updatePortalProximity, animatePortals } from './portals.js';
import { initParticles, tickParticles } from './particles.js';

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

if (!isWebGLSupported() || isMobile) {
  console.info('[Forest World] WebGL unavailable or mobile — using static fallback.');
} else {
  initFPSWorld();
}

// ============================================================================
// SCENE STATE
// ============================================================================

let scene, camera, renderer, controls;
let clock, delta;
let portalsGroup;
let activePortalURL = null;
let animationRunning = false;
let animationFrameId = null;
let easterPortalAdded = false;

// Key state for movement
const keys = { w: false, a: false, s: false, d: false };
const MOVE_SPEED = 8.0;
const BOUNDARY_RADIUS = 28; // player stays within the forest clearing

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

function initFPSWorld() {
  // --- DOM SETUP ---
  const root = document.getElementById('fps-world-root');
  root.style.display = 'block';

  // Hide existing content but keep in DOM for fallback
  document.querySelector('header').style.display = 'none';
  document.querySelector('footer').style.display = 'none';
  document.querySelector('.centered-input').style.display = 'none';

  // --- SCENE ---
  scene = new THREE.Scene();

  // Forest sky gradient: warm sunlight filtering through trees
  const skyColor = new THREE.Color(0xa8d5ba); // Warm forest green-tinted sky
  scene.background = new THREE.Color(0x8aba98); // Forest canopy
  scene.fog = new THREE.FogExp2(0xa8d5ba, 0.015); // Soft depth fog

  // --- CAMERA ---
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 1.7, 0); // Eye height

  // --- RENDERER ---
  const canvas = document.getElementById('fps-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.mapSize.width = 2048;
  renderer.shadowMap.mapSize.height = 2048;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  // --- LIGHTING ---
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
  buildGround();
  buildWater();
  buildForestTrees();

  // --- PORTALS ---
  portalsGroup = initPortals(scene);

  // --- PARTICLES / BOKEH EFFECT ---
  initParticles(scene);

  // --- CONTROLS ---
  controls = new PointerLockControls(camera, document.body);
  scene.add(controls.getObject());

  // --- CLOCK ---
  clock = new THREE.Clock();

  // --- EVENT LISTENERS ---
  bindUIEvents();
  bindKeys();
  window.addEventListener('resize', onResize);
  window.addEventListener('ag:easterEgg', onEasterEgg);

  // Auto-lock controls after scene fully initializes
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      controls.lock();
    });
  });

  console.info('[Forest World] Initialized successfully');
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
  const waterMat = new THREE.MeshStandardMaterial({
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

  // Water animation
  const startTime = Date.now();
  setInterval(() => {
    const elapsed = (Date.now() - startTime) * 0.0001;
    waterMat.emissiveIntensity = 0.1 + Math.sin(elapsed) * 0.05;
  }, 16);
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

  const speed = MOVE_SPEED * delta;
  const prevPos = controls.getObject().position.clone();

  if (keys.w) controls.moveForward(speed);
  if (keys.s) controls.moveForward(-speed);
  if (keys.a) controls.moveRight(-speed);
  if (keys.d) controls.moveRight(speed);

  // Soft boundary: keep player in the clearing
  const pos = controls.getObject().position;
  const flatDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (flatDist > BOUNDARY_RADIUS) {
    const angle = Math.atan2(pos.z, pos.x);
    pos.x = Math.cos(angle) * BOUNDARY_RADIUS;
    pos.z = Math.sin(angle) * BOUNDARY_RADIUS;
  }

  // Lock Y to eye height
  pos.y = 1.7;
}

function bindUIEvents() {
  const startBtn = document.getElementById('fps-start-btn');
  const resumeBtn = document.getElementById('fps-resume-btn');
  const exitLink = document.getElementById('fps-exit-link');

  startBtn.addEventListener('click', () => {
    controls.lock();
  });

  resumeBtn.addEventListener('click', () => {
    controls.lock();
  });

  exitLink.addEventListener('click', e => {
    e.preventDefault();
    exitFPSMode();
  });

  controls.addEventListener('lock', () => {
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

  // Portal proximity
  const tooltip = document.getElementById('fps-portal-tooltip');
  const nameEl = document.getElementById('fps-portal-name');
  activePortalURL = updatePortalProximity(camera, tooltip, nameEl);

  // Portal pulse animation
  const t = performance.now() * 0.001;
  animatePortals();

  // Particle animation
  tickParticles(t);

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
