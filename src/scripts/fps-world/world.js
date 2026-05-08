import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { initPortals, updatePortalProximity, animatePortals } from './portals.js';
import { initParticles, tickParticles } from './particles.js';

// ============================================================================
// STATE
// ============================================================================

let scene, camera, renderer, controls;
let clock, delta;
let activePortalURL = null;
let animationRunning = false;
let animationFrameId = null;
let waterMat = null;
let waterAnimStartTime = null;

// Dawn
let sunLight = null;
let godRays  = [];
let mistPlanes = [];
let dawnTime = 0;
const DAWN_SPEED      = 0.004;
const SUN_AZIMUTH_DEG = 45;

// Movement
const keys = { w: false, a: false, s: false, d: false, shift: false };
const MOVE_SPEED        = 8.0;
const SPRINT_MULTIPLIER = 1.5;
const BOUNDARY_RADIUS   = 28;

// Jump / gravity
let jumpVelocity = 0;
const GRAVITY    = 25;
const JUMP_POWER = 15;
const EYE_HEIGHT = 1.7;
let isGrounded   = true;
let jumpsRemaining = 2;
let screenShakeIntensity = 0;

// Slide
let isSliding          = false;
const SLIDE_EYE_HEIGHT = 1.2;
const SLIDE_SPEED      = 2.0;
let targetEyeHeight  = EYE_HEIGHT;
let currentEyeHeight = EYE_HEIGHT;

// Particles
let activeParticles = [];
const MAX_PARTICLES = 200;

// Audio
let audioCtx = null;

// Easter egg
let easterPortalAdded = false;

// ============================================================================
// WEBGL CHECK & LAZY INIT
// ============================================================================

function isWebGLSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const isMobile = /Mobi|Android|iPhone|iPad|tablet/i.test(navigator.userAgent);

if (isWebGLSupported() && !isMobile) {
  window.addEventListener('ag:enterFPS', () => {
    try { initFPSWorld(); }
    catch (err) { console.error('[World] Init failed:', err); showError(err.message); }
  }, { once: true });
}

// ============================================================================
// AUDIO
// ============================================================================

function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { audioCtx = new AC(); } catch (e) { /* silent */ }
}

function playTone(f1, f2, dur, vol = 0.2) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur);
  } catch (e) { /* silent */ }
}

// ============================================================================
// INIT
// ============================================================================

function initFPSWorld() {
  console.log('[World] Starting...');

  const root   = document.getElementById('fps-world-root');
  const canvas = document.getElementById('fps-canvas');
  if (!root || !canvas) throw new Error('Missing DOM elements');

  root.style.display = 'block';
  const loadEl = document.getElementById('fps-load-indicator');
  if (loadEl) loadEl.style.display = 'block';

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
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, EYE_HEIGHT, 0);
  currentEyeHeight = EYE_HEIGHT;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(Math.max(window.innerWidth, 320), Math.max(window.innerHeight, 240));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled  = true;
  renderer.shadowMap.type     = THREE.PCFSoftShadowMap;

  canvas.addEventListener('webglcontextlost', e => e.preventDefault());

  // Lighting
  sunLight = new THREE.DirectionalLight(0xff6a00, 0.4);
  sunLight.position.set(60, 8, 60);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5; sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -80;
  sunLight.shadow.camera.right = sunLight.shadow.camera.top   =  80;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x3d1a00, 1.2));
  scene.add(new THREE.HemisphereLight(0xff7a20, 0x1a0800, 0.5));

  // World
  addSkyDome();
  addHorizonGlow();
  addGodRays();
  addGroundMist();
  buildGround();
  buildWater();
  buildForestTrees();

  initPortals(scene);
  initParticles(scene);

  // Controls
  controls = new PointerLockControls(camera, document.body);
  scene.add(controls.object);
  clock = new THREE.Clock();

  bindUIEvents();
  bindKeys();
  window.addEventListener('resize', onResize);
  window.addEventListener('ag:easterEgg', onEasterEgg);

  console.log('[World] Ready');
  setTimeout(() => {
    if (loadEl) loadEl.style.display = 'none';
    const ss = document.getElementById('fps-start-screen');
    if (ss) ss.style.display = 'flex';
  }, 300);
}

