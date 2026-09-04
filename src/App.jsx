import { Canvas, extend } from "@react-three/fiber";
import "./App.css";
import Headlamp from "./components/Headlamp";
import ControlledCamera from "./components/ControlledCamera";
import { CustomPlaneMaterial } from "./materials/customPlaneMaterial";
import Terrain from "./components/Terrain";

export default function App() {
  extend({ CustomPlaneMaterial });

  return (
    <div className="viewport">
      <Canvas>
        <ambientLight intensity={0.5} />
        <Headlamp />
        <Terrain />
        <ControlledCamera />
      </Canvas>
    </div>
  );
}
