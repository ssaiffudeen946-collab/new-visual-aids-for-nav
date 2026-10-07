import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useLab } from "./store";
import { TAXI_N1, RWY_0927, rwyPos, thresholdAlong } from "./world";

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.needsUpdate = true;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function SignFace({
  text,
  bg,
  fg,
  width = 3.2,
  height = 1.15,
}: {
  text: string;
  bg: string;
  fg: string;
  width?: number;
  height?: number;
}) {
  const tex = useMemo(
    () =>
      canvasTexture((ctx, w, h) => {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = fg === "#f4f1ea" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)";
        ctx.lineWidth = 10;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = fg;
        ctx.font = "700 92px Barlow, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, w / 2, h / 2 + 4);
      }),
    [text, bg, fg],
  );
  return (
    <mesh position={[0, 0, 0.06]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function SignPost({
  position,
  rotationY = 0,
  children,
}: {
  position: [number, number, number];
  rotationY?: number;
  children: ReactNode;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.1, 8]} />
        <meshStandardMaterial color="#3a3d40" roughness={0.7} />
      </mesh>
      <group position={[0, 2.35, 0]}>{children}</group>
    </group>
  );
}

export function Signs() {
  const on = useLab((s) => s.layers.signs);
  const dtg = useMemo(() => {
    const items: { n: number; x: number; z: number }[] = [];
    for (let n = 1; n <= 10; n++) {
      const along = RWY_0927.length / 2 - n * 304.8;
      const p = rwyPos(RWY_0927, along, -38);
      items.push({ n, x: p.x, z: p.z });
    }
    return items;
  }, []);
  if (!on) return null;
  return (
    <group>
      <SignPost position={[TAXI_N1.x - 16, 0, -75]} rotationY={0}>
        <mesh>
          <boxGeometry args={[3.4, 1.25, 0.12]} />
          <meshStandardMaterial color="#8b1e1a" />
        </mesh>
        <SignFace text="09-27" bg="#9b241c" fg="#f4f1ea" width={3.2} />
      </SignPost>
      <SignPost position={[1180, 0, -78]}>
        <mesh>
          <boxGeometry args={[4.6, 1.25, 0.12]} />
          <meshStandardMaterial color="#8b1e1a" />
        </mesh>
        <SignFace text="CAT II 27" bg="#9b241c" fg="#f4f1ea" width={4.4} />
      </SignPost>
      <SignPost position={[620, 0, 118]} rotationY={Math.PI / 2}>
        <mesh>
          <boxGeometry args={[3.8, 1.25, 0.12]} />
          <meshStandardMaterial color="#8b1e1a" />
        </mesh>
        <SignFace text="NO ENTRY" bg="#9b241c" fg="#f4f1ea" width={3.6} />
      </SignPost>
      <SignPost position={[TAXI_N1.x + 16, 0, -75]}>
        <mesh>
          <boxGeometry args={[2.6, 1.25, 0.12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <SignFace text="N1" bg="#111111" fg="#e0b43a" width={2.4} />
      </SignPost>
      <SignPost position={[TAXI_N1.x, 0, -112]} rotationY={Math.PI / 2}>
        <mesh>
          <boxGeometry args={[5.0, 1.25, 0.12]} />
          <meshStandardMaterial color="#e0b43a" />
        </mesh>
        <SignFace text="N  ←    →  E" bg="#e0b43a" fg="#111111" width={4.8} />
      </SignPost>
      {dtg.map((s) => (
        <SignPost key={s.n} position={[s.x, 0, s.z]} rotationY={Math.PI / 2}>
          <mesh>
            <boxGeometry args={[1.5, 1.5, 0.12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <SignFace text={String(s.n)} bg="#111111" fg="#f4f1ea" width={1.35} height={1.35} />
        </SignPost>
      ))}
    </group>
  );
}

function Hangar({ x, z, w, d, h }: { x: number; z: number; w: number; d: number; h: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#6d6f6c" roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.8, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[w + 1.2, 1.6, d + 1.2]} />
        <meshStandardMaterial color="#5a5c59" roughness={0.7} />
      </mesh>
      <mesh position={[0, h * 0.35, d / 2 + 0.05]}>
        <boxGeometry args={[w * 0.55, h * 0.7, 0.2]} />
        <meshStandardMaterial color="#2c3338" metalness={0.3} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Jet({ position, headingDeg }: { position: [number, number, number]; headingDeg: number }) {
  const yaw = -(headingDeg * Math.PI) / 180;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.8, 1.6, 34, 12]} />
        <meshStandardMaterial color="#d8d6d0" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[16.2, 3.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[1.6, 6.5, 12]} />
        <meshStandardMaterial color="#d8d6d0" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[1, 3.1, 0]}>
        <boxGeometry args={[8, 0.35, 32]} />
        <meshStandardMaterial color="#cfcbc3" roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[-14, 5.8, 0]}>
        <boxGeometry args={[4.2, 5.5, 0.4]} />
        <meshStandardMaterial color="#cfcbc3" roughness={0.4} />
      </mesh>
      <mesh position={[-14, 7.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 7]} />
        <meshStandardMaterial color="#cfcbc3" />
      </mesh>
      <mesh position={[4, 2.2, 6.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 3.4, 10]} />
        <meshStandardMaterial color="#4a4e52" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[4, 2.2, -6.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 3.4, 10]} />
        <meshStandardMaterial color="#4a4e52" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[6, 4.4, 0]}>
        <boxGeometry args={[8, 1.1, 2.4]} />
        <meshStandardMaterial color="#2a3338" metalness={0.2} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Windsock() {
  const sleeve = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!sleeve.current) return;
    const t = clock.getElapsedTime();
    sleeve.current.rotation.y = -0.7 + Math.sin(t * 0.6) * 0.18;
    sleeve.current.rotation.z = Math.sin(t * 1.4) * 0.06;
  });
  return (
    <group position={[-1500, 0, -70]}>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 12, 8]} />
        <meshStandardMaterial color="#4a4d50" />
      </mesh>
      <group ref={sleeve} position={[0, 11.4, 0]}>
        <mesh position={[3.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.85, 6.4, 8, 1, true]} />
          <meshStandardMaterial color="#d2651d" side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.7, 0.85, 1.4, 8, 1, true]} />
          <meshStandardMaterial color="#f4f1ea" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function Tower() {
  return (
    <group position={[-40, 0, 260]}>
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[9, 36, 9]} />
        <meshStandardMaterial color="#8b8e88" roughness={0.7} />
      </mesh>
      <mesh position={[0, 40, 0]}>
        <cylinderGeometry args={[3.2, 5.5, 8, 8]} />
        <meshStandardMaterial color="#7a7d78" />
      </mesh>
      <mesh position={[0, 48, 0]}>
        <cylinderGeometry args={[7.5, 6.2, 7, 8]} />
        <meshStandardMaterial color="#d8d6d0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 48.2, 0]}>
        <cylinderGeometry args={[6.8, 5.6, 4.2, 8]} />
        <meshStandardMaterial color="#1c2a32" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, 52.6, 0]}>
        <cylinderGeometry args={[6.4, 7.2, 1.6, 8]} />
        <meshStandardMaterial color="#4e5150" />
      </mesh>
      <mesh position={[0, 56, 0]}>
        <boxGeometry args={[1.2, 6, 1.2]} />
        <meshStandardMaterial color="#3a3d40" />
      </mesh>
    </group>
  );
}

