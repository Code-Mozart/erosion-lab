import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils } from "three";
import { useTerrainStore } from "../store/useTerrainStore";
import { useMemo } from "react";
import { useEffect } from "react";

const DEFAULT_NEAR = 0.01;
const DEFAULT_FAR = 100.0;

export default function ControlledCamera() {
  const controlsRef = useRef();
  const camera = useThree((state) => state.camera);

  const planeSize = useTerrainStore((s) => s.planeSize);

  useEffect(() => {
    const [near, far] = getClipPlanes(planeSize);

    console.log(`Set camera clip planes to near=${near}, far=${far}`);

    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }, [planeSize]);

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
      minPolarAngle={MathUtils.degToRad(5.0)}
      maxPolarAngle={MathUtils.degToRad(89.99)}
    />
  );
}

function getClipPlanes(planeSize) {
  const maxSize = Math.max(...planeSize);

  const far = maxSize * 6.0;
  const near = Math.max(DEFAULT_NEAR, far * 1e-4);

  return [near, far];
}
