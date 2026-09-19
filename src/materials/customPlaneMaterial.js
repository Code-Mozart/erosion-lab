import { shaderMaterial } from "@react-three/drei";
import { Color, Texture, UniformsLib } from "three";
import customPlaneVert from "../shaders/customPlane.vert";
import customPlaneFrag from "../shaders/customPlane.frag";

export const CustomPlaneMaterial = shaderMaterial(
  {
    ...UniformsLib.lights, // Spreads standard lighting uniforms
    uTime: 0,
    uTexture: new Texture(),
    uMaxHeight: 2.5,
    uDebugMode: 0,
    uOctaves: 3,
    uFrequency: 4.0,
    uAmplitude: 0.1,
    uCellSize: 1.5,
    uBlendRadius: 1.5,
    uValleyAltitude: 0.0,
    uPeakAltitude: 2.5,
    uDetail: 1.0,
    uWaterLevel: 0.0,
  },

  customPlaneVert,
  customPlaneFrag,

  (material) => {
    if (material) {
      // Enables automatic injection of directionalLights uniforms
      material.lights = true;
    }
  },
);
