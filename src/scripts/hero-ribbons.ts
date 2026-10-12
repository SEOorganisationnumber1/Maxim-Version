// "Liquid" motion for the Home hero ribbons.
//
// Every curve deforms in all directions on smooth, never-repeating noise, like ink in water:
// - Each point of a shape (joint anchor, joint handles, the free handles next to the fixed
//   ends) has its own fbm noise streams, mixed with one shared stream per shape, so a ribbon
//   bends as one body instead of wobbling point by point.
// - The shared stream reaches each point a little later than the previous one, so a push
//   travels down the ribbon like a current.
// - Joints travel further across the curve than along it, so the motion reads as bending,
//   not as the ribbon sliding up and down.
// - Noise is read on a clock whose speed drifts, and a very slow swell scales the whole
//   motion, so there are calmer and livelier moments and nothing ever loops.
// - Blobs follow their ribbon a beat later and breathe; gradients drift along their axis.
// Start and end points never move, so ribbon end caps stay outside the visible area, and
// every joint keeps its handles collinear, so curves stay smooth.
//
// This module is also the single source of truth for the hero art: index.astro renders
// each path's static `d` with ribbonPath(). It has no top-level DOM access.

type Vec = readonly [x: number, y: number];
type Side = 'left' | 'right';
type Noise = (x: number) => number;

interface Joint {
  in: Vec;
  a: Vec;
  out: Vec;
}
interface Rig {
  side: Side;
  start: Vec;
  end: Vec;
  /** Appended after the curves, e.g. ' Z' for a closed blob. */
  tail?: string;
  h0: Vec;
  h1: Vec;
  joints: readonly Joint[];
}
interface JointPose {
  dx: number;
  dy: number;
  rot: number;
  scale: number;
}
interface Pose {
  h0?: Vec;
  h1?: Vec;
  joints?: readonly JointPose[];
}

// ---------- Static art (document order inside each panel) ----------

export const RIBBONS = {
  'left-blob': {
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
  },
  'left-ribbon': {
    side: 'left',
    start: [-60, 60],
    end: [320, 680],
    h0: [110, 0],
    h1: [300, 480],
    joints: [
      { in: [330, 50], a: [290, 190], out: [250, 320] },
      { in: [50, 250], a: [70, 390], out: [90, 520] },
    ],
  },
  'left-accent': {
    side: 'left',
    start: [-70, 540],
    end: [130, 700],
    h0: [30, 470],
    h1: [170, 540],
    joints: [],
  },
  'right-blob': {
    side: 'right',
    start: [300, -20],
    end: [300, 680],
    tail: ' Z',
    h0: [140, 0],
    h1: [200, 560],
    joints: [{ in: [40, 180], a: [150, 300], out: [240, 400] }],
  },
  'right-ribbon': {
    side: 'right',
    start: [300, 20],
    end: [290, 690],
    h0: [150, 60],
    h1: [190, 540],
    joints: [{ in: [90, 200], a: [190, 310], out: [280, 410] }],
  },
} satisfies Record<string, Rig>;

export type RibbonId = keyof typeof RIBBONS;

/** Stroked ribbons drive their own motion; seeds are handed out in this order, so keep it fixed. */
const STROKES = ['left-ribbon', 'left-accent', 'right-ribbon'] as const satisfies readonly RibbonId[];
/** Each tinted blob follows the ribbon in front of it (seed order: this object's key order). */
const BLOB_OF = { 'left-blob': 'left-ribbon', 'right-blob': 'right-ribbon' } as const satisfies Partial<
  Record<RibbonId, (typeof STROKES)[number]>
>;

// ---------- Tuning ----------