function showError(detail) {
  const root = document.getElementById('fps-world-root');
  if (root) root.style.display = 'none';
  ['header','footer'].forEach(s => { const e = document.querySelector(s); if (e) e.style.display = ''; });
  const inp = document.querySelector('.centered-input'); if (inp) inp.style.display = '';

  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.92);color:#fff;padding:2rem;border-radius:8px;max-width:480px;text-align:center;font-family:monospace;z-index:99999';
  div.innerHTML = `<h2 style="color:#ff7a50;margin:0 0 .8rem">Forest path blocked</h2><p style="opacity:.7;margin:0 0 1.5rem;font-size:.85rem">${detail || 'Unknown error'}</p><button id="err-retry" style="background:#d4641a;color:#fff;border:none;padding:.7rem 1.4rem;border-radius:4px;cursor:pointer;margin-right:.5rem">Retry</button><button id="err-back" style="background:transparent;color:#fff;border:1px solid #555;padding:.7rem 1.4rem;border-radius:4px;cursor:pointer">Back to site</button>`;
  document.body.appendChild(div);
  document.getElementById('err-retry').onclick = () => { div.remove(); initFPSWorld(); };
  document.getElementById('err-back').onclick  = () => div.remove();
}

// ============================================================================
// SKY & ATMOSPHERE  (pure THREE — no extra imports)
// ============================================================================

function addSkyDome() {
  // Outer dome: deep pre-dawn
  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(440, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x06040c, side: THREE.BackSide })
  );
  scene.add(outer);

  // Inner gradient band — warm amber at horizon, fading upward
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(430, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x3a1500, side: THREE.BackSide, transparent: true, opacity: 0.55 })
  );
  scene.add(inner);

  // Star field
  const STARS = 1600;
  const sp = new Float32Array(STARS * 3);
  const sc = new Float32Array(STARS * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0xffe8cc), new THREE.Color(0xffd0a0), new THREE.Color(0xffe4b5)];
  for (let i = 0; i < STARS; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 420;
    sp[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    sp[i*3+1] = Math.abs(r * Math.cos(phi)); // only upper hemisphere
    sp[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const c = palette[Math.floor(Math.random() * palette.length)];
    sc[i*3] = c.r; sc[i*3+1] = c.g; sc[i*3+2] = c.b;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(sc, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.7, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.85 })));
}

function addHorizonGlow() {
  // Warm band around the horizon in sun's direction
  const az = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const geo = new THREE.PlaneGeometry(140, 35);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.38, 0.08),
    transparent: true, opacity: 0.1,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const glow = new THREE.Mesh(geo, mat);
  glow.position.set(Math.cos(az) * 30, 5, Math.sin(az) * 30);
  glow.lookAt(0, 5, 0);
  scene.add(glow);
}

function addGodRays() {
  const az = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
  const bx = Math.cos(az), bz = Math.sin(az);
  for (let i = 0; i < 9; i++) {
    const len = 90 + Math.random() * 70;
    const wid = 5  + Math.random() * 9;
    const geo = new THREE.PlaneGeometry(wid, len);
    geo.translate(0, len * 0.5, 0);
    const baseOp = 0.012 + Math.random() * 0.022;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.65, 0.25), transparent: true, opacity: baseOp,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ray = new THREE.Mesh(geo, mat);
    const sp = 22;
    ray.position.set(bx*38 + (Math.random()-.5)*sp, 2+Math.random()*6, bz*38 + (Math.random()-.5)*sp);
    ray.lookAt((Math.random()-.5)*10, -30, (Math.random()-.5)*10);
    ray.rotateX(Math.PI/2 + (Math.random()-.5)*0.4);
    ray.rotateZ((Math.random()-.5)*0.6);
    scene.add(ray);
    godRays.push({ mesh: ray, baseOp, phase: Math.random() * Math.PI * 2 });
  }
}

