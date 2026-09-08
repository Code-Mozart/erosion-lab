import { extend, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { CustomPlaneMaterial } from "../materials/customPlaneMaterial";
import { MAX_HEIGHT_BOUNDS, useTerrainStore } from "../store/useTerrainStore";
import { useMemo } from "react";
import { remap } from "../utils/mathUtils";

extend({ CustomPlaneMaterial });

const DEFAULT_PLANE_SIZE = 10.0;

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
  const cellSize = useTerrainStore((s) => s.cellSize);

  const [planeWidth, planeHeight] = useMemo(() => {
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
  }, [heightmap]);

  const scaledMaxHeight = useMemo(() => {
    return remap(
      maxHeight,
      MAX_HEIGHT_BOUNDS[0],
      MAX_HEIGHT_BOUNDS[1],
      0.0,
      Math.max(planeWidth, planeHeight),
    );
  }, [planeWidth, planeHeight, maxHeight]);

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
      <planeGeometry args={[planeWidth, planeHeight, resolution, resolution]} />
      <customPlaneMaterial
        key={shaderVersion}
        ref={materialRef}
        uTexture={heightmap || null}
        uMaxHeight={scaledMaxHeight}
        uDebugMode={debugMode}
        uCellSize={cellSize}
        wireframe={isWireframe}
      />
    </mesh>
  );
}