/** Seconds to ease from the exact static art into full motion. */
const EASE_IN_S = 1.2;
/** Mean speed of the noise clock, in noise cells per second (one cell is about 1.5 s). */
const CLOCK_RATE = 0.68;
/** How far the clock speed wanders around CLOCK_RATE (0.1 = between 90% and 110%). */
const TEMPO_DRIFT = 0.1;
/** Frequency of that tempo wander, in noise cells per second (a new tempo every ~20 s). */
const TEMPO_FREQ = 0.05;
/** Base seed for every noise stream; 77 was checked for creased bends over 5 minutes. Keep it under 400. */
const SEED = 77;
/** fbm octaves per stream: a broad sway plus one finer layer of detail, nothing faster. */
const OCTAVES = 2;
/** Each stream runs at its own pace, up to this share faster or slower than the clock. */
const PACE_SPREAD = 0.15;
/** Half width, in noise cells, of a tiny time blur that tames the fine octave. */
const SMOOTHING = 0.3;
/** Soft limiter strength: lifts small noise values and eases big ones (higher = more even motion). */
const SOFTNESS = 1;
/** Motion multiplier in the calmest phase of the swell (high enough that calm never reads as stopped). */
const SWELL_CALM = 0.92;
/** Motion multiplier in the liveliest phase of the swell (low enough that lively never reads as frantic). */
const SWELL_LIVELY = 1.15;
/** Swell frequency in noise cells per second (calm and lively phases last ~15 to 30 s). */
const SWELL_FREQ = 0.04;
/** Joint travel across the curve (along its normal), in SVG units at full noise. */
const BEND_ACROSS = 38;
/** Joint travel along the curve (along its tangent), in SVG units at full noise. */
const BEND_ALONG = 30;
/** Handle rotation around a joint, in degrees at full noise. */
const TWIST_DEG = 9;
/** Twist share for bends that are already tight in the static art; full twist creases the stroke. */
const TIGHT_BEND_TWIST = 0.3;
/** Joints that use TIGHT_BEND_TWIST, by path and joint index (the left ribbon's lower bend). */
const TIGHT_BENDS: Partial<Record<RibbonId, readonly number[]>> = { 'left-ribbon': [1] };
/** Handle length change around 1 at full noise (0.1 = 90% to 110%). */
const STRETCH = 0.1;
/** Travel of the free handles next to the fixed ends, in SVG units at full noise. */
const HANDLE_TRAVEL = 36;
/** Share of each point's motion that comes from its shape's shared stream (0 = independent, 1 = rigid). */
const COHESION = 0.65;
/** Delay, in noise cells, for the shared stream to reach the next point along a path. */
const RIPPLE_DELAY = 0.4;
/** How strongly a blob copies its ribbon's deformation (1 = fully). */
const BLOB_FOLLOW = 0.95;
/** How far a blob trails its ribbon, in noise cells (~0.45 s at the mean tempo). */
const BLOB_LAG = 0.3;
/** Blob breathing: handle length swings up to this far around 1. */
const BREATH = 0.15;
/** Breathing frequency, in noise cells per second (one slow breath every ~8 s). */
const BREATH_FREQ = 0.12;
/** Gradient drift along its own axis, as a share of the axis length. */
const GRADIENT_SHIFT = 0.09;
/** Gradient drift frequency, in noise cells per second. */
const GRADIENT_FREQ = 0.06;
/** Gradients that drift (seed order: this list's order). */
const GRADIENT_IDS = ['hero-a', 'hero-b', 'hero-c'] as const;

// ---------- Runtime ----------

/** Screen px per SVG unit at 1440 x 900; denser (wider) screens get damped motion. */
const REFERENCE_PX_PER_UNIT = 1.025;
/** Left art width at a 1200 px viewport; narrower strips keep the static art. */
const MIN_ART_PX = 228;
/** 120/144 Hz displays draw every other frame. */
const MIN_FRAME_MS = 9.5;
/** No input for this long, then the motion eases to a stop until the next input. */
const IDLE_MS = 48_000;
/** Playback rate eases in and out with this time constant (resume, idle). */
const WAKE_TAU_S = 0.4;
/** Site-wide localStorage key: 'paused' when the visitor paused motion. */
const STORAGE_KEY = 'motion';

