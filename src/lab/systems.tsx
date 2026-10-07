import { Html, Line, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FEATURE_BY_ID, nearestFeature, pickFeature } from "./catalog";
import { input } from "./input";
import { useLab } from "./store";
import { INSPECT_START, WALK_START } from "./world";

export function SceneLighting() {
  const lighting = useLab((s) => s.lighting);
  const { scene } = useThree();

  useEffect(() => {
    if (lighting === "day") {
      scene.background = new THREE.Color("#87a0b4");
      scene.fog = new THREE.Fog("#9aafbe", 1800, 7200);
    } else if (lighting === "dusk") {
      scene.background = new THREE.Color("#2a3340");
      scene.fog = new THREE.Fog("#2a3340", 900, 5200);
    } else {
      scene.background = new THREE.Color("#050608");
      scene.fog = new THREE.Fog("#050608", 700, 4200);
    }
  }, [lighting, scene]);

  if (lighting === "day") {
    return (
      <>
        <hemisphereLight args={["#d7e4ef", "#3e4a3a", 0.55]} />
        <ambientLight intensity={0.28} />
        <directionalLight position={[420, 620, -180]} intensity={1.35} color="#fff4e0" />
      </>
    );
  }
  if (lighting === "dusk") {
    return (
      <>
        <hemisphereLight args={["#c47a4a", "#1a1e24", 0.28]} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[-200, 80, 40]} intensity={0.45} color="#e08a4a" />
      </>
    );
  }
  return (
    <>
      <hemisphereLight args={["#1a2230", "#050608", 0.08]} />
      <ambientLight intensity={0.045} />
    </>
  );
}

export function Ground() {
  const lighting = useLab((s) => s.lighting);
  const grass = lighting === "night" ? "#141a12" : lighting === "dusk" ? "#2a3324" : "#4a5a3a";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[9000, 9000]} />
        <meshLambertMaterial color={grass} />
      </mesh>
      <Pavement />
    </group>
  );
}

function Pavement() {
  const asphalt = "#2b2d2f";
  const taxi = "#323436";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3448, 60]} />
        <meshLambertMaterial color={asphalt} />
      </mesh>
      <mesh position={[-480, -0.01, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
        <boxGeometry args={[2871, 0.05, 45]} />
        <meshLambertMaterial color={asphalt} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -96]} receiveShadow>
        <planeGeometry args={[3440, 23]} />
        <meshLambertMaterial color={taxi} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.006, 96]} receiveShadow>
        <planeGeometry args={[3280, 23]} />
        <meshLambertMaterial color={taxi} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1280, 0.007, -63]} receiveShadow>
        <planeGeometry args={[23, 66]} />
        <meshLambertMaterial color={taxi} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[220, 0.004, 168]} receiveShadow>
        <planeGeometry args={[280, 70]} />
        <meshLambertMaterial color={taxi} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-80, 0.004, -220]} receiveShadow>
        <planeGeometry args={[320, 90]} />
        <meshLambertMaterial color={taxi} />
      </mesh>
    </group>
  );
}

export function InspectRig() {
  const mode = useLab((s) => s.mode);
  const selectedId = useLab((s) => s.selectedId);
  const focusToken = useLab((s) => s.focusToken);
  const controls = useRef<import("three-stdlib").OrbitControls | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (mode !== "inspect") return;
    const f = selectedId ? FEATURE_BY_ID.get(selectedId) : null;
    if (!f || !controls.current) {
      if (!selectedId) {
        camera.position.set(...INSPECT_START.position);
        controls.current?.target.set(...INSPECT_START.target);
      }
      return;
    }
    const fp = f.footprint;
    const dist = Math.max(40, Math.min(280, Math.max(fp.length, fp.width) * 0.9));
    controls.current.target.set(fp.x, 0.5, fp.z);
    camera.position.set(fp.x + dist * 0.35, dist * 0.55, fp.z + dist * 0.7);
    controls.current.update();
  }, [focusToken, mode, selectedId, camera]);

  return (
    <OrbitControls
      ref={controls}
      enabled={mode === "inspect"}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={4200}
      maxPolarAngle={Math.PI / 2 - 0.03}
      makeDefault={mode === "inspect"}
    />
  );
}

