/** 7-segment digits in a local frame: along = height (9 m), across = width (5 m). */

export type Seg = { across: number; along: number; w: number; d: number };

const W = 5;
const H = 9;
const S = 1.15;

const segs: Record<string, Seg> = {
  a: { across: 0, along: H - S / 2, w: W, d: S },
  b: { across: W / 2 - S / 2, along: H * 0.75, w: S, d: H * 0.42 },
  c: { across: W / 2 - S / 2, along: H * 0.25, w: S, d: H * 0.42 },
  d: { across: 0, along: S / 2, w: W, d: S },
  e: { across: -(W / 2 - S / 2), along: H * 0.25, w: S, d: H * 0.42 },
  f: { across: -(W / 2 - S / 2), along: H * 0.75, w: S, d: H * 0.42 },
  g: { across: 0, along: H / 2, w: W, d: S },
};

const MAP: Record<string, string[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};

export const DIGIT_W = W;
export const DIGIT_H = H;
export const DIGIT_GAP = 2.2;

export function digitSegs(ch: string): Seg[] {
  return (MAP[ch] ?? []).map((k) => segs[k]);
}
