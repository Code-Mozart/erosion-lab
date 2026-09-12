import { extend, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { CustomPlaneMaterial } from "../materials/customPlaneMaterial";
import { MAX_HEIGHT_BOUNDS, useTerrainStore } from "../store/useTerrainStore";
import { useMemo } from "react";
import { remap } from "../utils/mathUtils";
import { PARAMETERS } from "../config/parameters";

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
  const displayMode = useTerrainStore((s) => s.displayMode);
  const octaves = useTerrainStore((s) => s.octaves);
  const frequency = useTerrainStore((s) => s.frequency);
  const blendRadius = useTerrainStore((s) => s.blendRadius);
  const valleyAltitude = useTerrainStore((s) => s.valleyAltitude);
  const peakAltitude = useTerrainStore((s) => s.peakAltitude);
  const detail = useTerrainStore((s) => s.detail);
  const [planeWidth, planeHeight] = useTerrainStore((s) => s.planeSize);

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
        uDebugMode={displayMode}
        uOctaves={octaves}
        uFrequency={frequency}
        uAmplitude={1.0 / frequency}
        uCellSize={7.5 / frequency}
        uBlendRadius={blendRadius}
        uValleyAltitude={valleyAltitude * scaledMaxHeight}
        uPeakAltitude={peakAltitude * scaledMaxHeight}
        uDetail={detail}
        wireframe={isWireframe}
      />
    </mesh>
  );
}
