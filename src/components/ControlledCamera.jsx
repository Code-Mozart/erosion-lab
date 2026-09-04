import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils } from "three";

export default function ControlledCamera() {
  const controlsRef = useRef();

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.y = 0;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      screenSpacePanning={false}
      minPolarAngle={MathUtils.degToRad(5)}
      maxPolarAngle={MathUtils.degToRad(89.99)}
    />
  );
}
