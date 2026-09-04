import { useState, useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import "./App.css";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { useEffect } from "react";
import { Color, MathUtils, MOUSE, UniformsLib, UniformsUtils } from "three";

export default function App() {
  const [count, setCount] = useState(0);

  const CustomPlaneMaterial = shaderMaterial(
    // 1. Uniforms
    {
      ...UniformsLib.lights, // Spreads standard lighting uniforms
      uTime: 0,
      uColor: new Color("#3b82f6"),
    },
    // 2. Vertex Shader
    /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;

    void main() {
      vUv = uv;

      vec4 modelPosition = modelMatrix * vec4(position, 1.0);

      // Current wave equation parameters
      float freq = 1.0;
      float speed = 0.5;
      float amp = 0.25;

      float sx = sin(modelPosition.x * freq + uTime * speed);
      float cx = cos(modelPosition.x * freq + uTime * speed);
      float sz = sin(modelPosition.z * freq + uTime * speed);
      float cz = cos(modelPosition.z * freq + uTime * speed);

      // Calculate height displacement
      float elevation = sx * sz * amp;
      modelPosition.y += elevation;

      // Analytical partial derivatives for normal calculation: dy/dx and dy/dz
      float dydx = cx * sz * freq * amp;
      float dydz = sx * cz * freq * amp;

      // Un-displaced plane normal points UP (0, 1, 0)
      // Tangents: T_x = (1, dydx, 0), T_z = (0, dydz, 1)
      // Normal = normalize(T_z x T_x)
      vec3 objectNormal = normalize(vec3(-dydx, 1.0, -dydz));

      // Transform normal to view space for correct light calculations
      vNormal = normalize(mat3(modelMatrix) * objectNormal);

      vec4 viewPosition = viewMatrix * modelPosition;
      gl_Position = projectionMatrix * viewPosition;

      vElevation = elevation;
    }
  `,
    // 3. Fragment Shader
    /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;

    // Automatically injected by Three.js when material.lights = true
    #include <common>
    #include <lights_pars_begin>

    void main() {
      // Re-normalize interpolated normal vector
      vec3 N = normalize(vNormal);

      // Base elevation tinting from your original shader
      vec3 baseColor = uColor + vElevation * 0.5;

      // Access scene directional light #0 automatically
      vec3 lightDir = normalize(-directionalLights[0].direction);
      vec3 lightColor = directionalLights[0].color;

      // Smooth diffuse calculation (Lambertian)
      float diffuse = max(dot(N, lightDir), 0.0);
      float ambient = 0.2;

      vec3 finalColor = baseColor * (ambient + diffuse * lightColor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
    // 4. Configure Material Options
    (material) => {
      if (material) {
        // Enables automatic injection of directionalLights uniforms
        material.lights = true;
      }
    },
  );

  extend({ CustomPlaneMaterial });

  function Cube() {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }

  function Plane() {
    const [isWireframe, setIsWireframe] = useState(false);
    const materialRef = useRef();
    const pointerDownPos = useRef({ x: 0, y: 0 });

    // Update uniforms in the render loop
    useFrame((state, delta) => {
      if (materialRef.current) {
        materialRef.current.uTime += delta * 1.4;
      }
    });

    const handlePointerDown = (e) => {
      // Record screen coordinates on initial press
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      // Calculate distance moved during press
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      const distance = Math.hypot(dx, dy);

      // Only toggle wireframe if mouse moved less than 3-5 pixels (a intentional click)
      if (distance < 5) {
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
        <planeGeometry args={[20, 20, 32, 32]} />
        <customPlaneMaterial
          ref={materialRef}
          uColor="#67d5e9"
          wireframe={isWireframe}
        />
      </mesh>
    );
  }

  function Headlamp() {
    const lightRef = useRef();

    useFrame(({ camera }, delta) => {
      if (lightRef.current) {
        lightRef.current.position.lerp(camera.position, 0.5 * delta);
      }
    });

    return <directionalLight ref={lightRef} intensity={1} />;
  }

  function ControlledCamera() {
    const controlsRef = useRef();

    useFrame(() => {
      if (controlsRef.current) {
        controlsRef.current.target.y = 0;
      }
    });

    return (
      <OrbitControls
        ref={controlsRef}
        makeDefault
        screenSpacePanning={false}
        minPolarAngle={MathUtils.degToRad(5)}
        maxPolarAngle={MathUtils.degToRad(89.99)}
      />
    );
  }

  return (
    <div className="viewport">
      <Canvas>
        <ambientLight intensity={0.5} />
        <Headlamp />
        <Plane />
        <Cube />
        <ControlledCamera />
      </Canvas>
    </div>
  );
}
