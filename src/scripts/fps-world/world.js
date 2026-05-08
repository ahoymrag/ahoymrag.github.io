import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { initPortals, updatePortalProximity, animatePortals } from './portals.js';

// ============================================================================
// SCENE STATE
// ============================================================================

let scene, camera, renderer, controls;
let clock, delta;
let portalsGroup;
let activePortalURL = null;
let animationRunning = false;
let animationFrameId = null;

// CMYK State
const SUN_AZIMUTH_DEG = 45;

// Key state for movement
const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
const MOVE_SPEED = 12.0;
const EYE_HEIGHT = 2.0;
const BOUNDARY_RADIUS = 50;

// ============================================================================
// WEBGL DETECTION
// ============================================================================

function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) { return false; }
}

if (isWebGLSupported()) {
  window.addEventListener('ag:enterFPS', () => {
    initFPSWorld();
  }, { once: true });
}

window.initFPSWorld = initFPSWorld;

// ============================================================================
// MAIN INITIALIZATION (BAREBONES)
// ============================================================================

function initFPSWorld() {
  try {
    console.log('[Forest World] Starting simplification test...');
    
    const root = document.getElementById('fps-world-root');
    const canvas = document.getElementById('fps-canvas');

    root.style.display = 'block';
    root.style.visibility = 'visible';
    root.style.zIndex = '99999';
    root.style.background = '#00ffff';

    canvas.style.display = 'block';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';

    document.querySelector('header').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.querySelector('.centered-input').style.display = 'none';

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x050505, 1); // Subtle Key (Black)

    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 10, 50);

    // --- CAMERA ---
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // --- SUBTLE GRID ---
    const grid = new THREE.GridHelper(100, 40, 0x00ffff, 0x222222); // Cyan major, dark grey minor
    grid.position.y = 0;
    scene.add(grid);

    // --- SUBTLE DEBUG OBJECT ---
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff00ff, 
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 2, -10);
    scene.add(cube);
    window.debugCube = cube;

    // --- SUBTLE MARKERS (Yellow) ---
    for (let i = 0; i < 20; i++) {
      const markerGeo = new THREE.OctahedronGeometry(0.5);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set((Math.random() - 0.5) * 60, 1, (Math.random() - 0.5) * 60);
      scene.add(marker);
    }

    // --- CONTROLS ---
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.object);
    controls.object.position.set(0, EYE_HEIGHT, 0);

    // --- CLOCK ---
    clock = new THREE.Clock();

    // --- UI ---
    bindUIEvents();
    bindKeys();
    window.addEventListener('resize', onResize);

    document.getElementById('fps-load-indicator').style.display = 'none';
    document.getElementById('fps-start-screen').style.display = 'flex';

    startLoop();

  } catch (error) {
    console.error('[Forest World] Error:', error);
  }
}

function startLoop() {
  animationRunning = true;
  clock.start();
  loop();
}

function loop() {
  animationFrameId = requestAnimationFrame(loop);
  delta = clock.getDelta();

  if (window.debugCube) {
    window.debugCube.rotation.x += 0.02;
    window.debugCube.rotation.y += 0.02;
  }

  tickMovement();
  renderer.render(scene, camera);
}

function tickMovement() {
  if (!controls.isLocked) return;
  const speed = MOVE_SPEED * delta;
  if (keys.w) controls.moveForward(speed);
  if (keys.s) controls.moveForward(-speed);
  if (keys.a) controls.moveRight(-speed);
  if (keys.d) controls.moveRight(speed);
}

function bindKeys() {
  document.addEventListener('keydown', e => {
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyA') keys.a = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'KeyD') keys.d = true;
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyD') keys.d = false;
  });
}

function bindUIEvents() {
  const startBtn = document.getElementById('fps-start-btn');
  const resumeBtn = document.getElementById('fps-resume-btn');
  if (startBtn) startBtn.addEventListener('click', () => controls.lock());
  if (resumeBtn) resumeBtn.addEventListener('click', () => controls.lock());

  controls.addEventListener('lock', () => {
    document.getElementById('fps-start-screen').style.display = 'none';
    document.getElementById('fps-paused-screen').style.display = 'none';
    document.getElementById('fps-hud').style.display = 'block';
  });

  controls.addEventListener('unlock', () => {
    document.getElementById('fps-hud').style.display = 'none';
    document.getElementById('fps-paused-screen').style.display = 'flex';
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateProgress(p) {}
function initParticles() {}
function tickParticles() {}
function tickDawn() {}
