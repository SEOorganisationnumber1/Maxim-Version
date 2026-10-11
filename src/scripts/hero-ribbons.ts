// Ambient motion for the Home hero ribbons.
//
// Each ribbon is a chain of cubic curves. Every joint (an anchor with its two
// handles) drifts on slow sine waves, and its handles rotate together around
// the anchor, so the curve bends without ever kinking. Every wave completes a
// whole number of cycles per LOOP_S, so the last frame equals the first: the
// loop has no seam. Each tinted shape replays its ribbon's motion LAG_S later.
//
// This module is also the single source of truth for the hero art: index.astro
// renders each path's static `d` with ribbonPath(), so editing a shape here
// changes both the static art and the motion. It has no top-level DOM access.

type Vec = readonly [x: number, y: number];
/** [amplitude in SVG units (degrees for r), whole cycles per loop, phase 0..1] */
type Wave = readonly [amplitude: number, cycles: number, phase: number];
interface Drift {
  x?: Wave;
  y?: Wave;
  r?: Wave;
}
interface Joint {
  in: Vec;
  a: Vec;
  out: Vec;
  drift?: Drift;
}
interface Rig {
  side: 'left' | 'right';
  start: Vec;
  end: Vec;
  /** Appended after the curves, e.g. ' Z' for a closed blob. */
  tail?: string;
  h0: Vec;
  h1: Vec;
  h0Drift?: Drift;
  h1Drift?: Drift;
  joints: readonly Joint[];
}

const TAU = Math.PI * 2;
const LOOP_S = 24;
const RAMP_S = 3.2; // amplitude and clock wake up together from the static art
const LAG_S = 0.72; // tinted shapes trail their ribbon by this much
const ECHO_GAIN = 0.82;
const TUNED_SCALE = 1.025; // screen px per SVG unit at 1440 x 900, where the waves were tuned
const MIN_ART_PX = 228; // left art width at a 1200 px viewport; narrower strips stay static
const MIN_FRAME_MS = 9.5; // 120/144 Hz displays draw every other frame
const IDLE_MS = 2 * LOOP_S * 1000; // two quiet loops without input, then ease to a stop
const WAKE_TAU_S = 0.4; // playback rate eases in and out with this time constant
const STORAGE_KEY = 'motion'; // site-wide: 'paused' when the visitor paused motion

const round = (n: number) => Math.round(n * 100) / 100;
const pt = (p: Vec) => `${round(p[0])} ${round(p[1])}`;
const wave = (u: number, w?: Wave) => (w ? w[0] * Math.sin(TAU * (w[1] * u + w[2])) : 0);
const add = (p: Vec, dx: number, dy: number): Vec => [p[0] + dx, p[1] + dy];
const rotateAround = (p: Vec, c: Vec, deg: number): Vec => {
  const r = (deg * Math.PI) / 180;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
};
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** start, handle, [joint...], handle, end (+ tail). k scales every drift; k = 0 is the static art. */
function buildPath(rig: Rig, u: number, k: number): string {
  const h0 = add(rig.h0, k * wave(u, rig.h0Drift?.x), k * wave(u, rig.h0Drift?.y));
  const h1 = add(rig.h1, k * wave(u, rig.h1Drift?.x), k * wave(u, rig.h1Drift?.y));
  let d = `M${pt(rig.start)} C${pt(h0)}, `;
  for (const j of rig.joints) {
    const dx = k * wave(u, j.drift?.x);
    const dy = k * wave(u, j.drift?.y);
    const a = add(j.a, dx, dy);
    const rot = k * wave(u, j.drift?.r);
    const hIn = rotateAround(add(j.in, dx, dy), a, rot);
    const hOut = rotateAround(add(j.out, dx, dy), a, rot);
    d += `${pt(hIn)}, ${pt(a)} C${pt(hOut)}, `;
  }
  return `${d}${pt(h1)}, ${pt(rig.end)}${rig.tail ?? ''}`;
}

// A tinted shape replays its ribbon's drift LAG_S later at ECHO_GAIN strength:
// sin(2pi(n*u + p - n*L/T)) is the ribbon's wave at u - L/T, a true trail.
const trail = (w?: Wave): Wave | undefined => w && [w[0] * ECHO_GAIN, w[1], w[2] - (w[1] * LAG_S) / LOOP_S];
const trailDrift = (d?: Drift): Drift | undefined => d && { x: trail(d.x), y: trail(d.y), r: trail(d.r) };
function echoOf(ribbon: Rig, shape: Rig): Rig {
  if (ribbon.joints.length !== shape.joints.length) throw new Error('hero-ribbons: an echo needs matching joints');
  return {
    ...shape,
    h0Drift: trailDrift(ribbon.h0Drift),
    h1Drift: trailDrift(ribbon.h1Drift),
    joints: shape.joints.map((j, i) => ({ ...j, drift: trailDrift(ribbon.joints[i]!.drift) })),
  };
}

