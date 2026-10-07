import { Canvas } from "@react-three/fiber";
import { Buildings, Signs } from "./fixtures";
import { Lights } from "./lights";
import { Markings } from "./markings";
import { Gizmo, Ground, InspectRig, Picker, SceneLighting, WalkRig } from "./systems";
import { INSPECT_START } from "./world";

export function AirfieldCanvas() {
  return (
    <Canvas
      camera={{
        position: INSPECT_START.position,
        fov: 55,
        near: 0.15,
        far: 14000,
      }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        logarithmicDepthBuffer: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0c0d0e");
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
        background: "#0c0d0e",
      }}
    >
      <SceneLighting />
      <Ground />
      <Markings />
      <Lights />
      <Signs />
      <Buildings />
      <Gizmo />
      <InspectRig />
      <WalkRig />
      <Picker />
    </Canvas>
  );
}
