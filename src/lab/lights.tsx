import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLab } from "./store";
import {
  RWY_0927,
  RWY_1432,
  TAXI_N,
  TAXI_S,
  TAXI_N1,
  rwyPos,
  headingVec,
  thresholdAlong,
  landingSign,
  physicalAlong,
  type RunwayDef,
} from "./world";

type Lamp = { x: number; y: number; z: number; color: string; r?: number };

const C = {
  white: "#f4f1ea",
  yellow: "#e0b43a",
  red: "#d4453a",
  green: "#3dbe6a",
  blue: "#3a7bd4",
};

function edgeLamps(rwy: RunwayDef, out: Lamp[]) {
  const step = 60;
  const half = rwy.length / 2;
  const edge = rwy.width / 2 + 0.2;
  for (let along = -half; along <= half + 0.01; along += step) {
    const remainingPos = half - along;
    const remainingNeg = along + half;
    const yellow = remainingPos <= 600 || remainingNeg <= 600;
    const col = yellow ? C.yellow : C.white;
    for (const side of [-edge, edge]) {
      const p = rwyPos(rwy, along, side, 0.45);
      out.push({ ...p, color: col, r: 0.28 });
    }
  }
}

function clLamps(rwy: RunwayDef, out: Lamp[]) {
  const step = 15;
  const half = rwy.length / 2;
  for (let along = -half + 8; along < half - 8; along += step) {
    const remPos = half - along;
    const remNeg = along + half;
    const code = (rem: number) => {
      if (rem <= 300) return C.red;
      if (rem <= 900) {
        const i = Math.round(along / step);
        return i % 2 === 0 ? C.red : C.white;
      }
      return C.white;
    };
    const col = remPos <= 900 ? code(remPos) : remNeg <= 900 ? code(remNeg) : C.white;
    const p = rwyPos(rwy, along, 0, 0.06);
    out.push({ ...p, color: col, r: 0.16 });
  }
}

function thresholdBar(rwy: RunwayDef, endName: string, out: Lamp[]) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const n = Math.round(rwy.width / 3);
  for (let i = 0; i < n; i++) {
    const across = -rwy.width / 2 + 1.5 + i * 3;
    const p = rwyPos(rwy, thr, across, 0.4);
    out.push({ ...p, color: C.green, r: 0.22 });
  }
  for (const side of [-1, 1]) {
    for (let k = 1; k <= 5; k++) {
      const p = rwyPos(rwy, thr, side * (rwy.width / 2 + 2 + k * 2.4), 0.4);
      out.push({ ...p, color: C.green, r: 0.22 });
    }
  }
  const phys = physicalAlong(rwy, end.sign);
  for (let i = 0; i < n; i++) {
    const across = -rwy.width / 2 + 1.5 + i * 3;
    const p = rwyPos(rwy, phys, across, 0.4);
    out.push({ ...p, color: C.red, r: 0.22 });
  }
  void ls;
}

function als(rwy: RunwayDef, endName: string, out: Lamp[], rabbit: Lamp[]) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const len = end.alsM;
  const cat2 = end.cat === "CAT II";
  for (let d = 30; d <= len; d += 30) {
    const along = thr - ls * d;
    if (cat2) {
      for (const ac of [-6, -3, 0, 3, 6]) {
        const p = rwyPos(rwy, along, ac, 0.55);
        out.push({ ...p, color: C.white, r: 0.2 });
      }
      if (d <= 270) {
        for (const side of [-1, 1]) {
          for (const ac of [12, 15, 18]) {
            const p = rwyPos(rwy, along, side * ac, 0.55);
            out.push({ ...p, color: C.red, r: 0.18 });
          }
        }
      }
      if (d >= 300) {
        const p = rwyPos(rwy, along, 0, 1.4);
        rabbit.push({ ...p, color: C.white, r: 0.32 });
      }
    } else {
      const p = rwyPos(rwy, along, 0, 0.55);
      out.push({ ...p, color: C.white, r: 0.2 });
      if (d === 300 || (len >= 540 && d === 150)) {
        for (const ac of [-12, -8, -4, 4, 8, 12]) {
          const q = rwyPos(rwy, along, ac, 0.55);
          out.push({ ...q, color: C.white, r: 0.18 });
        }
      }
    }
  }
}