const leftRibbon: Rig = {
  side: 'left',
  start: [-60, 60],
  end: [320, 680],
  h0: [110, 0],
  h0Drift: { x: [14, 1, 0.2], y: [12, 2, 0.1] },
  h1: [300, 480],
  h1Drift: { x: [20, 1, 0.55], y: [14, 2, 0.46] },
  joints: [
    // y phases climb joint to joint: one wave travelling up the ribbon, not two bends pumping
    { in: [330, 50], a: [290, 190], out: [250, 320], drift: { x: [16, 1, 0], y: [22, 2, 0.22], r: [6, 1, 0.3] } },
    { in: [50, 250], a: [70, 390], out: [90, 520], drift: { x: [18, 1, 0.45], y: [20, 2, 0.34], r: [7, 1, 0.8] } },
  ],
};

const rightRibbon: Rig = {
  side: 'right',
  start: [300, 20],
  end: [290, 690],
  h0: [150, 60],
  h0Drift: { x: [16, 1, 0.75], y: [14, 1, 0.3] },
  h1: [190, 540],
  h1Drift: { x: [14, 1, 0.05], y: [18, 2, 0.6] },
  joints: [{ in: [90, 200], a: [190, 310], out: [280, 410], drift: { x: [14, 1, 0.5], y: [22, 2, 0.35], r: [7, 1, 0.1] } }],
};

export const RIBBONS = {
  'left-blob': echoOf(leftRibbon, {
    side: 'left',
    start: [-40, -20],
    end: [300, 700],
    tail: ' L -40 700 Z',
    h0: [160, -60],
    h1: [260, 560],
    joints: [
      { in: [420, 40], a: [330, 220], out: [250, 380] },
      { in: [60, 250], a: [40, 420], out: [20, 590] },
    ],
  }),
  'left-ribbon': leftRibbon,
  'left-accent': {
    side: 'left',
    start: [-70, 540],
    end: [130, 700],
    h0: [30, 470],
    h0Drift: { x: [16, 1, 0.35], y: [14, 2, 0.5] },
    h1: [170, 540],
    h1Drift: { x: [18, 1, 0.85], y: [16, 1, 0.1] },
    joints: [],
  },
  'right-blob': echoOf(rightRibbon, {
    side: 'right',
    start: [300, -20],
    end: [300, 680],
    tail: ' Z',
    h0: [140, 0],
    h1: [200, 560],
    joints: [{ in: [40, 180], a: [150, 300], out: [240, 400] }],
  }),
  'right-ribbon': rightRibbon,
} satisfies Record<string, Rig>;

export type RibbonId = keyof typeof RIBBONS;

/** Static path data for the hero markup. */
export const ribbonPath = (id: RibbonId): string => buildPath(RIBBONS[id], 0, 0);

/** Gradient light drifts along each gradient's own axis (colour only, not scaled by fit). */
const GRADIENT_WAVES: Record<string, Wave> = {
  'hero-a': [60, 1, 0],
  'hero-b': [30, 2, 0.2],
  'hero-c': [60, 1, 0.5],
};

if (import.meta.env.DEV) {
  const rigs: Rig[] = Object.values(RIBBONS);
  const drifts: (Drift | undefined)[] = rigs.flatMap((r) => [r.h0Drift, r.h1Drift, ...r.joints.map((j) => j.drift)]);
  const waves = drifts.flatMap((d) => (d ? [d.x, d.y, d.r] : []));
  for (const w of [...waves, ...Object.values(GRADIENT_WAVES)]) {
    if (w) console.assert(Number.isInteger(w[1]), 'hero-ribbons: wave cycles must be whole numbers or the loop seams', w);
  }
}

const readPaused = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'paused';
  } catch {
    return false;
  }
};
const writePaused = (paused: boolean) => {
  try {
    if (paused) localStorage.setItem(STORAGE_KEY, 'paused');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private mode): the choice lasts for this page only
  }
};

/**
 * Starts the ribbon motion inside `root` (the hero section). Returns a teardown.
 * Markup contract: [data-ribbon-art="left|right"] panels, <path data-ribbon="<RibbonId>">,
 * <linearGradient data-ribbon-gradient>, an optional [data-motion-toggle] button and an
 * optional [data-motion-fallback] element that takes focus if the button disappears.
 */