function Terminal() {
  return (
    <group position={[380, 0, 340]}>
      <mesh position={[0, 14, 0]} castShadow>
        <boxGeometry args={[420, 28, 140]} />
        <meshStandardMaterial color="#cfcbc4" roughness={0.55} />
      </mesh>
      <mesh position={[0, 16, -72]}>
        <boxGeometry args={[400, 18, 4]} />
        <meshStandardMaterial color="#1c2a32" metalness={0.45} roughness={0.2} />
      </mesh>
      <mesh position={[-80, 22, 40]}>
        <boxGeometry args={[180, 16, 70]} />
        <meshStandardMaterial color="#b8b6b0" roughness={0.5} />
      </mesh>
      <mesh position={[140, 10, -20]}>
        <boxGeometry args={[90, 20, 90]} />
        <meshStandardMaterial color="#d4d1cb" />
      </mesh>
      <mesh position={[0, 29, 0]}>
        <boxGeometry args={[428, 1.2, 148]} />
        <meshStandardMaterial color="#5c5f5c" />
      </mesh>
      {[-160, -40, 80, 180].map((x) => (
        <mesh key={x} position={[x, 7, -74]}>
          <boxGeometry args={[28, 10, 8]} />
          <meshStandardMaterial color="#2a3338" />
        </mesh>
      ))}
    </group>
  );
}

export function Buildings() {
  const on = useLab((s) => s.layers.buildings);
  if (!on) return null;
  const t09 = thresholdAlong(RWY_0927, "09");
  void t09;
  return (
    <group>
      <Terminal />
      <Tower />
      <Hangar x={-180} z={-280} w={78} d={52} h={18} />
      <Hangar x={-80} z={-280} w={70} d={52} h={16} />
      <Hangar x={20} z={-280} w={86} d={56} h={20} />
      <Windsock />
      <Jet position={[160, 0, 168]} headingDeg={90} />
      <Jet position={[220, 0, 168]} headingDeg={90} />
      <Jet position={[290, 0, 176]} headingDeg={78} />
    </group>
  );
}
