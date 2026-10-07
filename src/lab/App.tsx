import { useEffect, useState, type ComponentType } from "react";
import { input } from "./input";
import { useLab } from "./store";
import { HUD } from "./ui/HUD";
import { StartScreen } from "./ui/StartScreen";
import { TouchControls } from "./ui/TouchControls";

export function LabApp() {
  const [Canvas, setCanvas] = useState<ComponentType | null>(null);
  const mode = useLab((s) => s.mode);

  useEffect(() => {
    void import("./AirfieldCanvas").then((m) => setCanvas(() => m.AirfieldCanvas));
  }, []);

  useEffect(() => input.attach(), []);

  return (
    <main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-bg text-fg">
      {Canvas ? <Canvas /> : <div className="absolute inset-0 bg-bg" />}
      {mode === "start" && <StartScreen />}
      <HUD />
      <TouchControls />
    </main>
  );
}
