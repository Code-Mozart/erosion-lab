import { useState } from "react";
import { MAX_HEIGHT_BOUNDS, useTerrainStore } from "../store/useTerrainStore";

export default function ControlPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const maxHeight = useTerrainStore((s) => s.maxHeight);
  const setMaxHeight = useTerrainStore((s) => s.setMaxHeight);
  const uploadTexture = useTerrainStore((s) => s.uploadTexture);
  const reloadShader = useTerrainStore((s) => s.reloadShader);
  const debugMode = useTerrainStore((s) => s.debugMode);
  const setDebugMode = useTerrainStore((s) => s.setDebugMode);

  const octaves = useTerrainStore((s) => s.octaves);
  const setOctaves = useTerrainStore((s) => s.setOctaves);
  const frequency = useTerrainStore((s) => s.frequency);
  const setFrequency = useTerrainStore((s) => s.setFrequency);
  const blendRadius = useTerrainStore((s) => s.blendRadius);
  const setBlendRadius = useTerrainStore((s) => s.setBlendRadius);

  const handlePanelClick = (e) => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="control-panel">
      <div onClick={handlePanelClick}>
        <p>Controls {isCollapsed ? "▶" : "▼"}</p>
      </div>
      {!isCollapsed && (
        <>
          <hr />
          <div className="control-panel-content">
            <label>
              Heightmap Image:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadTexture(e.target.files[0])}
              />
            </label>

            <label>
              Height Scale: {maxHeight.toFixed(2)}
              <input
                type="range"
                min={MAX_HEIGHT_BOUNDS[0]}
                max={MAX_HEIGHT_BOUNDS[1]}
                step={getStepwidth(MAX_HEIGHT_BOUNDS, 100)}
                value={maxHeight}
                onChange={(e) => setMaxHeight(parseFloat(e.target.value))}
              />
            </label>

            <ResolutionControl />

            <label>
              Frequency: {frequency}
              <input
                type="range"
                min="0.1"
                max="50.0"
                step="0.1"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value))}
              />
            </label>

            <label>
              Octaves: {octaves}
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={octaves}
                onChange={(e) => setOctaves(parseInt(e.target.value))}
              />
            </label>

            <label>
              Blend Radius: {blendRadius}
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={blendRadius}
                onChange={(e) => setBlendRadius(parseFloat(e.target.value))}
              />
            </label>

            <label>
              Display Mode:
              <select
                value={debugMode}
                onChange={(e) => setDebugMode(parseInt(e.target.value))}
              >
                <option value={0}>Colored Terrain</option>
                <option value={1}>Shaded Terrain</option>
                <option value={2}>Elevation Map</option>
                <option value={3}>Gradients</option>
                <option value={4}>Steepness</option>
                <option value={5}>Normals</option>
                <option value={6}>Debug Cell Noise</option>
              </select>
            </label>

            <button onClick={reloadShader}>Reload Shader</button>
          </div>
        </>
      )}
    </div>
  );
}

function ResolutionControl({}) {
  const resolution = useTerrainStore((s) => s.resolution);
  const setResolution = useTerrainStore((s) => s.setResolution);

  const fromExp = (exp) => Math.round(Math.pow(2, exp));
  const toExp = (res) => Math.log2(res);

  return (
    <label>
      Resolution: {resolution}
      <input
        type="range"
        min="1"
        max="10"
        step="0.01"
        value={toExp(resolution)}
        onChange={(e) => setResolution(fromExp(parseFloat(e.target.value)))}
      />
    </label>
  );
}

function getStepwidth(bounds, steps) {
  return (bounds[1] - bounds[0]) / steps;
}
