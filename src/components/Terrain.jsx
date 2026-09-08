import { extend, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { CustomPlaneMaterial } from "../materials/customPlaneMaterial";
import { useTerrainStore } from "../store/useTerrainStore";

extend({ CustomPlaneMaterial });

export default function Terrain() {
  const [isWireframe, setIsWireframe] = useState(false);
  const materialRef = useRef();
  const pointerDownPos = useRef({ x: 0, y: 0 });

  // Store subscriptions
  const heightmap = useTerrainStore((s) => s.texture);
  const maxHeight = useTerrainStore((s) => s.maxHeight);
  const resolution = useTerrainStore((s) => s.resolution);
  const shaderVersion = useTerrainStore((s) => s.shaderVersion);
  const debugMode = useTerrainStore((s) => s.debugMode);

  // Update uniforms when store properties change
  useEffect(() => {
    if (materialRef.current) {
      if (heightmap) materialRef.current.uTexture = heightmap;
      materialRef.current.uMaxHeight = maxHeight;
    }
  }, [heightmap, maxHeight]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uDebugMode = debugMode;
    }
  }, [debugMode]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime += delta * 1.4;
    }
  });

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    if (e.button !== 0) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.hypot(dx, dy) < 5) {
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
      <planeGeometry args={[20, 20, resolution, resolution]} />
      <customPlaneMaterial
        key={shaderVersion}
        ref={materialRef}
        uTexture={heightmap || null}
        uMaxHeight={maxHeight}
        wireframe={isWireframe}
      />
    </mesh>
  );
}