function addGroundMist() {
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.PlaneGeometry(35 + Math.random()*45, 20 + Math.random()*30);
    const baseOp = 0.06 + Math.random() * 0.08;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.75, 0.5), transparent: true, opacity: baseOp,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    const bx = (Math.random()-.5)*50, bz = (Math.random()-.5)*50;
    m.position.set(bx, 0.2 + Math.random()*0.5, bz);
    m.userData = { baseOp, bx, bz, phase: Math.random()*Math.PI*2, dx: (Math.random()-.5)*0.4, dz: (Math.random()-.5)*0.4 };
    scene.add(m);
    mistPlanes.push(m);
  }
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
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a1506, emissive: 0x3d1200, emissiveIntensity: 0.15, roughness: 1, flatShading: true }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Amber/rose stones
  const hues = [0.06, 0.09, 0.04, 0.7];
  for (let i = 0; i < 40; i++) {
    const x = (Math.random()-.5)*50, z = (Math.random()-.5)*50, h = 0.3 + Math.random()*0.8;
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
  const palettes  = [{ trunk:0x1a0800, foliage:0xff6600 },{ trunk:0x120400, foliage:0xff9933 },{ trunk:0x0d0200, foliage:0xcc3300 },{ trunk:0x1a0d00, foliage:0xffcc44 }];
  positions.forEach(([x,z]) => {
    const h = 10 + Math.random()*5;
    const p = palettes[Math.floor(Math.random()*palettes.length)];
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,h,5), new THREE.MeshStandardMaterial({ color:p.trunk, roughness:0.95, flatShading:true }));
    trunk.position.set(x,h/2,z); trunk.castShadow=true; scene.add(trunk);
    [0.8,0.55,0.35].forEach((sc,tier) => {
      const ch=h*0.55*sc, cr=h*0.45*sc;
      const f = new THREE.Mesh(new THREE.ConeGeometry(cr,ch,6), new THREE.MeshStandardMaterial({ color:new THREE.Color(p.foliage).multiplyScalar(0.35+tier*.15), emissive:new THREE.Color(p.foliage), emissiveIntensity:0.12+tier*.08, roughness:0.8, flatShading:true }));
      f.position.set(x,h*(0.5+tier*.25),z); f.castShadow=true; scene.add(f);
    });
  });
}

// ============================================================================
// INPUT & UI
// ============================================================================

function bindKeys() {
  document.addEventListener('keydown', e => {
    initAudio();
    if (e.code==='KeyW') keys.w=true;
    if (e.code==='KeyA') keys.a=true;
    if (e.code==='KeyS') keys.s=true;
    if (e.code==='KeyD') keys.d=true;
    if (e.code==='ShiftLeft'||e.code==='ShiftRight') keys.shift=true;
    if (e.code==='Space') {
      e.preventDefault();
      if (jumpsRemaining > 0) {
        jumpVelocity = jumpsRemaining===2 ? JUMP_POWER : JUMP_POWER*0.8;
        jumpsRemaining--; isGrounded=false;
        playTone(200, 400, 0.1, 0.3);
      }
    }
    if (e.code==='KeyE' && activePortalURL) window.location.href = activePortalURL;
    updateKeyVisuals(e.code, true);
  });
  document.addEventListener('keyup', e => {
    if (e.code==='KeyW') keys.w=false;
    if (e.code==='KeyA') keys.a=false;
    if (e.code==='KeyS') keys.s=false;
    if (e.code==='KeyD') keys.d=false;
    if (e.code==='ShiftLeft'||e.code==='ShiftRight') keys.shift=false;
    updateKeyVisuals(e.code, false);
  });
}

const CODE_TO_KEY = { KeyW:'W', KeyA:'A', KeyS:'S', KeyD:'D', ShiftLeft:'Shift', ShiftRight:'Shift' };
function updateKeyVisuals(code, active) {
  const key = CODE_TO_KEY[code];
  if (!key) return;
  const el = document.querySelector(`[data-key="${key}"]`);
  if (el) el.classList.toggle('active', active);
}

function bindUIEvents() {
  const startBtn  = document.getElementById('fps-start-btn');
  const resumeBtn = document.getElementById('fps-resume-btn');
  const exitLink  = document.getElementById('fps-exit-link');

  const tryLock = () => { document.body.focus(); controls.lock(); };
  if (startBtn)  startBtn.addEventListener('click',  tryLock);
  if (resumeBtn) resumeBtn.addEventListener('click', tryLock);
  if (exitLink)  exitLink.addEventListener('click', e => { e.preventDefault(); exitFPSMode(); });

  document.addEventListener('pointerlockerror', () => {
    console.warn('[World] Pointer lock denied — click the button again');
  });

  controls.addEventListener('lock', () => {
    document.getElementById('fps-start-screen').style.display  = 'none';
    document.getElementById('fps-paused-screen').style.display = 'none';
    document.getElementById('fps-hud').style.display           = 'block';
    if (!animationRunning) startLoop();
  });

  controls.addEventListener('unlock', () => {
    document.getElementById('fps-hud').style.display           = 'none';
    document.getElementById('fps-paused-screen').style.display = 'flex';
  });
}

