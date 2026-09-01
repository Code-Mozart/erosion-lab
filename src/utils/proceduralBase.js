import * as THREE from 'three';

export function generateProceduralBaseTexture(resolution = 512) {
  const data = new Float32Array(resolution * resolution * 4);

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const idx = (y * resolution + x) * 4;
      const nx = x / resolution - 0.5;
      const ny = y / resolution - 0.5;
      const dist = Math.hypot(nx, ny);

      // Base fBM height
      let h = (Math.sin(nx * 12.0) * Math.cos(ny * 12.0) * 0.35 + 0.5);
      h += Math.sin(nx * 24.0 + ny * 18.0) * 0.12;

      // Radial island mask falloff
      const island = Math.max(0.0, 1.0 - dist * 2.1);
      h = Math.max(0.0, h * island);

      data[idx] = h;
      data[idx + 1] = h;
      data[idx + 2] = h;
      data[idx + 3] = 1.0;
    }
  }

  const texture = new THREE.DataTexture(
    data, resolution, resolution, THREE.RGBAFormat, THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
}