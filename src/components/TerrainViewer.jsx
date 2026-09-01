import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import passthroughVert from '../shaders/passthrough.vert';
import erosionFrag from '../shaders/erosion.frag';

export function TerrainViewer({ params, baseTexture, resolution = 512, onExportReady }) {
  const containerRef = useRef(null);
  const pipelineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Main Three.js Scene
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111115);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 1.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x303040, 0.8));

    // Mesh
    const geometry = new THREE.PlaneGeometry(2, 2, 255, 255);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
      displacementScale: params.disp_scale,
      wireframe: params.wireframe,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 2. Offscreen GPGPU Setup
    const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });

    const gpgpuScene = new THREE.Scene();
    const gpgpuCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      u_baseMap: { value: baseTexture },
      u_resolution: { value: new THREE.Vector2(resolution, resolution) },
      u_erosion_enabled: { value: params.erosion_enabled },
      u_erosion_scale: { value: params.u_erosion_scale },
      u_erosion_strength: { value: params.u_erosion_strength },
      u_gully_weight: { value: params.u_gully_weight },
      u_detail: { value: params.u_detail },
      u_octaves: { value: params.u_octaves },
      u_ridge_rounding: { value: params.u_ridge_rounding },
      u_cell_scale: { value: params.u_cell_scale },
    };

    const gpgpuMaterial = new THREE.ShaderMaterial({
      vertexShader: passthroughVert,
      fragmentShader: erosionFrag,
      uniforms,
      glslVersion: THREE.GLSL3,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gpgpuMaterial);
    gpgpuScene.add(quad);

    pipelineRef.current = {
      renderer,
      scene,
      camera,
      controls,
      material,
      renderTarget,
      gpgpuScene,
      gpgpuCamera,
      uniforms,
    };

    // Render loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderTarget.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Sync uniforms and trigger GPU execution on param or base texture change
  useEffect(() => {
    const pipe = pipelineRef.current;
    if (!pipe) return;

    pipe.uniforms.u_baseMap.value = baseTexture;
    pipe.uniforms.u_erosion_enabled.value = params.erosion_enabled;
    pipe.uniforms.u_erosion_scale.value = params.u_erosion_scale;
    pipe.uniforms.u_erosion_strength.value = params.u_erosion_strength;
    pipe.uniforms.u_gully_weight.value = params.u_gully_weight;
    pipe.uniforms.u_detail.value = params.u_detail;
    pipe.uniforms.u_octaves.value = params.u_octaves;
    pipe.uniforms.u_ridge_rounding.value = params.u_ridge_rounding;
    pipe.uniforms.u_cell_scale.value = params.u_cell_scale;

    pipe.material.wireframe = params.wireframe;
    pipe.material.displacementScale = params.disp_scale;

    // Execute GPGPU pass
    pipe.renderer.setRenderTarget(pipe.renderTarget);
    pipe.renderer.render(pipe.gpgpuScene, pipe.gpgpuCamera);
    pipe.renderer.setRenderTarget(null);

    // Bind eroded texture to terrain displacement
    pipe.material.displacementMap = pipe.renderTarget.texture;
    pipe.material.needsUpdate = true;
  }, [params, baseTexture]);

  // Export 8-bit / 16-bit PNG via GPU readback
  useEffect(() => {
    if (!onExportReady) return;
    onExportReady(() => {
      const pipe = pipelineRef.current;
      if (!pipe) return;

      const buffer = new Float32Array(resolution * resolution * 4);
      pipe.renderer.readRenderTargetPixels(pipe.renderTarget, 0, 0, resolution, resolution, buffer);

      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(resolution, resolution);

      for (let i = 0; i < resolution * resolution; i++) {
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
  }, [onExportReady, resolution]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}