const SHARED_WEIGHT = Math.sqrt(COHESION);
const OWN_WEIGHT = Math.sqrt(1 - COHESION);

// ---------- Geometry ----------

const round = (n: number) => Math.round(n * 100) / 100;
const pt = (p: Vec) => `${round(p[0])} ${round(p[1])}`;
const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const rotateAround = (p: Vec, c: Vec, deg: number): Vec => {
  const r = (deg * Math.PI) / 180;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
};
const scaleAround = (p: Vec, c: Vec, s: number): Vec => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s];
const offset = (p: Vec, o?: Vec): Vec => (o ? [p[0] + o[0], p[1] + o[1]] : p);

/** Path data from a rig and a pose; an empty pose is the static art. */
function buildPath(rig: Rig, pose: Pose = {}): string {
  let d = `M${pt(rig.start)} C${pt(offset(rig.h0, pose.h0))}, `;
  rig.joints.forEach((j, i) => {
    const q = pose.joints?.[i];
    const dx = q?.dx ?? 0;
    const dy = q?.dy ?? 0;
    const a: Vec = [j.a[0] + dx, j.a[1] + dy];
    const move = (p: Vec) => rotateAround(scaleAround([p[0] + dx, p[1] + dy], a, q?.scale ?? 1), a, q?.rot ?? 0);
    d += `${pt(move(j.in))}, ${pt(a)} C${pt(move(j.out))}, `;
  });
  return `${d}${pt(offset(rig.h1, pose.h1))}, ${pt(rig.end)}${rig.tail ?? ''}`;
}

/** Static path data for the hero markup. */
export const ribbonPath = (id: RibbonId): string => buildPath(RIBBONS[id]);

// ---------- Noise ----------

/** Deterministic 1D value noise with quintic interpolation; seed picks the stream. */
function noise1(seed: number): Noise {
  const hash = (i: number) => {
    let h = (i * 374761393 + seed * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) / 4294967295) * 2 - 1;
  };
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * f * (f * (f * 6 - 15) + 10);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  };
}

