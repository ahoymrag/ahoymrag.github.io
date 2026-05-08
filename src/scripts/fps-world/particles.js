import * as THREE from 'three';

let particleSystem;
let bokehParticles;
const PARTICLE_COUNT = 1500;
const BOKEH_COUNT = 200;

export function initParticles(scene) {
  // =========== BOKEH / DEPTH OF FIELD PARTICLES ===========
  // Soft blurred particles in foreground and background for cinematic feel

  const bokehPositions = new Float32Array(BOKEH_COUNT * 3);
  const bokehSizes = new Float32Array(BOKEH_COUNT);

  for (let i = 0; i < BOKEH_COUNT; i++) {
    // Distribute widely to create depth
    const r = Math.random() * 150 + 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    bokehPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    bokehPositions[i * 3 + 1] = r * Math.cos(phi) * 15 + Math.random() * 40 - 20;
    bokehPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    bokehSizes[i] = Math.random() * 8 + 2;
  }

  const bokehGeo = new THREE.BufferGeometry();
  bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPositions, 3));
  bokehGeo.setAttribute('size', new THREE.BufferAttribute(bokehSizes, 1));

  const bokehMat = new THREE.PointsMaterial({
    size: 1.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.12,
    color: 0xffaa44, // warm amber bokeh
  });

  bokehParticles = new THREE.Points(bokehGeo, bokehMat);
  scene.add(bokehParticles);

  // =========== FLOATING DUST/SEED PARTICLES ===========
  // Organic particles drifting through the forest air

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  // Dawn dust mote palette — catching first light
  const palette = [
    new THREE.Color(0xffcc44), // golden
    new THREE.Color(0xff8800), // amber
    new THREE.Color(0xffeeaa), // pale gold
    new THREE.Color(0xff6600), // deep orange
    new THREE.Color(0xffdd88), // warm white-gold
    new THREE.Color(0xffffff), // white light
    new THREE.Color(0xff9933), // orange-gold
    new THREE.Color(0xffbb55), // medium amber
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute around and above the player
    const r = Math.random() * 70 + 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.random() * 50 - 10; // Can go below ground for depth
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 0.8 + 0.2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.4,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  });

  particleSystem = new THREE.Points(geo, mat);
  scene.add(particleSystem);
}

export function tickParticles(t) {
  if (particleSystem) {
    // Slow rotation for organic drift
    particleSystem.rotation.y = t * 0.01;
    particleSystem.rotation.x = Math.sin(t * 0.3) * 0.1;

    // Subtle vertical bob
    const posAttr = particleSystem.geometry.getAttribute('position');
    const positions = posAttr.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Simple sine-based vertical oscillation
      const originalY = positions[i + 1];
      positions[i + 1] = originalY + Math.sin(t * 0.5 + i) * 0.5;
    }

    posAttr.needsUpdate = true;

    // Pulsing opacity for ethereal effect
    particleSystem.material.opacity = 0.45 + Math.sin(t * 0.7) * 0.2;
  }

  if (bokehParticles) {
    // Slower rotation for background bokeh
    bokehParticles.rotation.y = t * 0.002;
  }
}
