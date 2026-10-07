import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  RWY_0927,
  RWY_1432,
  TAXI_N,
  TAXI_S,
  TAXI_N1,
  rwyPos,
  rwyYaw,
  thresholdAlong,
  landingSign,
  physicalAlong,
  type RunwayDef,
} from "./world";
import { digitSegs, DIGIT_GAP, DIGIT_W } from "./digits";
import { useLab } from "./store";

export type Mark = {
  x: number;
  z: number;
  w: number;
  d: number;
  ry: number;
  y?: number;
};

function pushBox(list: Mark[], rwy: RunwayDef, along: number, across: number, alongLen: number, acrossW: number) {
  const p = rwyPos(rwy, along, across);
  list.push({ x: p.x, z: p.z, w: acrossW, d: alongLen, ry: rwyYaw(rwy) });
}

function centreline(rwy: RunwayDef, out: Mark[]) {
  const usable0 = -rwy.length / 2;
  let a = usable0 + 5;
  const end = rwy.length / 2 - 5;
  while (a + 30 <= end) {
    pushBox(out, rwy, a + 15, 0, 30, rwy.clWidth);
    a += 50;
  }
}

function zebra(rwy: RunwayDef, endName: string, out: Mark[]) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const count = rwy.width >= 60 ? 16 : 12;
  const alongC = thr + ls * (6 + 15);
  const pattern = (2 * count - 1) * 1.8;
  const first = -pattern / 2 + 0.9;
  for (let i = 0; i < count; i++) {
    pushBox(out, rwy, alongC, first + i * 3.6, 30, 1.8);
  }
  pushBox(out, rwy, thr + ls * 0.9, 0, 1.8, rwy.width - 2);
}

function designation(rwy: RunwayDef, endName: string, out: Mark[]) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const chars = endName.split("");
  const totalW = chars.length * DIGIT_W + (chars.length - 1) * DIGIT_GAP;
  chars.forEach((ch, i) => {
    const across0 = -totalW / 2 + DIGIT_W / 2 + i * (DIGIT_W + DIGIT_GAP);
    for (const s of digitSegs(ch)) {
      const along = thr + ls * (48 + s.along);
      const across = across0 + s.across;
      const p = rwyPos(rwy, along, across);
      out.push({
        x: p.x,
        z: p.z,
        w: s.w,
        d: s.d,
        ry: rwyYaw(rwy),
      });
    }
  });
}

function aiming(rwy: RunwayDef, endName: string, out: Mark[]) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const along = thr + ls * (400 + 25);
  for (const side of [-1, 1]) {
    pushBox(out, rwy, along, side * 13, 50, 8);
  }
}

function tdz(rwy: RunwayDef, endName: string, out: Mark[]) {
  const end = rwy.ends[endName];
  const ls = landingSign(end);
  const thr = thresholdAlong(rwy, endName);
  const pattern: Record<number, number> = { 150: 3, 300: 2, 450: 1, 600: 1, 750: 1, 900: 1 };
  for (const dist of [150, 300, 450, 600, 750, 900]) {
    const n = pattern[dist];
    const along = thr + ls * dist;
    for (const side of [-1, 1]) {
      for (let k = 0; k < n; k++) {
        const across = side * (9 + 1.5 + k * 6);
        pushBox(out, rwy, along, across, 22.5, 3);
      }
    }
  }
}

function sideStripes(rwy: RunwayDef, out: Mark[]) {
  const across = rwy.width / 2 - 0.45;
  const segs = 16;
  const len = rwy.length / segs;
  for (let i = 0; i < segs; i++) {
    const along = -rwy.length / 2 + len / 2 + i * len;
    pushBox(out, rwy, along, across, len - 0.4, 0.9);
    pushBox(out, rwy, along, -across, len - 0.4, 0.9);
  }
}

function arrows(rwy: RunwayDef, endName: string, out: Mark[]) {
  const end = rwy.ends[endName];
  if (end.displaced < 40) return;
  const ls = landingSign(end);
  const phys = physicalAlong(rwy, end.sign);
  const thr = thresholdAlong(rwy, endName);
  const closed = Math.abs(thr - phys);
  const step = 55;
  const n = Math.max(2, Math.floor((closed - 20) / step));
  const yaw = rwyYaw(rwy);
  for (let i = 0; i < n; i++) {
    const along = phys + ls * (18 + i * step);
    const p = rwyPos(rwy, along, 0);
    const arm = 11;
    const thick = 1.1;
    const ang = 0.72;
    out.push({
      x: p.x,
      z: p.z,
      w: thick,
      d: arm,
      ry: yaw + ang * ls,
    });
    out.push({
      x: p.x,
      z: p.z,
      w: thick,
      d: arm,
      ry: yaw - ang * ls,
    });
  }
}

function holdN1(out: Mark[]) {
  const zSolid1 = -75 + 1.35;
  const zSolid2 = -75 - 0.45;
  const zDash1 = -75 - 2.25;
  const zDash2 = -75 - 4.05;
  const x = TAXI_N1.x;
  const w = 18;
  out.push({ x, z: zSolid1, w, d: 0.9, ry: 0 });
  out.push({ x, z: zSolid2, w, d: 0.9, ry: 0 });
  for (let i = -3; i <= 3; i++) {
    out.push({ x: x + i * 2.6, z: zDash1, w: 1.4, d: 0.9, ry: 0 });
    out.push({ x: x + i * 2.6, z: zDash2, w: 1.4, d: 0.9, ry: 0 });
  }
}

function taxiCL(out: Mark[]) {
  const w = 0.3;
  const step = 40;
  for (let x = TAXI_N.x0; x < TAXI_N.x1; x += step) {
    out.push({ x: x + step / 2, z: TAXI_N.z, w, d: step * 0.98, ry: Math.PI / 2 });
  }
  for (let x = TAXI_S.x0; x < TAXI_S.x1; x += step) {
    out.push({ x: x + step / 2, z: TAXI_S.z, w, d: step * 0.98, ry: Math.PI / 2 });
  }
  for (let z = TAXI_N1.z0; z < TAXI_N1.z1; z += 8) {
    out.push({ x: TAXI_N1.x, z: z + 4, w, d: 7.6, ry: 0 });
  }
}

function buildWhite(): Mark[] {
  const m: Mark[] = [];
  for (const rwy of [RWY_0927, RWY_1432]) {
    centreline(rwy, m);
    sideStripes(rwy, m);
    for (const name of Object.keys(rwy.ends)) {
      zebra(rwy, name, m);
      designation(rwy, name, m);
      aiming(rwy, name, m);
      tdz(rwy, name, m);
      arrows(rwy, name, m);
    }
  }
  return m;
}

function buildYellow(): Mark[] {
  const m: Mark[] = [];
  holdN1(m);
  taxiCL(m);
  return m;
}

function InstancedMarks({ items, color }: { items: Mark[]; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    [color],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y ?? 0.03, it.z);
      dummy.rotation.set(0, it.ry, 0);
      dummy.scale.set(it.w, 0.04, it.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} />;
}

export function Markings() {
  const on = useLab((s) => s.layers.markings);
  const white = useMemo(buildWhite, []);
  const yellow = useMemo(buildYellow, []);
  if (!on) return null;
  return (
    <group>
      <InstancedMarks items={white} color="#f3f1ea" />
      <InstancedMarks items={yellow} color="#c4a035" />
    </group>
  );
}
