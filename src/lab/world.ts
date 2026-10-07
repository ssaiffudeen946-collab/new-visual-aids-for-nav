/** VABB schematic world: 1 unit = 1 metre, +Y up, −Z north, +X east. */

export const WORLD = {
  north: -1 as const,
  unit: "m" as const,
};

export type RwyId = "0927" | "1432";
export type EndId = "09" | "27" | "14" | "32";

export type RunwayDef = {
  id: RwyId;
  pair: string;
  length: number;
  width: number;
  /** True heading of the first-named end (09 or 14). +along follows this heading. */
  heading: number;
  clWidth: number;
  center: { x: number; z: number };
  ends: Record<
    string,
    {
      name: EndId;
      heading: number;
      displaced: number;
      sign: -1 | 1;
      cat: string;
      papiDeg: number;
      alsM: number;
    }
  >;
};

export const RWY_0927: RunwayDef = {
  id: "0927",
  pair: "09/27",
  length: 3448,
  width: 60,
  heading: 90,
  clWidth: 0.9,
  center: { x: 0, z: 0 },
  ends: {
    "09": {
      name: "09",
      heading: 90,
      displaced: 142,
      sign: -1,
      cat: "CAT I",
      papiDeg: 3.0,
      alsM: 540,
    },
    "27": {
      name: "27",
      heading: 270,
      displaced: 482,
      sign: 1,
      cat: "CAT II",
      papiDeg: 3.0,
      alsM: 900,
    },
  },
};

export const RWY_1432: RunwayDef = {
  id: "1432",
  pair: "14/32",
  length: 2871,
  width: 45,
  heading: 135,
  clWidth: 0.45,
  center: { x: -480, z: 0 },
  ends: {
    "14": {
      name: "14",
      heading: 135,
      displaced: 377,
      sign: -1,
      cat: "CAT I",
      papiDeg: 3.0,
      alsM: 740,
    },
    "32": {
      name: "32",
      heading: 315,
      displaced: 260,
      sign: 1,
      cat: "SALS",
      papiDeg: 3.26,
      alsM: 420,
    },
  },
};

export const RUNWAYS = { "0927": RWY_0927, "1432": RWY_1432 };

export const TAXI_N = { z: -96, x0: -1720, x1: 1720, width: 23 };
export const TAXI_S = { z: 96, x0: -1600, x1: 1680, width: 23 };
export const TAXI_N1 = { x: -1280, z0: -96, z1: -30, width: 23 };

export function headingVec(headingDeg: number) {
  const h = (headingDeg * Math.PI) / 180;
  const fx = Math.sin(h);
  const fz = -Math.cos(h);
  const rx = Math.cos(h);
  const rz = Math.sin(h);
  return { fx, fz, rx, rz, yaw: -h };
}

export function rwyPos(rwy: RunwayDef, along: number, across: number, y = 0) {
  const { fx, fz, rx, rz } = headingVec(rwy.heading);
  return {
    x: rwy.center.x + fx * along + rx * across,
    y,
    z: rwy.center.z + fz * along + rz * across,
  };
}

export function rwyYaw(rwy: RunwayDef) {
  return headingVec(rwy.heading).yaw;
}

/** Along-station of a threshold, from runway geometric centre. */
export function thresholdAlong(rwy: RunwayDef, endName: string) {
  const end = rwy.ends[endName];
  return end.sign * (rwy.length / 2 - end.displaced);
}

export function physicalAlong(rwy: RunwayDef, sign: -1 | 1) {
  return sign * (rwy.length / 2);
}

/** +1 if landing direction is +along (first-named end). */
export function landingSign(end: { sign: -1 | 1 }) {
  return (-end.sign) as -1 | 1;
}

export function endOf(name: EndId) {
  const rwy = name === "09" || name === "27" ? RWY_0927 : RWY_1432;
  return { rwy, end: rwy.ends[name] };
}

export function thresholdWorld(name: EndId, across = 0, y = 0) {
  const { rwy, end } = endOf(name);
  return rwyPos(rwy, thresholdAlong(rwy, end.name), across, y);
}

export type OrientedRect = {
  x: number;
  z: number;
  headingDeg: number;
  length: number;
  width: number;
};

export function containsXZ(rect: OrientedRect, x: number, z: number, pad = 4) {
  const { fx, fz, rx, rz } = headingVec(rect.headingDeg);
  const dx = x - rect.x;
  const dz = z - rect.z;
  const along = dx * fx + dz * fz;
  const across = dx * rx + dz * rz;
  return Math.abs(along) <= rect.length / 2 + pad && Math.abs(across) <= rect.width / 2 + pad;
}

export function rectArea(r: OrientedRect) {
  return r.length * r.width;
}

export const WALK_START = {
  ...thresholdWorld("09", 0, 1.7),
  yaw: -Math.PI / 2,
};

export const INSPECT_START = {
  position: [210, 260, 520] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};