export function startHeroRibbons(root: HTMLElement): () => void {
  if (root.dataset.ribbons === 'on') return () => {};

  const artLeft = root.querySelector<HTMLElement>('[data-ribbon-art="left"]');
  const artRight = root.querySelector<HTMLElement>('[data-ribbon-art="right"]');
  const paths = [...root.querySelectorAll<SVGPathElement>('[data-ribbon]')].flatMap((el) => {
    const rig = (RIBBONS as Record<string, Rig>)[el.dataset.ribbon ?? ''];
    return rig ? [{ rig, el }] : [];
  });
  if (!artLeft || !artRight || !paths.length) return () => {};
  root.dataset.ribbons = 'on';

  const gradients = [...root.querySelectorAll<SVGLinearGradientElement>('[data-ribbon-gradient]')].flatMap((el) => {
    const w = GRADIENT_WAVES[el.id];
    const base = ['x1', 'y1', 'x2', 'y2'].map((a) => parseFloat(el.getAttribute(a) ?? '0'));
    const [x1, y1, x2, y2] = base as [number, number, number, number];
    const len = Math.hypot(x2 - x1, y2 - y1);
    return w && len ? [{ el, w, base: [x1, y1, x2, y2] as const, ux: (x2 - x1) / len, uy: (y2 - y1) / len }] : [];
  });
  const button = root.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    t: 0, // animation clock in seconds; only advances while running
    ramp: 0, // seconds of motion since it first woke (reset by reduced motion)
    rate: 0, // eased playback rate, 0..1
    idle: false,
    userPaused: readPaused(),
    offscreen: true, // until the first IntersectionObserver entry says otherwise
    hidden: document.hidden,
    reduced: reduce.matches,
    artVisible: artLeft.clientWidth >= MIN_ART_PX,
    fit: { left: 1, right: 1 },
  };
  let raf = 0;
  let last = 0;
  let lastInput = performance.now();

  const fitOf = (el: HTMLElement, viewBoxWidth: number) => {
    const scale = Math.max(el.clientWidth / viewBoxWidth, el.clientHeight / 640);
    return scale ? Math.min(1, TUNED_SCALE / scale) : 1;
  };
  const measureFit = () => {
    state.fit = { left: fitOf(artLeft, 400), right: fitOf(artRight, 260) };
  };
  measureFit();

  function render() {
    const u = (state.t % LOOP_S) / LOOP_S;
    const k = smoothstep(clamp01(state.ramp / RAMP_S));
    for (const { rig, el } of paths) el.setAttribute('d', buildPath(rig, u, k * state.fit[rig.side]));
    for (const g of gradients) {
      const s = k * wave(u, g.w);
      g.el.setAttribute('x1', String(round(g.base[0] + g.ux * s)));
      g.el.setAttribute('y1', String(round(g.base[1] + g.uy * s)));
      g.el.setAttribute('x2', String(round(g.base[2] + g.ux * s)));
      g.el.setAttribute('y2', String(round(g.base[3] + g.uy * s)));
    }
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    state.rate = 0; // whatever restarts the loop eases in from rest
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame); // first, so one failed render cannot strand the loop
    if (last && now - last < MIN_FRAME_MS) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; // a hitch never becomes a jump
    last = now;
    if (!state.idle && now - lastInput > IDLE_MS) state.idle = true;
    state.rate += ((state.idle ? 0 : 1) - state.rate) * (1 - Math.exp(-dt / WAKE_TAU_S));
    state.ramp += dt * state.rate;
    state.t += dt * state.rate * smoothstep(clamp01(state.ramp / RAMP_S));
    render();
    if (state.idle && state.rate < 0.002) stop();
  }

  const canMove = () => !state.reduced && state.artVisible;

  function sync() {
    const run = canMove() && !state.userPaused && !state.offscreen && !state.hidden && !state.idle;
    if (run && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      stop();
    }
    if (button) {
      const hide = !canMove();
      if (hide && document.activeElement === button) {
        root.querySelector<HTMLElement>('[data-motion-fallback]')?.focus({ preventScroll: true });
      }
      button.hidden = hide;
      button.setAttribute('aria-label', state.userPaused ? 'Play background animation' : 'Pause background animation');
      button.dataset.state = state.userPaused ? 'paused' : 'playing';
    }
  }

  const ac = new AbortController();
  const { signal } = ac;

  button?.addEventListener(
    'click',
    () => {
      state.userPaused = !state.userPaused;
      writePaused(state.userPaused);
      if (!state.userPaused) {
        state.idle = false;
        lastInput = performance.now();
      }
      sync();
    },
    { signal },
  );

  reduce.addEventListener(
    'change',
    () => {
      state.reduced = reduce.matches;
      if (state.reduced) {
        state.ramp = 0; // k = 0: the exact designed art; motion eases back in if re-enabled
        render();
      }
      sync();
    },
    { signal },
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      state.hidden = document.hidden;
      sync();
    },
    { signal },
  );

  const wake = () => {
    lastInput = performance.now();
    if (state.idle) {
      state.idle = false;
      sync();
    }
  };
  for (const type of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart']) {
    window.addEventListener(type, wake, { passive: true, signal });
  }

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      state.offscreen = entry.intersectionRatio < 0.1;
      sync();
    },
    { threshold: [0, 0.1] },
  );
  io.observe(root);

  const ro = new ResizeObserver(() => {
    state.artVisible = artLeft.clientWidth >= MIN_ART_PX;
    measureFit();
    if (!raf && state.ramp > 0) render(); // keep a paused pose consistent with the new fit
    sync();
  });
  ro.observe(artLeft);
  ro.observe(artRight);

  sync();

  if (import.meta.env.DEV) {
    (window as unknown as { __ribbons?: unknown }).__ribbons = { state, render };
  }

  return () => {
    ac.abort();
    io.disconnect();
    ro.disconnect();
    cancelAnimationFrame(raf);
    raf = 0;
    delete root.dataset.ribbons;
  };
}