export function WalkRig() {
  const mode = useLab((s) => s.mode);
  const selectedId = useLab((s) => s.selectedId);
  const focusToken = useLab((s) => s.focusToken);
  const walkReset = useLab((s) => s.walkReset);
  const layers = useLab((s) => s.layers);
  const select = useLab((s) => s.select);
  const setPointerLocked = useLab((s) => s.setPointerLocked);
  const { camera, gl } = useThree();
  const yaw = useRef(WALK_START.yaw);
  const pitch = useRef(-0.04);
  const pos = useRef(new THREE.Vector3(WALK_START.x, WALK_START.y, WALK_START.z));
  const speed = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    pos.current.set(WALK_START.x, WALK_START.y, WALK_START.z);
    yaw.current = WALK_START.yaw;
    pitch.current = -0.04;
    speed.current = 0;
  }, [walkReset]);

  useEffect(() => {
    if (mode !== "walk") return;
    if (!focusToken || focusToken <= walkReset) return;
    const f = selectedId ? FEATURE_BY_ID.get(selectedId) : null;
    if (!f) return;
    pos.current.set(f.footprint.x + 16, Math.max(pos.current.y, 1.7), f.footprint.z + 16);
    const dx = f.footprint.x - pos.current.x;
    const dz = f.footprint.z - pos.current.z;
    yaw.current = Math.atan2(-dx, -dz);
  }, [focusToken, mode, selectedId, walkReset]);

  useEffect(() => {
    window.__controlsTest = {
      getYaw: () => yaw.current,
      getSpeed: () => speed.current,
      setKeys: (codes) => input.setInjected(codes),
      getPosition: () => ({ x: pos.current.x, y: pos.current.y, z: pos.current.z }),
    };
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: MouseEvent) => {
      if (mode !== "walk" || !locked.current) return;
      yaw.current -= e.movementX * 0.0022;
      pitch.current -= e.movementY * 0.0022;
      const lim = Math.PI / 2 - 0.04;
      pitch.current = Math.max(-lim, Math.min(lim, pitch.current));
    };
    const onLock = () => {
      locked.current = document.pointerLockElement === el;
      setPointerLocked(locked.current);
    };
    const onClick = () => {
      if (mode !== "walk") return;
      if (!locked.current) {
        const p = el.requestPointerLock();
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => {});
        }
      } else {
        const ndc = new THREE.Vector2(0, 0);
        const ray = new THREE.Raycaster();
        ray.setFromCamera(ndc, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hit = new THREE.Vector3();
        ray.ray.intersectPlane(plane, hit);
        if (hit) {
          const f = pickFeature(hit.x, hit.z, layers);
          if (f) select(f.id);
        }
      }
    };
    el.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLock);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLock);
      el.removeEventListener("click", onClick);
    };
  }, [camera, gl, layers, mode, select, setPointerLocked]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    if (mode !== "walk") return;

    const look = input.consumeLook();
    if (!locked.current) {
      yaw.current -= look.dx * 0.012;
      pitch.current -= look.dy * 0.012;
      const lim = Math.PI / 2 - 0.04;
      pitch.current = Math.max(-lim, Math.min(lim, pitch.current));
    }

    if (input.consumeF()) {
      const f = nearestFeature(pos.current.x, pos.current.z, layers);
      if (f) select(f.id);
    }

    const sprint = input.has("ShiftLeft") || input.has("ShiftRight");
    const crouch = input.has("KeyC");
    const max = sprint ? 38 : 11;
    let ax = 0;
    let az = 0;
    if (input.has("KeyW") || input.has("ArrowUp")) az += 1;
    if (input.has("KeyS") || input.has("ArrowDown")) az -= 1;
    if (input.has("KeyD") || input.has("ArrowRight")) ax += 1;
    if (input.has("KeyA") || input.has("ArrowLeft")) ax -= 1;
    ax += input.touchX;
    az += input.touchY;
    const len = Math.hypot(ax, az);
    if (len > 1) {
      ax /= len;
      az /= len;
    }

    let vy = 0;
    if (input.has("Space") || input.has("KeyE")) vy += 1;
    if (input.has("ControlLeft") || input.has("ControlRight") || input.has("KeyQ")) vy -= 1;

    const eye = crouch ? 1.05 : 1.7;
    const fx = -Math.sin(yaw.current);
    const fz = -Math.cos(yaw.current);
    const rx = Math.cos(yaw.current);
    const rz = -Math.sin(yaw.current);

    const moving = len > 0.01;
    const target = moving ? max : 0;
    speed.current += (target - speed.current) * Math.min(1, d * 10);

    const step = (moving ? max : 0) * d;
    pos.current.x += (fx * az + rx * ax) * step;
    pos.current.z += (fz * az + rz * ax) * step;
    pos.current.y += vy * (sprint ? 28 : 12) * d;
    if (vy === 0 && pos.current.y < eye + 0.02) pos.current.y = eye;
    if (pos.current.y < 0.4) pos.current.y = 0.4;
    if (pos.current.y > 900) pos.current.y = 900;

    camera.position.copy(pos.current);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
  });

  return null;
}

