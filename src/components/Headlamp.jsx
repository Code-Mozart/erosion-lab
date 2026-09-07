import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function Headlamp({ intensity = 1 }) {
  const lightRef = useRef();

  useFrame(({ camera }, delta) => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
    }
  });

  return <directionalLight ref={lightRef} intensity={intensity} />;
}
