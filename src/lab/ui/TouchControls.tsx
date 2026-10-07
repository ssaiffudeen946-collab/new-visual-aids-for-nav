import { useEffect, useRef } from "react";
import { input } from "../input";
import { useLab } from "../store";

export function TouchControls() {
  const mode = useLab((s) => s.mode);
  if (mode !== "walk") return null;
  return (
    <>
      <Joystick />
      <LookPad />
    </>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  useEffect(() => {
    const el = base.current;
    if (!el) return;
    const setFrom = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = r.width / 2 - 8;
      const m = Math.hypot(dx, dy);
      if (m > max) {
        dx = (dx / m) * max;
        dy = (dy / m) * max;
      }
      input.touchX = dx / max;
      input.touchY = -dy / max;
      if (knob.current) {
        knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    const clear = () => {
      pid.current = null;
      input.touchX = 0;
      input.touchY = 0;
      if (knob.current) knob.current.style.transform = "translate(0,0)";
    };
    const down = (e: PointerEvent) => {
      pid.current = e.pointerId;
      el.setPointerCapture(e.pointerId);
      setFrom(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      if (pid.current !== e.pointerId) return;
      setFrom(e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => {
      if (pid.current !== e.pointerId) return;
      clear();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      clear();
    };
  }, []);

  return (
    <div
      ref={base}
      className="pointer-events-auto absolute bottom-24 left-4 z-20 size-[7.5rem] rounded-full border border-border bg-panel/50 md:hidden"
      style={{ touchAction: "none" }}
      aria-label="Move"
    >
      <div
        ref={knob}
        className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/40 bg-accent/80"
      />
    </div>
  );
}

function LookPad() {
  const pid = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });

  return (
    <div
      className="pointer-events-auto absolute inset-y-24 right-0 z-10 w-1/2 md:hidden"
      style={{ touchAction: "none" }}
      aria-label="Look"
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        last.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        input.lookDx += e.clientX - last.current.x;
        input.lookDy += e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => {
        pid.current = null;
      }}
      onPointerCancel={() => {
        pid.current = null;
      }}
    />
  );
}