/** Multi-octave noise1, roughly in [-1, 1]. */
function fbm1(seed: number, octaves: number): Noise {
  const layers = Array.from({ length: octaves }, (_, o) => noise1(seed * 31 + o));
  return (x) => {
    let sum = 0;
    let amp = 1;
    let norm = 0;
    let freq = 1;
    for (const n of layers) {
      sum += n(x * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum / norm;
  };
}

const fract = (v: number) => v - Math.floor(v);

/**
 * One fbm stream with its own phase and pace, read through a small 3-tap time blur.
 * Different phases and paces keep the streams' still moments from lining up.
 */
function makeStream(seed: number): Noise {
  const noise = fbm1(seed, OCTAVES);
  const phase = 10 * fract(seed * 0.6180339);
  const pace = 1 + PACE_SPREAD * (2 * fract(seed * 0.4142136) - 1);
  return (x) => {
    const u = x * pace + phase;
    return (noise(u - SMOOTHING) + 2 * noise(u) + noise(u + SMOOTHING)) / 4;
  };
}

const blend = (shared: number, own: number) => SHARED_WEIGHT * shared + OWN_WEIGHT * own;
/** Soft limiter (1 stays 1): keeps the motion even and slows it near its extremes. */
const soften = (v: number) => Math.tanh(SOFTNESS * v) / Math.tanh(SOFTNESS);
/** soften() applied to a 2D vector's length, keeping its direction. */
function softenVec(x: number, y: number): Vec {
  const len = Math.hypot(x, y);
  const k = len > 1e-6 ? soften(len) / len : SOFTNESS / Math.tanh(SOFTNESS);
  return [x * k, y * k];
}

// ---------- Motion ----------

interface XY {
  x: Noise;
  y: Noise;
}
interface JointMotion extends XY {
  rot: Noise;
  scale: Noise;
  twist: number;
  t: Vec; // unit tangent
  n: Vec; // unit normal
}
interface ShapeMotion {
  shared: XY & { rot: Noise };
  h0: XY;
  h1: XY;
  joints: JointMotion[];
}

function createShapeMotion(id: RibbonId, rig: Rig, nextSeed: () => number): ShapeMotion {
  const stream = () => makeStream(nextSeed());
  const tight = TIGHT_BENDS[id] ?? [];
  return {
    shared: { x: stream(), y: stream(), rot: stream() },
    h0: { x: stream(), y: stream() },
    h1: { x: stream(), y: stream() },
    joints: rig.joints.map((j, i) => {
      const tx = j.out[0] - j.in[0];
      const ty = j.out[1] - j.in[1];
      const len = Math.hypot(tx, ty) || 1;
      return {
        twist: tight.includes(i) ? TIGHT_BEND_TWIST : 1,
        t: [tx / len, ty / len],
        n: [-ty / len, tx / len],
        x: stream(),
        y: stream(),
        rot: stream(),
        scale: stream(),
      };
    }),
  };
}

/** A ribbon's pose at noise time tau; point k reads the shared stream k * RIPPLE_DELAY late. */
function shapePose(m: ShapeMotion, tau: number, gain: number): Pose {
  const late = (order: number) => tau - order * RIPPLE_DELAY;
  const freeHandle = (own: XY, order: number): Vec => {
    const ts = late(order);
    const [x, y] = softenVec(blend(m.shared.x(ts), own.x(tau)), blend(m.shared.y(ts), own.y(tau)));
    return [gain * HANDLE_TRAVEL * x, gain * HANDLE_TRAVEL * y];
  };
  const joints = m.joints.map((own, i) => {
    const ts = late(i + 1);
    const [x, y] = softenVec(blend(m.shared.x(ts), own.x(tau)), blend(m.shared.y(ts), own.y(tau)));
    const across = (x * own.n[0] + y * own.n[1]) * BEND_ACROSS;
    const along = (x * own.t[0] + y * own.t[1]) * BEND_ALONG;
    return {
      dx: gain * (own.n[0] * across + own.t[0] * along),
      dy: gain * (own.n[1] * across + own.t[1] * along),
      rot: gain * own.twist * TWIST_DEG * soften(blend(m.shared.rot(ts), own.rot(tau))),
      scale: 1 + gain * STRETCH * soften(own.scale(tau)),
    };
  });
  return { h0: freeHandle(m.h0, 0), joints, h1: freeHandle(m.h1, m.joints.length + 1) };
}

/** A blob's pose: its ribbon's deformation from BLOB_LAG ago, slightly weaker, breathing on its own. */
function blobPose(ribbon: ShapeMotion, breaths: Noise[], tau: number, t: number, gain: number, breathGain: number): Pose {
  const lead = shapePose(ribbon, tau - BLOB_LAG, gain * BLOB_FOLLOW);
  return {
    h0: lead.h0,
    h1: lead.h1,
    joints: (lead.joints ?? []).map((j, i) => ({ ...j, scale: 1 + breathGain * BREATH * breaths[i]!(t * BREATH_FREQ) })),
  };
}

// ---------- Engine ----------

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

  const arts: Record<Side, HTMLElement | null> = {
    left: root.querySelector<HTMLElement>('[data-ribbon-art="left"]'),
    right: root.querySelector<HTMLElement>('[data-ribbon-art="right"]'),
  };
  const artLeft = arts.left;
  const paths = [...root.querySelectorAll<SVGPathElement>('[data-ribbon]')].flatMap((el) => {
    const id = el.dataset.ribbon as RibbonId;
    return id in RIBBONS ? [{ id, el, rig: RIBBONS[id] as Rig }] : [];
  });
  if (!artLeft || !arts.right || !paths.length) return () => {};
  root.dataset.ribbons = 'on';

  // Noise streams, created in a fixed order so every visit sees the same motion.
  let seed = SEED * 1000;
  const nextSeed = () => seed++;
  const motion = {} as Record<(typeof STROKES)[number], ShapeMotion>;
  for (const id of STROKES) motion[id] = createShapeMotion(id, RIBBONS[id], nextSeed);
  const breaths = {} as Record<keyof typeof BLOB_OF, Noise[]>;
  for (const id of Object.keys(BLOB_OF) as (keyof typeof BLOB_OF)[]) {
    breaths[id] = RIBBONS[id].joints.map(() => noise1(nextSeed()));
  }
  const tempo = noise1(nextSeed());
  const swell = noise1(nextSeed());
  const gradientDrift: Partial<Record<string, Noise>> = Object.fromEntries(
    GRADIENT_IDS.map((id) => [id, noise1(nextSeed())]),
  );

  const gradients = [...root.querySelectorAll<SVGLinearGradientElement>('[data-ribbon-gradient]')].flatMap((el) => {
    const drift = gradientDrift[el.id];
    const base = (['x1', 'y1', 'x2', 'y2'] as const).map((a) => parseFloat(el.getAttribute(a) ?? '0'));
    return drift ? [{ el, drift, base }] : [];
  });
  const button = root.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    t: 0, // seconds of motion so far
    tau: 0, // noise clock, in cells; its speed drifts with the tempo noise
    ramp: 0, // seconds of motion since it first woke (reset by reduced motion)
    rate: 1, // eased playback rate; first load starts at full speed while the amplitude eases in
    idle: false,
    userPaused: readPaused(),
    offscreen: true, // until the first IntersectionObserver entry says otherwise
    hidden: document.hidden,
    reduced: reduce.matches,
    artVisible: artLeft.clientWidth >= MIN_ART_PX,
    fit: { left: 1, right: 1 } as Record<Side, number>,
  };
  let raf = 0;
  let last = 0;
  let lastInput = performance.now();

  const measureFit = () => {
    for (const side of ['left', 'right'] as const) {
      const el = arts[side]!;
      const scale = Math.max(el.clientWidth / (side === 'left' ? 400 : 260), el.clientHeight / 640);
      state.fit[side] = scale > 0 ? Math.min(1, Math.sqrt(REFERENCE_PX_PER_UNIT / scale)) : 1;
    }
  };
  measureFit();

  function render() {
    const ease = smoothstep(state.ramp / EASE_IN_S);
    const swellNow = SWELL_CALM + (SWELL_LIVELY - SWELL_CALM) * smoothstep(0.5 + swell(state.t * SWELL_FREQ));
    const level = ease * swellNow;
    for (const { id, el, rig } of paths) {
      const gain = level * state.fit[rig.side];
      let pose: Pose = {};
      if (id in motion) {
        pose = shapePose(motion[id as keyof typeof motion], state.tau, gain);
      } else if (id in BLOB_OF) {
        const blob = id as keyof typeof BLOB_OF;
        pose = blobPose(motion[BLOB_OF[blob]], breaths[blob], state.tau, state.t, gain, ease * state.fit[rig.side]);
      }
      el.setAttribute('d', buildPath(rig, pose));
    }
    for (const g of gradients) {
      const share = ease * GRADIENT_SHIFT * g.drift(state.t * GRADIENT_FREQ);
      const [x1, y1, x2, y2] = g.base as [number, number, number, number];
      const dx = (x2 - x1) * share;
      const dy = (y2 - y1) * share;
      g.el.setAttribute('x1', String(round(x1 + dx)));
      g.el.setAttribute('y1', String(round(y1 + dy)));
      g.el.setAttribute('x2', String(round(x2 + dx)));
      g.el.setAttribute('y2', String(round(y2 + dy)));
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
    const step = dt * state.rate;
    state.t += step;
    state.ramp += step;
    state.tau += step * CLOCK_RATE * (1 + TEMPO_DRIFT * tempo(state.t * TEMPO_FREQ));
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
        state.ramp = 0; // ease 0: the exact designed art; motion eases back in if re-enabled
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
  ro.observe(arts.right);

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
