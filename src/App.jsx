import { Canvas } from "@react-three/fiber";
import "./App.css";
import Headlamp from "./components/Headlamp";
import ControlledCamera from "./components/ControlledCamera";
import Terrain from "./components/Terrain";
import ControlPanel from "./components/ControlPanel";
import { loadShaderLib } from "./materials/shaderLib";

export default function App() {
  loadShaderLib();

  return (
    <div>
      <ControlPanel />
      <div className="viewport">
        <Canvas>
          <ambientLight intensity={0.15} />
          <Headlamp intensity={1} />
          <Terrain />
          <ControlledCamera />
        </Canvas>
      </div>
    </div>
  );
}
