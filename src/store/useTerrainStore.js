import { create } from "zustand";
import * as THREE from "three";
import { PARAMETERS } from "../config/parameters";
import { getSetterName } from "../utils/parameterUtils";

const DEFAULT_PLANE_SIZE = 10.0;
export const MAX_HEIGHT_BOUNDS = [0.0, 1.0];

export const useTerrainStore = create((set, get) => ({
  planeSize: [DEFAULT_PLANE_SIZE, DEFAULT_PLANE_SIZE],
  texture: null,
  shaderVersion: 0,

  ...createParameters(set),

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

function createParameters(set) {
  const res = {};

  const createContinousParameter = (p) => {
    res[p.identifier] = p.initialValue;
    res[getSetterName(p)] = (arg) => {
      set({ [p.identifier]: arg });
    };
  };

  const createEnumParameter = (p) => {
    res[p.identifier] = p.map.indexOf(p.initialValue);
    res[getSetterName(p)] = (arg) => {
      set({ [p.identifier]: arg });
    };
  };

  PARAMETERS.forEach((p) => {
    if (p.type === "enum") {
      createEnumParameter(p);
    } else {
      createContinousParameter(p);
    }
  });
  return res;
}
