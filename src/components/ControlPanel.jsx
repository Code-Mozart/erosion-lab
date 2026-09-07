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
      <label style={{ fontSize: "14px", fontWeight: "bold" }}>
        Heightmap Image:
        <input
          type="file"
          accept="image/*"
          onChange={(e) => uploadTexture(e.target.files[0])}
          style={{ display: "block", marginTop: "4px" }}
        />
      </label>

      <label style={{ fontSize: "14px", fontWeight: "bold" }}>
        Height Scale: {maxHeight.toFixed(1)}
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={maxHeight}
          onChange={(e) => setMaxHeight(parseFloat(e.target.value))}
          style={{ display: "block", width: "100%", marginTop: "4px" }}
        />
      </label>

      <label style={{ fontSize: "14px", fontWeight: "bold" }}>
        Resolution: {resolution}
        <input
          type="range"
          min="2"
          max="256"
          step="1"
          value={resolution}
          onChange={(e) => setResolution(parseInt(e.target.value))}
          style={{ display: "block", width: "100%", marginTop: "4px" }}
        />
      </label>

      <button
        onClick={reloadShader}
        style={{
          padding: "8px 12px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Reload Shader
      </button>
    </div>
  );
}
