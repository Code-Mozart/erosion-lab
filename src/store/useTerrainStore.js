import { create } from "zustand";
import * as THREE from "three";

export const useTerrainStore = create((set, get) => ({
  maxHeight: 2.5,
  resolution: 32,
  texture: null,
  materialRef: null,

  setMaterialRef: (ref) => set({ materialRef: ref }),
  setMaxHeight: (maxHeight) => set({ maxHeight }),
  setResolution: (resolution) => set({ resolution }),

  reloadShader: () => {
    const { materialRef } = get();
    if (materialRef) {
      // Tells Three.js to recompile GLSL code directly without state version counters
      materialRef.needsUpdate = true;
    }
  },

  uploadTexture: (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    new THREE.TextureLoader().load(url, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      set({ texture: loaded });
    });
  },
}));