export function Picker() {
  const mode = useLab((s) => s.mode);
  const select = useLab((s) => s.select);
  const layers = useLab((s) => s.layers);
  const down = useRef({ x: 0, y: 0 });
  const { camera, gl } = useThree();

  useEffect(() => {
    if (mode !== "inspect") return;
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      down.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 7) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      if (!ray.ray.intersectPlane(plane, hit)) return;
      const f = pickFeature(hit.x, hit.z, layers);
      select(f ? f.id : null);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl, layers, mode, select]);

  return null;
}

export function Gizmo() {
  const selectedId = useLab((s) => s.selectedId);
  const f = selectedId ? FEATURE_BY_ID.get(selectedId) : null;
  const pts = useMemo(() => {
    if (!f) return null;
    const r = f.footprint;
    const h = (r.headingDeg * Math.PI) / 180;
    const fx = Math.sin(h);
    const fz = -Math.cos(h);
    const rx = Math.cos(h);
    const rz = Math.sin(h);
    const hl = r.length / 2;
    const hw = r.width / 2;
    const corner = (a: number, b: number): [number, number, number] => [
      r.x + fx * a + rx * b,
      0.12,
      r.z + fz * a + rz * b,
    ];
    return {
      rect: [corner(-hl, -hw), corner(hl, -hw), corner(hl, hw), corner(-hl, hw), corner(-hl, -hw)],
      lenA: corner(-hl, -hw - 4),
      lenB: corner(hl, -hw - 4),
      widA: corner(-hl - 4, -hw),
      widB: corner(-hl - 4, hw),
      lenMid: corner(0, -hw - 4),
      widMid: corner(-hl - 4, 0),
      len: r.length,
      wid: r.width,
    };
  }, [f]);

  if (!f || !pts) return null;
  const yaw = -(f.footprint.headingDeg * Math.PI) / 180 + Math.PI / 2;

  return (
    <group>
      <Line points={pts.rect} color="#f4f1ea" lineWidth={1.5} />
      <mesh position={[f.footprint.x, 0.09, f.footprint.z]} rotation={[0, yaw, 0]}>
        <boxGeometry args={[Math.max(f.footprint.width, 2), 0.02, Math.max(f.footprint.length, 2)]} />
        <meshBasicMaterial color="#f4f1ea" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <Html position={pts.lenMid} center sprite distanceFactor={80} style={{ pointerEvents: "none" }}>
        <div className="rounded-sm border border-border bg-panel/90 px-2 py-0.5 font-mono text-[11px] text-fg whitespace-nowrap">
          {fmt(pts.len)} m
        </div>
      </Html>
      <Html position={pts.widMid} center sprite distanceFactor={80} style={{ pointerEvents: "none" }}>
        <div className="rounded-sm border border-border bg-panel/90 px-2 py-0.5 font-mono text-[11px] text-fg whitespace-nowrap">
          {fmt(pts.wid)} m
        </div>
      </Html>
    </group>
  );
}

function fmt(n: number) {
  return n >= 100 ? n.toFixed(0) : n.toFixed(2).replace(/\.?0+$/, "");
}