function exitFPSMode() {
  controls.unlock();
  if (animationRunning) { cancelAnimationFrame(animationFrameId); animationRunning = false; }
  for (let i = activeParticles.length-1; i >= 0; i--) {
    const p = activeParticles[i]; scene.remove(p); p.geometry?.dispose(); p.material?.dispose();
  }
  activeParticles = [];
  document.getElementById('fps-world-root').style.display = 'none';
  const h=document.querySelector('header'), f=document.querySelector('footer'), inp=document.querySelector('.centered-input');
  if(h)h.style.display=''; if(f)f.style.display=''; if(inp)inp.style.display='';
}

// ============================================================================
// GAMEPLAY
// ============================================================================

function tickMovement() {
  if (!controls.isLocked) return;
  const pos    = controls.object.position;
  const moving = keys.w||keys.a||keys.s||keys.d;

  jumpVelocity -= GRAVITY * delta;
  pos.y        += jumpVelocity * delta;

  if (pos.y <= EYE_HEIGHT && jumpVelocity < 0) {
    if (Math.abs(jumpVelocity) > 3) { screenShakeIntensity = 0.15; playTone(100, null, 0.15, 0.2); }
    pos.y=EYE_HEIGHT; jumpVelocity=0; isGrounded=true; jumpsRemaining=2;
  } else if (pos.y > EYE_HEIGHT+0.1) { isGrounded=false; }

  if (keys.shift&&moving&&isGrounded&&!isSliding)  { isSliding=true;  targetEyeHeight=SLIDE_EYE_HEIGHT; }
  if ((!keys.shift||!moving)&&isSliding)            { isSliding=false; targetEyeHeight=EYE_HEIGHT; }
  currentEyeHeight += (targetEyeHeight-currentEyeHeight) * 0.15;

  const speed = MOVE_SPEED * (isSliding ? SLIDE_SPEED : keys.shift ? SPRINT_MULTIPLIER : 1) * delta;
  if (keys.w) controls.moveForward(speed);
  if (keys.s) controls.moveForward(-speed);
  if (keys.a) controls.moveRight(-speed);
  if (keys.d) controls.moveRight(speed);

  const flat = Math.sqrt(pos.x*pos.x+pos.z*pos.z);
  if (flat > BOUNDARY_RADIUS) { const a=Math.atan2(pos.z,pos.x); pos.x=Math.cos(a)*BOUNDARY_RADIUS; pos.z=Math.sin(a)*BOUNDARY_RADIUS; }
  if (pos.y < EYE_HEIGHT) { pos.y=EYE_HEIGHT; jumpVelocity=0; }
  pos.y += currentEyeHeight - EYE_HEIGHT;

  if (screenShakeIntensity > 0) {
    pos.x += (Math.random()-.5)*screenShakeIntensity;
    pos.z += (Math.random()-.5)*screenShakeIntensity;
    screenShakeIntensity *= 0.85;
    if (screenShakeIntensity < 0.01) screenShakeIntensity = 0;
  }
}

function spawnBurst(position) {
  if (activeParticles.length >= MAX_PARTICLES) return;
  const n = Math.min(6, MAX_PARTICLES - activeParticles.length);
  for (let i=0;i<n;i++) {
    const a = (i/n)*Math.PI*2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1,4,4), new THREE.MeshBasicMaterial({ color:0xff8800, transparent:true, opacity:0.6 }));
    p.position.copy(position);
    p.userData = { vel:new THREE.Vector3(Math.cos(a)*0.5,2,Math.sin(a)*0.5), life:0.5, age:0 };
    scene.add(p); activeParticles.push(p);
  }
}

// ============================================================================
// DAWN TICK
// ============================================================================

