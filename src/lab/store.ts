import { create } from "zustand";
import type { Feature } from "./catalog";

export type Mode = "start" | "inspect" | "walk";
export type Lighting = "day" | "dusk" | "night";

export type Layers = {
  markings: boolean;
  lights: boolean;
  signs: boolean;
  buildings: boolean;
};

type LabState = {
  mode: Mode;
  lighting: Lighting;
  layers: Layers;
  selectedId: string | null;
  helpOpen: boolean;
  catalogOpen: boolean;
  walkReset: number;
  focusToken: number;
  pointerLocked: boolean;
  enter: (mode: "inspect" | "walk") => void;
  setMode: (mode: Mode) => void;
  setLighting: (l: Lighting) => void;
  toggleLayer: (k: keyof Layers) => void;
  select: (id: string | null) => void;
  setHelpOpen: (v: boolean) => void;
  setCatalogOpen: (v: boolean) => void;
  setPointerLocked: (v: boolean) => void;
  focusFeature: (f: Feature) => void;
};

export const useLab = create<LabState>((set) => ({
  mode: "start",
  lighting: "day",
  layers: { markings: true, lights: true, signs: true, buildings: true },
  selectedId: null,
  helpOpen: false,
  catalogOpen: false,
  walkReset: 0,
  focusToken: 0,
  pointerLocked: false,
  enter: (mode) =>
    set({
      mode,
      helpOpen: false,
      catalogOpen: mode === "inspect" && typeof window !== "undefined" && window.innerWidth >= 768,
      walkReset: mode === "walk" ? Date.now() : 0,
    }),
  setMode: (mode) =>
    set((s) => ({
      mode,
      walkReset: mode === "walk" ? Date.now() : s.walkReset,
      pointerLocked: mode === "walk" ? s.pointerLocked : false,
    })),
  setLighting: (lighting) => set({ lighting }),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  select: (selectedId) => set({ selectedId }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setCatalogOpen: (catalogOpen) => set({ catalogOpen }),
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  focusFeature: (f) =>
    set({
      selectedId: f.id,
      catalogOpen: true,
      focusToken: Date.now(),
    }),
}));
