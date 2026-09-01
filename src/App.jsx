import { useState, useRef } from 'react';
import * as THREE from 'three';
import { TerrainViewer } from './components/TerrainViewer';
import { generateProceduralBaseTexture } from './utils/proceduralBase';
import './App.css';

export default function App() {
  const [baseTexture, setBaseTexture] = useState(() => generateProceduralBaseTexture());
  const [isCustomMask, setIsCustomMask] = useState(false);
  const fileInputRef = useRef(null);
  const exportTriggerRef = useRef(null);

  const [params, setParams] = useState({
    erosion_enabled: true,
    mesh_res: 256,
    water_level: 0.12,
    debug_mode: 0, // 0: Realistic, 1: Heightmap, 2: Cell Grids & Pivots
    debug_octave: 0,
    u_erosion_scale: 0.15,
    u_erosion_strength: 0.22,
    u_gully_weight: 0.5,
    u_detail: 1.5,
    u_octaves: 5,
    u_ridge_rounding: 0.1,
    u_cell_scale: 0.7,
    disp_scale: 0.4,
    wireframe: false,
  });

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        setBaseTexture(texture);
        setIsCustomMask(true);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setBaseTexture(generateProceduralBaseTexture());
    setIsCustomMask(false);
  };

  return (
    <div className="app-container">
      <div className="viewer-container">
        <TerrainViewer
          params={params}
          baseTexture={baseTexture}
          onExportReady={(triggerFn) => (exportTriggerRef.current = triggerFn)}
        />
      </div>

      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Phacelle GPU Erosion Lab</h2>
        </div>

        <div className="sidebar-content">
          <div className="section-title">Base Heightmap / Mask</div>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            Upload Custom Mask/Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
          />
          {isCustomMask && (
            <button className="btn" onClick={handleReset}>
              Reset to Procedural Base
            </button>
          )}

          <div className="section-title">Pipeline & Render Settings</div>
          <div className="toggle-group">
            <label htmlFor="toggle-erosion">Enable Phacelle Erosion</label>
            <input
              id="toggle-erosion"
              type="checkbox"
              checked={params.erosion_enabled}
              onChange={(e) => updateParam('erosion_enabled', e.target.checked)}
            />
          </div>

          <div className="control-group">
            <label>Mesh Resolution <span>{params.mesh_res}x{params.mesh_res}</span></label>
            <input
              type="range" min="32" max="512" step="32"
              value={params.mesh_res}
              onChange={(e) => updateParam('mesh_res', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Water Level <span>{params.water_level}</span></label>
            <input
              type="range" min="0.0" max="0.5" step="0.01"
              value={params.water_level}
              onChange={(e) => updateParam('water_level', parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Draw Mode</label>
            <select
              style={{ width: '100%', padding: '6px', background: '#26262e', color: '#fff', border: '1px solid #363642', borderRadius: '4px' }}
              value={params.debug_mode}
              onChange={(e) => updateParam('debug_mode', parseInt(e.target.value))}
            >
              <option value={0}>Realistic Shading</option>
              <option value={1}>Raw Heightmap</option>
              <option value={2}>Cell Grids & Pivots (Debug)</option>
            </select>
          </div>

          {params.debug_mode === 2 && (
            <div className="control-group">
              <label>Debug Octave Grid <span>Octave {params.debug_octave}</span></label>
              <input
                type="range" min="0" max={params.u_octaves - 1} step="1"
                value={params.debug_octave}
                onChange={(e) => updateParam('debug_octave', parseInt(e.target.value))}
              />
            </div>
          )}

          {params.erosion_enabled && (
            <>
              <div className="section-title">Erosion Parameters</div>
              <div className="control-group">
                <label>Erosion Scale <span>{params.u_erosion_scale}</span></label>
                <input
                  type="range" min="0.05" max="0.5" step="0.01"
                  value={params.u_erosion_scale}
                  onChange={(e) => updateParam('u_erosion_scale', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Erosion Strength <span>{params.u_erosion_strength}</span></label>
                <input
                  type="range" min="0.01" max="0.6" step="0.01"
                  value={params.u_erosion_strength}
                  onChange={(e) => updateParam('u_erosion_strength', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Gully Weight <span>{params.u_gully_weight}</span></label>
                <input
                  type="range" min="0.0" max="1.0" step="0.05"
                  value={params.u_gully_weight}
                  onChange={(e) => updateParam('u_gully_weight', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Detail Level <span>{params.u_detail}</span></label>
                <input
                  type="range" min="0.5" max="3.0" step="0.1"
                  value={params.u_detail}
                  onChange={(e) => updateParam('u_detail', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Octaves <span>{params.u_octaves}</span></label>
                <input
                  type="range" min="1" max="6" step="1"
                  value={params.u_octaves}
                  onChange={(e) => updateParam('u_octaves', parseInt(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Ridge Rounding <span>{params.u_ridge_rounding}</span></label>
                <input
                  type="range" min="0.0" max="0.5" step="0.02"
                  value={params.u_ridge_rounding}
                  onChange={(e) => updateParam('u_ridge_rounding', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Cell Scale <span>{params.u_cell_scale}</span></label>
                <input
                  type="range" min="0.2" max="1.5" step="0.05"
                  value={params.u_cell_scale}
                  onChange={(e) => updateParam('u_cell_scale', parseFloat(e.target.value))}
                />
              </div>
            </>
          )}

          <div className="section-title">Display & Export</div>
          <div className="control-group">
            <label>Displacement Scale <span>{params.disp_scale}</span></label>
            <input
              type="range" min="0.05" max="1.5" step="0.05"
              value={params.disp_scale}
              onChange={(e) => updateParam('disp_scale', parseFloat(e.target.value))}
            />
          </div>

          <button className="btn" onClick={() => updateParam('wireframe', !params.wireframe)}>
            {params.wireframe ? 'Disable Wireframe' : 'Enable Wireframe'}
          </button>

          <button className="btn btn-primary" onClick={() => exportTriggerRef.current?.()}>
            Export Heightmap (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}