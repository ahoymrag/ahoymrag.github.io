import * as THREE from 'three';

const PORTAL_RING_RADIUS = 28;
const PORTAL_COUNT = 7;
const PROXIMITY_THRESHOLD = 9;

// Portal data with CMYK high-contrast game colors
const PORTAL_DATA = [
  { label: 'Portfolio',         url: './share/index.html',               color: 0xff00ff, type: 'torii' },        // Magenta
  { label: 'Behind the Scenes', url: './portfolio/src/bts/bts.html',     color: 0x00ffff, type: 'cave' },         // Cyan
  { label: 'About',             url: './portfolio/src/about.html',        color: 0xffff00, type: 'treehouse' },    // Yellow
  { label: 'Experiments',       url: './experiments/index.html',          color: 0xff00ff, type: 'cave' },         // Magenta
  { label: 'Teaching',          url: '/teaching-credentials.html',        color: 0x00ffff, type: 'torii' },        // Cyan
  { label: 'Photography',       url: './photography/index.html',          color: 0xffff00, type: 'treehouse' },    // Yellow
  { label: 'Paint',             url: './gallery/index.html',              color: 0xff00ff, type: 'torii' },        // Magenta
];

const portalMeshes = [];

export function initPortals(scene) {
  const group = new THREE.Group();

  PORTAL_DATA.forEach((data, i) => {
    const angle = (i / PORTAL_COUNT) * Math.PI * 2;
    const x = Math.sin(angle) * PORTAL_RING_RADIUS;
    const z = Math.cos(angle) * PORTAL_RING_RADIUS;
    const position = new THREE.Vector3(x, 0, z);

    // Build portal structure based on type
    let structureMeshes;
    if (data.type === 'torii') {
      structureMeshes = buildToriiPortal(group, position, data);
    } else if (data.type === 'stone_circle') {
      structureMeshes = buildStoneCirclePortal(group, position, data);
    } else if (data.type === 'cave') {
      structureMeshes = buildCavePortal(group, position, data);
    } else { // treehouse
      structureMeshes = buildTreehousePortal(group, position, data);
    }

    // Portal label sprite
    const labelSprite = makeLabelSprite(data.label, data.color);
    labelSprite.position.set(x, 6.0, z);
    labelSprite.scale.set(8, 2, 1);
    group.add(labelSprite);

    // Point light (very intense for CMYK vibe)
    const light = new THREE.PointLight(data.color, 5.0, 30);
    light.position.set(x, 3, z);
    light.castShadow = true;
    group.add(light);

    portalMeshes.push({
      primary: structureMeshes.primary,
      light,
      data,
      position: new THREE.Vector3(x, 0, z),
      disc: structureMeshes.disc,
    });
  });

  scene.add(group);
  return group;
}

function buildToriiPortal(group, position, data) {
  const { x, z } = { x: position.x, z: position.z };
  const toriiColor = data.color;
  
  // Pillars (Black)
  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 5, 4);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: toriiColor,
    emissiveIntensity: 0.2,
    roughness: 0.1,
    metalness: 1.0,
  });

  [[-2, 0], [2, 0]].forEach(([ox, oz]) => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x + ox, 2.5, z + oz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Neon Crossbeam
  const kasagiGeo = new THREE.BoxGeometry(5.5, 0.5, 0.6);
  const kasagiMat = new THREE.MeshStandardMaterial({
    color: toriiColor,
    emissive: toriiColor,
    emissiveIntensity: 2.0,
  });
  const kasagi = new THREE.Mesh(kasagiGeo, kasagiMat);
  kasagi.position.set(x, 5.2, z);
  kasagi.rotation.y = Math.atan2(x, z) + Math.PI / 2;
  group.add(kasagi);

  // Floating Disc
  const discGeo = new THREE.TorusGeometry(1.8, 0.1, 16, 32);
  const discMat = new THREE.MeshBasicMaterial({ color: toriiColor });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.set(x, 2.5, z);
  disc.lookAt(0, 2.5, 0);
  group.add(disc);

  return { primary: kasagi, disc };
}