function tdz27(out: Lamp[]) {
  const rwy = RWY_0927;
  const end = rwy.ends["27"];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, "27");
  for (let d = 30; d <= 900; d += 30) {
    const along = thr + ls * d;
    for (const side of [-1, 1]) {
      for (const k of [0, 1, 2]) {
        const p = rwyPos(rwy, along, side * (9 + k * 3.2), 0.06);
        out.push({ ...p, color: C.white, r: 0.14 });
      }
    }
  }
}

function taxiLamps(edge: Lamp[], cl: Lamp[]) {
  for (const tw of [TAXI_N, TAXI_S]) {
    for (let x = tw.x0; x <= tw.x1; x += 60) {
      edge.push({ x, y: 0.35, z: tw.z - tw.width / 2, color: C.blue, r: 0.16 });
      edge.push({ x, y: 0.35, z: tw.z + tw.width / 2, color: C.blue, r: 0.16 });
    }
    for (let x = tw.x0; x <= tw.x1; x += 30) {
      cl.push({ x, y: 0.06, z: tw.z, color: C.green, r: 0.12 });
    }
  }
  for (let z = TAXI_N1.z0; z <= TAXI_N1.z1; z += 20) {
    edge.push({ x: TAXI_N1.x - TAXI_N1.width / 2, y: 0.35, z, color: C.blue, r: 0.16 });
    edge.push({ x: TAXI_N1.x + TAXI_N1.width / 2, y: 0.35, z, color: C.blue, r: 0.16 });
    cl.push({ x: TAXI_N1.x, y: 0.06, z, color: C.green, r: 0.12 });
  }
}

function InstancedLamps({
  items,
  color,
  pulse,
}: {
  items: Lamp[];
  color: string;
  pulse?: (t: number, i: number) => number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        toneMapped: false,
      }),
    [color],
  );
  const base = useMemo(() => items.map((it) => it.r ?? 0.2), [items]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.scale.setScalar(base[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, base]);

  useFrame(({ clock }) => {
    if (!pulse || !ref.current) return;
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    items.forEach((it, i) => {
      const s = base[i] * pulse(t, i);
      dummy.position.set(it.x, it.y, it.z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  if (items.length === 0) return null;
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} />;
}

function PapiUnit({
  position,
  headingDeg,
  angleDeg,
  offset,
}: {
  position: [number, number, number];
  headingDeg: number;
  angleDeg: number;
  offset: number;
}) {
  const lens = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { fx, fz } = headingVec(headingDeg);
  const approachX = -fx;
  const approachZ = -fz;

  useFrame(() => {
    if (!lens.current) return;
    const mat = lens.current.material as THREE.MeshBasicMaterial;
    const dx = camera.position.x - position[0];
    const dy = camera.position.y - position[1];
    const dz = camera.position.z - position[2];
    const along = dx * approachX + dz * approachZ;
    const ground = Math.hypot(along, dx * fx + dz * fz) || 0.001;
    const elev = (Math.atan2(dy, Math.max(ground, 1)) * 180) / Math.PI;
    const white = elev > angleDeg;
    mat.color.set(white ? "#f7f4ea" : "#e03a32");
  });

  const { rx, rz } = headingVec(headingDeg);
  const yaw = Math.atan2(fx, fz);
  void rx;
  void rz;
  void offset;

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, -0.55, 0]}>
        <boxGeometry args={[0.18, 1.1, 0.18]} />
        <meshStandardMaterial color="#2a2c2e" roughness={0.8} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.15, 0.7, 0.9]} />
        <meshStandardMaterial color="#1a1c1e" roughness={0.6} />
      </mesh>
      <mesh ref={lens} position={[0, 0.05, -0.48]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.28, 20]} />
        <meshBasicMaterial color="#e03a32" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PapiRow({ rwy, endName }: { rwy: RunwayDef; endName: string }) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const along = thr + ls * 300;
  const left = -ls;
  const inboard = left * (rwy.width / 2 + 15);
  const angles =
    endName === "32"
      ? [2.76, 3.09, 3.43, 3.76]
      : [end.papiDeg - 0.5, end.papiDeg - 0.17, end.papiDeg + 0.17, end.papiDeg + 0.5];
  return (
    <group>
      {angles.map((ang, i) => {
        const across = inboard + left * i * 9;
        const p = rwyPos(rwy, along, across, 1.15);
        return (
          <PapiUnit
            key={i}
            position={[p.x, p.y, p.z]}
            headingDeg={end.heading}
            angleDeg={ang}
            offset={i}
          />
        );
      })}
    </group>
  );
}

