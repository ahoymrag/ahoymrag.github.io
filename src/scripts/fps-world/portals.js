import * as THREE from 'three';

const PORTAL_RING_RADIUS = 28;
const PORTAL_COUNT = 7;
const PROXIMITY_THRESHOLD = 9;

// Portal data with warm forest-inspired colors and nature-themed names
const PORTAL_DATA = [
  { label: 'Portfolio',        url: './share/index.html',                color: 0x76c043 }, // Forest green
  { label: 'Behind the Scenes',url: './portfolio/src/bts/bts.html',      color: 0xd4af37 }, // Golden
  { label: 'About',            url: './portfolio/src/about.html',         color: 0xef5c3b }, // Warm orange
  { label: 'Experiments',      url: './experiments/index.html',           color: 0x5dade2 }, // Sky blue
  { label: 'Teaching',         url: '/teaching-credentials.html',         color: 0xf39c12 }, // Amber
  { label: 'Photography',      url: './photography/index.html',           color: 0xaf7ac5 }, // Purple
  { label: 'Paint',            url: './gallery/index.html',               color: 0x1abc9c }, // Teal
];

const portalMeshes = [];

export function initPortals(scene) {
  const group = new THREE.Group();

  PORTAL_DATA.forEach((data, i) => {
    const angle = (i / PORTAL_COUNT) * Math.PI * 2;
    const x = Math.sin(angle) * PORTAL_RING_RADIUS;
    const z = Math.cos(angle) * PORTAL_RING_RADIUS;
    const position = new THREE.Vector3(x, 0, z);

    // Portal frame: torus (glowing ring)
    const torusGeo = new THREE.TorusGeometry(2.2, 0.14, 12, 48);
    const torusMat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.7,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.copy(position);
    torus.position.y = 2.2;
    torus.lookAt(new THREE.Vector3(0, 2.2, 0));
    torus.rotateX(Math.PI / 2);
    torus.castShadow = true;
    torus.receiveShadow = true;
    group.add(torus);

    // Inner portal disc
    const discGeo = new THREE.CircleGeometry(2.05, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.copy(torus.position);
    disc.rotation.copy(torus.rotation);
    group.add(disc);

    // Vertical pillar grounds the portal
    const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 0.6,
      roughness: 0.6,
      metalness: 0.3,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, 1.1, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);

    // Portal label sprite
    const labelSprite = makeLabelSprite(data.label, data.color);
    labelSprite.position.set(x, 4.8, z);
    labelSprite.scale.set(7, 1.8, 1);
    group.add(labelSprite);

    // Point light - portal glows into the forest
    const light = new THREE.PointLight(data.color, 1.6, 20);
    light.position.set(x, 2.2, z);
    light.castShadow = true;
    group.add(light);

    portalMeshes.push({
      torus,
      light,
      data,
      position: new THREE.Vector3(x, 0, z),
      disc,
      pillar,
    });
  });

  scene.add(group);
  return group;
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

  // Check easter egg portal if it exists
  if (nearest === null) {
    const easterPortal = camera.parent.parent?.userData?.easterPortal;
    if (easterPortal) {
      const dx = camPos.x - easterPortal.position.x;
      const dz = camPos.z - easterPortal.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < PROXIMITY_THRESHOLD) {
        tooltipEl.style.display = 'flex';
        nameEl.textContent = easterPortal.data.label;
        return easterPortal.data.url;
      }
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
    p.torus.material.emissiveIntensity = 0.9 + Math.sin(t * 1.5) * 0.4;
  }
}
