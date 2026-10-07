const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "KeyC",
  "KeyF",
  "KeyH",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Escape",
]);

class InputState {
  keys = new Set<string>();
  injected: Set<string> | null = null;
  touchX = 0;
  touchY = 0;
  lookDx = 0;
  lookDy = 0;
  fPressed = false;
  private fWas = false;

  has(code: string) {
    if (this.injected) return this.injected.has(code);
    return this.keys.has(code);
  }

  setInjected(codes: string[]) {
    this.injected = codes.length ? new Set(codes) : null;
  }

  consumeLook() {
    const dx = this.lookDx;
    const dy = this.lookDy;
    this.lookDx = 0;
    this.lookDy = 0;
    return { dx, dy };
  }

  consumeF() {
    const v = this.fPressed;
    this.fPressed = false;
    return v;
  }

  attach() {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        if (GAME_CODES.has(e.code)) e.preventDefault();
        return;
      }
      this.keys.add(e.code);
      if (e.code === "KeyF") this.fPressed = true;
      if (GAME_CODES.has(e.code)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const onBlur = () => this.keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onBlur);
    };
  }
}

export const input = new InputState();

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
      getPosition?: () => { x: number; y: number; z: number };
    };
  }
}
