import { create } from "zustand";
import * as THREE from "three";

export const useTerrainStore = create((set, get) => ({
  maxHeight: 2.5,
  resolution: 32,
  texture: null,
  shaderVersion: 0,
  debugMode: 0,

  setMaxHeight: (maxHeight) => set({ maxHeight }),
  setResolution: (resolution) => set({ resolution }),
  setDebugMode: (debugMode) => set({ debugMode }),

  reloadShader: () => {
    const { shaderVersion: oldVersion } = get();
    set({ shaderVersion: oldVersion + 1 });
    console.log("Update shader!");
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
