import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  Eye,
  HelpCircle,
  Layers,
  Lightbulb,
  Moon,
  PersonStanding,
  Signpost,
  Sun,
  Sunset,
  X,
} from "lucide-react";
import { FEATURES, FEATURE_BY_ID, type FeatureKind } from "../catalog";
import { useLab, type Layers as LayerState, type Lighting } from "../store";
import { cn } from "@/lib/utils";

const LAYER_KEY: Record<FeatureKind, keyof LayerState> = {
  marking: "markings",
  light: "lights",
  sign: "signs",
  building: "buildings",
};

const KINDS: { id: FeatureKind; label: string; icon: typeof Layers }[] = [
  { id: "marking", label: "Markings", icon: Layers },
  { id: "light", label: "Lights", icon: Lightbulb },
  { id: "sign", label: "Signs", icon: Signpost },
  { id: "building", label: "Buildings", icon: Building2 },
];

export function HUD() {
  const mode = useLab((s) => s.mode);
  const lighting = useLab((s) => s.lighting);
  const setLighting = useLab((s) => s.setLighting);
  const setMode = useLab((s) => s.setMode);
  const layers = useLab((s) => s.layers);
  const toggleLayer = useLab((s) => s.toggleLayer);
  const catalogOpen = useLab((s) => s.catalogOpen);
  const setCatalogOpen = useLab((s) => s.setCatalogOpen);
  const helpOpen = useLab((s) => s.helpOpen);
  const setHelpOpen = useLab((s) => s.setHelpOpen);
  const selectedId = useLab((s) => s.selectedId);
  const select = useLab((s) => s.select);
  const pointerLocked = useLab((s) => s.pointerLocked);
  const selected = selectedId ? FEATURE_BY_ID.get(selectedId) : null;

  if (mode === "start") {
    return helpOpen ? <HelpModal /> : null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <header className="pointer-events-auto flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="rounded-lg border border-border bg-panel/90 px-3 py-2 backdrop-blur-sm">
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">VABB · BOM</p>
          <p className="text-sm font-semibold tracking-tight">Runway Lab</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Seg
            value={mode}
            onChange={(v) => setMode(v)}
            options={[
              { id: "inspect", label: "Inspect", icon: Eye },
              { id: "walk", label: "Walk", icon: PersonStanding },
            ]}
          />
          <Seg
            value={lighting}
            onChange={(v) => setLighting(v as Lighting)}
            options={[
              { id: "day", label: "Day", icon: Sun },
              { id: "dusk", label: "Dusk", icon: Sunset },
              { id: "night", label: "Night", icon: Moon },
            ]}
          />
        </div>
      </header>

      {mode === "walk" && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 size-4 -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <div className="absolute top-0 left-1/2 h-full w-px bg-fg/80" />
          <div className="absolute top-1/2 left-0 h-px w-full bg-fg/80" />
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {catalogOpen && (
          <aside className="pointer-events-auto absolute top-0 bottom-2 left-3 z-20 flex w-[min(18rem,calc(100%-1.5rem))] max-h-full flex-col overflow-hidden rounded-xl border border-border bg-panel/94 backdrop-blur-sm md:static md:mb-2 md:ml-3 md:w-72">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">Catalog</p>
              <button type="button" className="p-1 text-subtle hover:text-fg" onClick={() => setCatalogOpen(false)} aria-label="Close catalog">
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {KINDS.map((k) => (
                <div key={k.id} className="mb-3">
                  <p className="px-2 pb-1 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">{k.label}</p>
                  {FEATURES.filter((f) => f.kind === k.id).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => useLab.getState().focusFeature(f)}
                      className={cn(
                        "mb-0.5 block w-full rounded-md px-2 py-1.5 text-left text-[13px] leading-snug transition-colors",
                        selectedId === f.id ? "bg-accent text-accent-fg" : "text-fg hover:bg-surface-2",
                      )}
                    >
                      {f.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1" />

        {selected && (
          <article className="pointer-events-auto absolute right-3 bottom-2 top-0 z-20 w-[min(100%-1.5rem,22rem)] overflow-y-auto rounded-xl border border-border bg-panel/94 p-4 backdrop-blur-sm md:static md:mb-2 md:mr-3 md:max-h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">{selected.kind}</p>
                <h2 className="text-base font-semibold leading-snug">{selected.title}</h2>
              </div>
              <button type="button" className="p-1 text-subtle hover:text-fg" onClick={() => select(null)} aria-label="Close panel">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted">{selected.location}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-fg">{selected.purpose}</p>
            <p className="mt-3 font-mono text-[11px] text-ok">{selected.icao}</p>
            <table className="mt-3 w-full text-[12px]">
              <tbody>
                {selected.dimensions.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="py-1.5 pr-3 text-muted">{row.label}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">{selected.notes}</p>
          </article>
        )}
      </div>

      <footer className="pointer-events-auto flex flex-wrap items-end justify-between gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          {!catalogOpen && (
            <Chip onClick={() => setCatalogOpen(true)}>
              <BookOpen className="size-3.5" /> Catalog
            </Chip>
          )}
          {KINDS.map((k) => (
            <Chip key={k.id} active={layers[LAYER_KEY[k.id]]} onClick={() => toggleLayer(LAYER_KEY[k.id])}>
              <k.icon className="size-3.5" />
              <span className="hidden sm:inline">{k.label}</span>
            </Chip>
          ))}
          <Chip onClick={() => setHelpOpen(true)}>
            <HelpCircle className="size-3.5" /> Help
          </Chip>
        </div>
        <p className="max-w-xl font-mono text-[10px] leading-relaxed text-subtle sm:text-[11px]">
          {mode === "inspect"
            ? "Drag orbit · scroll zoom · click a marking, light or sign"
            : pointerLocked
              ? "WASD move · Shift sprint · Q/E altitude · Space up · Ctrl down · C crouch · F nearest · Esc unlock"
              : "Tap the airfield to look · WASD or joystick to walk · F inspect nearest"}
        </p>
      </footer>

      {helpOpen && <HelpModal />}
    </div>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon: typeof Eye }[];
}) {
  return (
    <div className="flex rounded-lg border border-border bg-panel/90 p-0.5 backdrop-blur-sm">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium",
            value === o.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          <o.icon className="size-3.5" />
          <span className="hidden sm:inline">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Chip({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium",
        active === false ? "border-border bg-panel/70 text-subtle" : "border-border bg-panel/90 text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function HelpModal() {
  const setHelpOpen = useLab((s) => s.setHelpOpen);
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/70 px-4">
      <div className="max-h-[min(36rem,88vh)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Briefing</h2>
          <button type="button" onClick={() => setHelpOpen(false)} className="p-1 text-subtle hover:text-fg" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-muted">
          <p>
            This lab follows published dimensions for Chhatrapati Shivaji Maharaj International Airport
            (ICAO VABB, IATA BOM) and the visual-aid geometry in ICAO Annex 14 Volume I. It is an
            educational schematic — not a photoreal digital twin, not an AIP substitute, and not for
            real flight or ground navigation.
          </p>
          <p>
            World scale is 1 metre per unit, +Y up, −Z north. RWY 09/27 is 3448 × 60 m (CAT I on 09,
            CAT II on 27). RWY 14/32 is 2871 × 45 m. PAPI colours respond to your camera elevation
            angle: two white and two red means on slope.
          </p>
          <p>
            Inspect: drag to orbit, scroll to zoom, click any marking, light or sign. Walk: start at
            the RWY 09 threshold looking east. WASD move, A/D strafe, Shift sprint, mouse-look after
            click, Q/E altitude, Space up, Ctrl down, C crouch, F inspect nearest. On a phone, use the
            left joystick and drag the right side to look.
          </p>
        </div>
      </div>
    </div>
  );
}