function tickDawn(t) {
  dawnTime = Math.min(dawnTime + delta * DAWN_SPEED, 1.0);

  // Sun light warms and rises
  if (sunLight) {
    sunLight.color.lerpColors(new THREE.Color(0xff6a00), new THREE.Color(0xfff5cc), dawnTime);
    sunLight.intensity = 0.4 + dawnTime * 1.2;
    const elev = 1.2 + dawnTime * 20;
    const phi = THREE.MathUtils.degToRad(90 - elev);
    const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH_DEG);
    sunLight.position.setFromSphericalCoords(100, phi, theta);
  }

  // Fog warms
  if (scene.fog) {
    scene.fog.color.lerpColors(new THREE.Color(0xd4641a), new THREE.Color(0xf0c878), dawnTime);
    renderer.setClearColor(scene.fog.color);
  }

  // God rays pulse
  for (const r of godRays) {
    r.mesh.material.opacity = r.baseOp * (0.7 + 0.3*Math.sin(t*0.25+r.phase)) * (0.4 + dawnTime*0.8);
    r.mesh.material.color.setRGB(1.0, 0.55+dawnTime*0.2, 0.1+dawnTime*0.05);
  }

  // Mist drifts and burns off
  for (const m of mistPlanes) {
    const u = m.userData;
    m.position.x = u.bx + Math.sin(t*u.dx + u.phase)*4;
    m.position.z = u.bz + Math.cos(t*u.dz + u.phase)*3;
    const burnOff = dawnTime > 0.7 ? 1-(dawnTime-0.7)/0.3 : 1.0;
    m.material.opacity = u.baseOp * burnOff * (0.7 + 0.3*Math.sin(t*0.15));
  }

  // Water glows
  if (waterMat && waterAnimStartTime) {
    const e = (Date.now()-waterAnimStartTime)*0.0001;
    waterMat.emissiveIntensity = 0.3 + dawnTime*0.5 + Math.sin(e*3)*0.1;
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
  if (!isFinite(delta)||delta<0||delta>0.2) delta=0.016;
  delta = Math.min(delta, 0.05);

  tickMovement();

  // Burst particles
  for (let i=activeParticles.length-1;i>=0;i--) {
    const p = activeParticles[i];
    p.userData.age += delta;
    const prog = p.userData.age / p.userData.life;
    if (prog >= 1) { scene.remove(p); p.geometry?.dispose(); p.material?.dispose(); activeParticles.splice(i,1); }
    else { p.position.addScaledVector(p.userData.vel, delta); p.userData.vel.y -= GRAVITY*delta; if(p.material) p.material.opacity=0.6*(1-prog); }
  }

  const t = performance.now()*0.001;
  activePortalURL = updatePortalProximity(camera, document.getElementById('fps-portal-tooltip'), document.getElementById('fps-portal-name'));
  animatePortals();
  tickParticles(t);
  tickDawn(t);

  renderer.render(scene, camera);
}

function onResize() {
  const W=Math.max(window.innerWidth,320), H=Math.max(window.innerHeight,240);
  camera.aspect=W/H; camera.updateProjectionMatrix();
  try { renderer.setSize(W,H); } catch(e) { /* ignore */ }
}

// ============================================================================
// EASTER EGG
// ============================================================================

function onEasterEgg() {
  if (easterPortalAdded) return;
  easterPortalAdded = true;
  const DATA = { label:'1153', url:'./projects/index.html', color:0xff1493 };
  const torus = new THREE.Mesh(new THREE.TorusGeometry(2.8,0.18,12,48), new THREE.MeshStandardMaterial({ color:DATA.color, emissive:DATA.color, emissiveIntensity:2, roughness:0.2, metalness:0.8 }));
  torus.position.y=2.5; torus.rotateX(Math.PI/2); scene.add(torus);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6,48), new THREE.MeshBasicMaterial({ color:DATA.color, transparent:true, opacity:0.25, side:THREE.DoubleSide }));
  disc.position.copy(torus.position); disc.rotation.copy(torus.rotation); scene.add(disc);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,2.5,8), new THREE.MeshStandardMaterial({ color:DATA.color, emissive:DATA.color, emissiveIntensity:1 }));
  pillar.position.y=1.25; scene.add(pillar);
  const label = makeLabelSprite(DATA.label, DATA.color);
  label.position.y=5.5; label.scale.set(8,2,1); scene.add(label);
  const light = new THREE.PointLight(DATA.color,2,25); light.position.y=2.5; scene.add(light);
  scene.userData.easterPortal = { position:new THREE.Vector3(), data:DATA, torus, light };
}

function makeLabelSprite(text, color) {
  const c = document.createElement('canvas'); c.width=512; c.height=128;
  const ctx = c.getContext('2d');
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.roundRect(8,8,496,112,20); ctx.fill();
  ctx.fillStyle='#'+color.toString(16).padStart(6,'0');
  ctx.font='bold 56px Barlow,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text.toUpperCase(),256,64);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true }));
}