function buildStoneCirclePortal(group, position, data) {
  const { x, z } = { x: position.x, z: position.z };
  const stoneCount = 8;
  const ringR = 2.4;

  for (let s = 0; s < stoneCount; s++) {
    const a = (s / stoneCount) * Math.PI * 2;
    const sx = x + Math.cos(a) * ringR;
    const sz = z + Math.sin(a) * ringR;

    const stoneW = 0.4 + Math.random() * 0.25;
    const stoneH = 1.8 + Math.random() * 1.0;
    const stoneD = 0.3 + Math.random() * 0.2;
    const stoneGeo = new THREE.BoxGeometry(stoneW, stoneH, stoneD, 1, 1, 1);

    const sPos = stoneGeo.attributes.position;
    for (let v = 0; v < sPos.count; v++) {
      sPos.setX(v, sPos.getX(v) + (Math.random() - 0.5) * 0.1);
      sPos.setY(v, sPos.getY(v) + (Math.random() - 0.5) * 0.1);
    }
    sPos.needsUpdate = true;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      emissive: data.color,
      emissiveIntensity: 0.12,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(sx, stoneH / 2, sz);
    stone.rotation.y = a + Math.random() * 0.3;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }

  // Inner glow disc
  const discGeo = new THREE.CircleGeometry(1.8, 6);
  const discMat = new THREE.MeshBasicMaterial({
    color: data.color,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.set(x, 0.05, z);
  disc.rotation.x = -Math.PI / 2;
  group.add(disc);

  return { primary: disc, disc };
}

function buildCavePortal(group, position, data) {
  const { x, z } = { x: position.x, z: position.z };

  // Cave jambs
  const jambH = 3.5;
  const jambMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    emissive: data.color,
    emissiveIntensity: 0.08,
    roughness: 1.0,
    flatShading: true,
  });

  [-1.3, 1.3].forEach(side => {
    const jambGeo = new THREE.BoxGeometry(0.7, jambH, 0.5, 1, 2, 1);
    const jambPos = jambGeo.attributes.position;
    for (let v = 0; v < jambPos.count; v++) {
      jambPos.setX(v, jambPos.getX(v) + (Math.random() - 0.5) * 0.12);
      jambPos.setZ(v, jambPos.getZ(v) + (Math.random() - 0.5) * 0.12);
    }
    jambPos.needsUpdate = true;
    const jamb = new THREE.Mesh(jambGeo, jambMat.clone());
    jamb.position.set(x + side, jambH / 2, z);
    jamb.castShadow = true;
    group.add(jamb);
  });

  // Portal disc
  const discGeo = new THREE.PlaneGeometry(2.4, 3.0, 1, 1);
  const discMat = new THREE.MeshBasicMaterial({
    color: data.color,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.set(x, 1.5, z);
  disc.lookAt(new THREE.Vector3(0, 1.5, 0));
  group.add(disc);

  // Glowing arch trim
  const torusGeo = new THREE.TorusGeometry(1.6, 0.1, 4, 12);
  const torusMat = new THREE.MeshStandardMaterial({
    color: data.color,
    emissive: data.color,
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.8,
    flatShading: true,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(x, 2.2, z);
  torus.lookAt(new THREE.Vector3(0, 2.2, 0));
  torus.rotateX(Math.PI / 2);
  group.add(torus);

  return { primary: torus, disc };
}

function buildTreehousePortal(group, position, data) {
  const { x, z } = { x: position.x, z: position.z };
  const PLATFORM_Y = 1.8;

  // Support posts
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    emissive: data.color,
    emissiveIntensity: 0.06,
    roughness: 0.9,
    flatShading: true,
  });

  [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]].forEach(([ox, oz]) => {
    const postGeo = new THREE.CylinderGeometry(0.12, 0.16, PLATFORM_Y + 0.1, 5);
    const post = new THREE.Mesh(postGeo, postMat.clone());
    post.position.set(x + ox, (PLATFORM_Y + 0.1) / 2, z + oz);
    post.castShadow = true;
    group.add(post);
  });

  // Platform floor
  const floorGeo = new THREE.BoxGeometry(2.4, 0.25, 1.4, 2, 1, 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    emissive: data.color,
    emissiveIntensity: 0.1,
    roughness: 0.85,
    flatShading: true,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(x, PLATFORM_Y, z);
  floor.castShadow = true;
  floor.receiveShadow = true;
  group.add(floor);

  // Portal arch (half-torus)
  const torusGeo = new THREE.TorusGeometry(1.6, 0.12, 5, 10, Math.PI);
  const torusMat = new THREE.MeshStandardMaterial({
    color: data.color,
    emissive: data.color,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.7,
    flatShading: true,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(x, PLATFORM_Y + 0.25, z);
  torus.lookAt(new THREE.Vector3(0, PLATFORM_Y + 0.25, 0));
  torus.rotateX(Math.PI / 2);
  torus.rotateZ(-Math.PI / 2);
  group.add(torus);

  // Portal disc
  const discGeo = new THREE.CircleGeometry(1.5, 8);
  const discMat = new THREE.MeshBasicMaterial({
    color: data.color,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.set(x, PLATFORM_Y + 1.6, z);
  disc.lookAt(new THREE.Vector3(0, PLATFORM_Y + 1.6, 0));
  disc.rotateX(Math.PI / 2);
  group.add(disc);

  return { primary: torus, disc };
}

export function updatePortalProximity(camera, tooltipEl, nameEl) {
  const camPos = camera.position;
  let nearest = null;
  let nearestDist = Infinity;

  // Check regular portals
  for (const portal of portalMeshes) {
    const dx = camPos.x - portal.position.x;
    const dz = camPos.z - portal.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < PROXIMITY_THRESHOLD && dist < nearestDist) {
      nearest = portal;
      nearestDist = dist;
    }
  }

  if (nearest) {
    tooltipEl.style.display = 'flex';
    nameEl.textContent = nearest.data.label;
    return nearest.data.url;
  } else {
    tooltipEl.style.display = 'none';
    return null;
  }
}

function makeLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Semi-transparent pill background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 20);
  ctx.fill();

  // Text in portal color
  const hexColor = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = hexColor;
  ctx.font = 'bold 52px Barlow, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(mat);
}

// Animate portals (pulse effect)
export function animatePortals() {
  const t = performance.now() * 0.001;
  for (const p of portalMeshes) {
    p.light.intensity = 1.4 + Math.sin(t * 2.5 + p.data.color * 0.0001) * 0.5;
    if (p.primary && p.primary.material && p.primary.material.emissiveIntensity !== undefined) {
      p.primary.material.emissiveIntensity = 0.9 + Math.sin(t * 1.5) * 0.4;
    }
  }
}
