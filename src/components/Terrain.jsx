import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useState } from "react";

export default function Terrain() {
  const [isWireframe, setIsWireframe] = useState(false);
  const materialRef = useRef();
  const pointerDownPos = useRef({ x: 0, y: 0 });

  // Update uniforms in the render loop
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime += delta * 1.4;
    }
  });

  const handlePointerDown = (e) => {
    if (e.button != 0) return;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    if (e.button != 0) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const distance = Math.hypot(dx, dy);

    // Only toggle wireframe if mouse moved less than 3-5 pixels (a intentional click)
    if (distance < 5) {
      setIsWireframe((prev) => !prev);
    }
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[20, 20, 32, 32]} />
      <customPlaneMaterial
        ref={materialRef}
        uColor="#67d5e9"
        wireframe={isWireframe}
      />
    </mesh>
  );
}
