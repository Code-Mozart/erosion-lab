import { create } from "zustand";
import * as THREE from "three";

const DEFAULT_PLANE_SIZE = 10.0;
export const MAX_HEIGHT_BOUNDS = [0.0, 1.0];

export const useTerrainStore = create((set, get) => ({
  maxHeight: 0.25,
  planeSize: [DEFAULT_PLANE_SIZE, DEFAULT_PLANE_SIZE],
  resolution: 32,
  texture: null,
  shaderVersion: 0,
  debugMode: 0,

  octaves: 3,
  frequency: 5.0,
  blendRadius: 1.5,

  setMaxHeight: (maxHeight) => set({ maxHeight }),
  setResolution: (resolution) => set({ resolution }),
  setDebugMode: (debugMode) => set({ debugMode }),

  setOctaves: (octaves) => set({ octaves }),
  setFrequency: (frequency) => set({ frequency }),
  setBlendRadius: (blendRadius) => set({ blendRadius }),

  reloadShader: () => {
    const { shaderVersion: oldVersion } = get();
    set({ shaderVersion: oldVersion + 1 });
    console.log("Update shader!");
  },

  uploadTexture: (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    new THREE.TextureLoader().load(url, (loaded) => {
      loaded.colorSpace = THREE.NoColorSpace;
      set({ texture: loaded });
      set({ planeSize: calculatePlaneSize(loaded) });
    });
  },
}));

function calculatePlaneSize(heightmap) {
  if (!heightmap || !heightmap.image) {
    return [DEFAULT_PLANE_SIZE, DEFAULT_PLANE_SIZE];
  }

  const { width, height } = heightmap.image;

  if (width > height) {
    const aspectRatio = height / width;
    return [
      Math.round(DEFAULT_PLANE_SIZE),
      Math.round(DEFAULT_PLANE_SIZE) * aspectRatio,
    ];
  } else {
    const aspectRatio = width / height;
    return [
      Math.round(DEFAULT_PLANE_SIZE) * aspectRatio,
      Math.round(DEFAULT_PLANE_SIZE),
    ];
  }
}
