import { useLab } from "../store";

export function StartScreen() {
  const enter = useLab((s) => s.enter);
  const setHelpOpen = useLab((s) => s.setHelpOpen);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/92 px-5">
      <div className="w-full max-w-lg">
        <p className="font-mono text-[11px] tracking-[0.28em] text-muted uppercase">
          VABB · BOM · Mumbai
        </p>
        <h1 className="mt-3 font-sans text-5xl font-semibold tracking-[-0.04em] text-fg sm:text-6xl">
          Runway Lab
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Chhatrapati Shivaji Maharaj International Airport. An educational schematic of ICAO Annex 14
          markings, lights and signs on published VABB dimensions. Not a photoreal twin. Not for real
          navigation.
        </p>

        <Schematic className="mt-8 mb-8 h-28 w-full text-fg/70" />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => enter("inspect")}
            className="h-12 flex-1 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg transition-transform duration-150 hover:brightness-95 active:scale-[0.98]"
          >
            Enter airfield
          </button>
          <button
            type="button"
            onClick={() => enter("walk")}
            className="h-12 flex-1 rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-fg transition-transform duration-150 hover:bg-surface-2 active:scale-[0.98]"
          >
            Walk mode
          </button>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="mt-4 text-left text-xs text-subtle underline-offset-4 hover:text-muted hover:underline"
        >
          Briefing — Annex 14, dimensions, disclaimer
        </button>
        <a
          href="/vabb-runway-lab.zip"
          download="vabb-runway-lab.zip"
          className="mt-3 inline-block text-xs text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Download source (.zip)
        </a>
      </div>
    </div>
  );
}

function Schematic({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 120" className={className} aria-hidden="true">
      <rect x="20" y="52" width="440" height="10" fill="currentColor" opacity="0.85" />
      <rect
        x="168"
        y="8"
        width="300"
        height="8"
        fill="currentColor"
        opacity="0.7"
        transform="rotate(45 180 60)"
      />
      <rect x="20" y="40" width="440" height="1.2" fill="currentColor" opacity="0.25" />
      <rect x="20" y="72" width="440" height="1.2" fill="currentColor" opacity="0.25" />
      <circle cx="48" cy="57" r="3" fill="currentColor" />
      <text x="56" y="44" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace">
        09
      </text>
      <text x="430" y="44" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace">
        27
      </text>
      <text x="150" y="18" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace">
        14
      </text>
      <text x="330" y="112" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace">
        32
      </text>
    </svg>
  );
}
