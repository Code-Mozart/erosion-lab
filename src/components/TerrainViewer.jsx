import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import passthroughVert from '../shaders/passthrough.vert';
import erosionFrag from '../shaders/erosion.frag';
import terrainVert from '../shaders/terrain.vert';
import terrainFrag from '../shaders/terrain.frag';

export function TerrainViewer({ params, baseTexture, gpgpuRes = 512, onExportReady }) {
  const containerRef = useRef(null);
  const pipelineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene, Camera & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111115);

    // Camera setup inside useEffect
    const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
    );
    camera.position.set(0, 1.8, 1.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0); // Focus camera target at terrain origin
    controls.update();

    // 2. Terrain Shader Material & Mesh
    const terrainMaterial = new THREE.ShaderMaterial({
      vertexShader: terrainVert,
      fragmentShader: terrainFrag,
      uniforms: {
        u_heightmap: { value: null },
        u_disp_scale: { value: params.disp_scale },
        u_water_level: { value: params.water_level },
        u_debug_mode: { value: params.debug_mode },
        u_debug_octave: { value: params.debug_octave },
        u_erosion_scale: { value: params.u_erosion_scale },
        u_cell_scale: { value: params.u_cell_scale },
      },
      wireframe: params.wireframe,
      side: THREE.DoubleSide,
      glslVersion: THREE.GLSL3,
    });

    const geometry = new THREE.PlaneGeometry(2, 2, params.mesh_res, params.mesh_res);
    const mesh = new THREE.Mesh(geometry, terrainMaterial);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    // 3. Offscreen GPGPU Target Setup
    const renderTarget = new THREE.WebGLRenderTarget(gpgpuRes, gpgpuRes, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });

    const gpgpuScene = new THREE.Scene();
    const gpgpuCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const gpgpuMaterial = new THREE.ShaderMaterial({
      vertexShader: passthroughVert,
      fragmentShader: erosionFrag,
      uniforms: {
        u_baseMap: { value: baseTexture },
        u_resolution: { value: new THREE.Vector2(gpgpuRes, gpgpuRes) },
        u_erosion_enabled: { value: params.erosion_enabled },
        u_erosion_scale: { value: params.u_erosion_scale },
        u_erosion_strength: { value: params.u_erosion_strength },
        u_gully_weight: { value: params.u_gully_weight },
        u_detail: { value: params.u_detail },
        u_octaves: { value: params.u_octaves },
        u_ridge_rounding: { value: params.u_ridge_rounding },
        u_cell_scale: { value: params.u_cell_scale },
      },
      glslVersion: THREE.GLSL3,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gpgpuMaterial);
    gpgpuScene.add(quad);

    pipelineRef.current = {
      renderer, scene, camera, controls, mesh, terrainMaterial,
      renderTarget, gpgpuScene, gpgpuCamera, gpgpuMaterial,
    };

    // Render loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize observer to prevent layout collapse
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      renderTarget.dispose();
      geometry.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update Mesh Resolution dynamically
  useEffect(() => {
    const pipe = pipelineRef.current;
    if (!pipe) return;

    pipe.mesh.geometry.dispose();
    pipe.mesh.geometry = new THREE.PlaneGeometry(2, 2, params.mesh_res, params.mesh_res);
  }, [params.mesh_res]);

  // Execute GPGPU & Sync Uniforms
  useEffect(() => {
    const pipe = pipelineRef.current;
    if (!pipe) return;

    // GPGPU Pass
    const gpuU = pipe.gpgpuMaterial.uniforms;
    gpuU.u_baseMap.value = baseTexture;
    gpuU.u_erosion_enabled.value = params.erosion_enabled;
    gpuU.u_erosion_scale.value = params.u_erosion_scale;
    gpuU.u_erosion_strength.value = params.u_erosion_strength;
    gpuU.u_gully_weight.value = params.u_gully_weight;
    gpuU.u_detail.value = params.u_detail;
    gpuU.u_octaves.value = params.u_octaves;
    gpuU.u_ridge_rounding.value = params.u_ridge_rounding;
    gpuU.u_cell_scale.value = params.u_cell_scale;

    pipe.renderer.setRenderTarget(pipe.renderTarget);
    pipe.renderer.render(pipe.gpgpuScene, pipe.gpgpuCamera);
    pipe.renderer.setRenderTarget(null);

    // Terrain Uniforms
    const tU = pipe.terrainMaterial.uniforms;
    tU.u_heightmap.value = pipe.renderTarget.texture;
    tU.u_disp_scale.value = params.disp_scale;
    tU.u_water_level.value = params.water_level;
    tU.u_debug_mode.value = params.debug_mode;
    tU.u_debug_octave.value = params.debug_octave;
    tU.u_erosion_scale.value = params.u_erosion_scale;
    tU.u_cell_scale.value = params.u_cell_scale;

    pipe.terrainMaterial.wireframe = params.wireframe;
    pipe.terrainMaterial.needsUpdate = true;
  }, [params, baseTexture]);

  // Heightmap PNG export function
  useEffect(() => {
    if (!onExportReady) return;
    onExportReady(() => {
      const pipe = pipelineRef.current;
      if (!pipe) return;

      const buffer = new Float32Array(gpgpuRes * gpgpuRes * 4);
      pipe.renderer.readRenderTargetPixels(pipe.renderTarget, 0, 0, gpgpuRes, gpgpuRes, buffer);

      const canvas = document.createElement('canvas');
      canvas.width = gpgpuRes;
      canvas.height = gpgpuRes;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(gpgpuRes, gpgpuRes);

      for (let i = 0; i < gpgpuRes * gpgpuRes; i++) {
        const val = Math.floor(Math.min(1.0, Math.max(0.0, buffer[i * 4])) * 255);
        imgData.data[i * 4] = val;
        imgData.data[i * 4 + 1] = val;
        imgData.data[i * 4 + 2] = val;
        imgData.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      const a = document.createElement('a');
      a.download = 'eroded_heightmap.png';
      a.href = canvas.toDataURL();
      a.click();
    });
  }, [onExportReady, gpgpuRes]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}