import { shaderMaterial } from "@react-three/drei";
import { Color, UniformsLib } from "three";
import customPlaneVert from "../shaders/customPlane.vert"
import customPlaneFrag from "../shaders/customPlane.frag"

export const CustomPlaneMaterial = shaderMaterial(
    {
      ...UniformsLib.lights, // Spreads standard lighting uniforms
      uTime: 0,
      uColor: new Color("#3b82f6"),
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