import { useTerrainStore } from "../store/useTerrainStore";

export default function ControlPanel() {
  const maxHeight = useTerrainStore((s) => s.maxHeight);
  const setMaxHeight = useTerrainStore((s) => s.setMaxHeight);
  const resolution = useTerrainStore((s) => s.resolution);
  const setResolution = useTerrainStore((s) => s.setResolution);
  const uploadTexture = useTerrainStore((s) => s.uploadTexture);
  const reloadShader = useTerrainStore((s) => s.reloadShader);

  return (
    <div className="control-panel">
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

      <button onClick={reloadShader}>Reload Shader</button>
    </div>
  );
}
