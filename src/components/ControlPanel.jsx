import { useState } from "react";
import { useTerrainStore } from "../store/useTerrainStore";

export default function ControlPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const maxHeight = useTerrainStore((s) => s.maxHeight);
  const setMaxHeight = useTerrainStore((s) => s.setMaxHeight);
  const resolution = useTerrainStore((s) => s.resolution);
  const setResolution = useTerrainStore((s) => s.setResolution);
  const uploadTexture = useTerrainStore((s) => s.uploadTexture);
  const reloadShader = useTerrainStore((s) => s.reloadShader);
  const debugMode = useTerrainStore((s) => s.debugMode);
  const setDebugMode = useTerrainStore((s) => s.setDebugMode);

  const handlePanelClick = (e) => {
    // Ignore clicks if they happened on or inside an input, select, button, or label
    if (e.target.closest("input, select, button, label")) {
      return;
    }
    setIsCollapsed((prev) => !prev);
  };

  const inPanel = (html) => {
    return (
      <div className="control-panel" onClick={handlePanelClick}>
        {html}
      </div>
    );
  };

  if (isCollapsed) {
    return inPanel(<p>click to expand</p>);
  }

  return inPanel(
    <>
      <label>
        Heightmap Image:
        <input
          type="file"
          accept="image/*"
          onChange={(e) => uploadTexture(e.target.files[0])}
        />
      </label>

      <label>
        Height Scale: {maxHeight.toFixed(1)}
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={maxHeight}
          onChange={(e) => setMaxHeight(parseFloat(e.target.value))}
        />
      </label>

      <label>
        Resolution: {resolution}
        <input
          type="range"
          min="2"
          max="256"
          step="1"
          value={resolution}
          onChange={(e) => setResolution(parseInt(e.target.value))}
        />
      </label>

      <label>
        Display Mode:
        <select
          value={debugMode}
          onChange={(e) => setDebugMode(parseInt(e.target.value))}
        >
          <option value={0}>Shaded Terrain</option>
          <option value={1}>Elevation Map</option>
          <option value={2}>Normal Vectors</option>
        </select>
      </label>

      <button onClick={reloadShader}>Reload Shader</button>
    </>,
  );
}