export function Lights() {
  const on = useLab((s) => s.layers.lights);
  const lighting = useLab((s) => s.lighting);
  const built = useMemo(() => {
    const white: Lamp[] = [];
    const yellow: Lamp[] = [];
    const red: Lamp[] = [];
    const green: Lamp[] = [];
    const blue: Lamp[] = [];
    const rabbit: Lamp[] = [];
    const reil: Lamp[] = [];
    const wig: Lamp[] = [];
    for (const rwy of [RWY_0927, RWY_1432]) {
      const tmp: Lamp[] = [];
      edgeLamps(rwy, tmp);
      for (const l of tmp) (l.color === C.yellow ? yellow : white).push(l);
      if (rwy.id === "0927") clLamps(rwy, white);
      for (const name of Object.keys(rwy.ends)) {
        const t: Lamp[] = [];
        thresholdBar(rwy, name, t);
        for (const l of t) (l.color === C.green ? green : red).push(l);
        const a: Lamp[] = [];
        als(rwy, name, a, rabbit);
        for (const l of a) (l.color === C.red ? red : white).push(l);
      }
    }
    tdz27(white);
    taxiLamps(blue, green);
    const p27 = rwyPos(RWY_0927, thresholdAlong(RWY_0927, "27"), 0);
    const { rx, rz } = headingVec(RWY_0927.heading);
    reil.push({ x: p27.x + rx * 42, y: 1.6, z: p27.z + rz * 42, color: C.white, r: 0.38 });
    reil.push({ x: p27.x - rx * 42, y: 1.6, z: p27.z - rz * 42, color: C.white, r: 0.38 });
    wig.push({ x: TAXI_N1.x - 14, y: 1.2, z: -75, color: C.yellow, r: 0.3 });
    wig.push({ x: TAXI_N1.x + 14, y: 1.2, z: -75, color: C.yellow, r: 0.3 });
    return { white, yellow, red, green, blue, rabbit, reil, wig };
  }, []);

  if (!on) return null;
  const night = lighting === "night" || lighting === "dusk";
  const boost = night ? 1 : 0.85;

  return (
    <group>
      <InstancedLamps items={built.white} color={C.white} pulse={() => boost} />
      <InstancedLamps items={built.yellow} color={C.yellow} pulse={() => boost} />
      <InstancedLamps items={built.red} color={C.red} pulse={() => boost} />
      <InstancedLamps items={built.green} color={C.green} pulse={() => boost} />
      <InstancedLamps items={built.blue} color={C.blue} pulse={() => boost} />
      <InstancedLamps
        items={built.rabbit}
        color={C.white}
        pulse={(t, i) => {
          const n = built.rabbit.length || 1;
          const k = Math.floor(t * 8) % n;
          return i === n - 1 - k ? 2.4 : 0.15;
        }}
      />
      <InstancedLamps
        items={built.reil}
        color={C.white}
        pulse={(t) => (Math.sin(t * Math.PI * 2) > 0 ? 2.2 : 0.2)}
      />
      <InstancedLamps
        items={built.wig}
        color={C.yellow}
        pulse={(t, i) => (Math.sin(t * Math.PI * 3 + i * Math.PI) > 0 ? 2 : 0.25)}
      />
      <PapiRow rwy={RWY_0927} endName="09" />
      <PapiRow rwy={RWY_0927} endName="27" />
      <PapiRow rwy={RWY_1432} endName="14" />
      <PapiRow rwy={RWY_1432} endName="32" />
    </group>
  );
}
