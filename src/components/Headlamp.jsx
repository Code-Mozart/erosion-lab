import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function Headlamp() {
  const lightRef = useRef();

  useFrame(({ camera }, delta) => {
    if (lightRef.current) {
      lightRef.current.position.lerp(camera.position, 0.5 * delta);
    }
  });

  return <directionalLight ref={lightRef} intensity={1} />;
}
