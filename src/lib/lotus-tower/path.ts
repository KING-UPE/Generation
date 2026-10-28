/**
 * The camera move, as a function of timeline time.
 *
 * Time here is the old footage's clock — the tower descent ran 0..19.95s and
 * every cue in TowerTimeline (edition cards, the park, the concert hand-off) is
 * written in those seconds. Keeping the clock means none of them had to move:
 * the scene replaces the footage, the timeline that drives it is unchanged.
 *
 * Each channel is interpolated with a monotone cubic (Fritsch–Carlson) rather
 * than Catmull-Rom. A plain spline overshoots between knots that are close in
 * value, and on a camera that reads as it dipping past a framing and climbing
 * back to it. Monotone keeps the velocity continuous — no stops at the knots —
 * and never travels past one.
 */

export const END_T = 19.8;

/** Columns: t, camera height, look-at height, distance from the tower axis,
 *  azimuth in degrees (0 = facing the stage), vertical field of view. */
const KNOTS: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  //  t     camY    lookY   dist   az     fov
  /* Down from the bud to the lettering — scrolled, and shaped as one ease:
     it leaves the bud from rest, is quickest through the balcony, and slows
     onto the lettering instead of arriving on it. */
  [0.0,   224,    244,    268,  -26,   24],
  [0.6,   222,    241,    266,  -25.5, 24],
  [1.6,   205,    220,    258,  -21,   24],
  [2.8,   170,    178,    253,  -15,   24],
  [3.8,   146,    148,    250,  -11,   24],
  [4.3,   140,    141,    250,  -10,   24],
  /* The editions: the camera holds on the lettering, drifting in a touch,
     while the tower turns each year round to face it. */
  [9.0,   135,    134,    245,  -10,   24],
  [14.4,  130,    129,    240,  -10,   24],
  /* Then down the one section to the arena. */
  [15.6,  117,    115,    242,   -9,   24],
  [16.4,   96,     94,    244,   -7,   24.4],
  [17.4,   60,     63,    240,   -4,   25.5],
  [18.4,   30,     44,    230,   -1,   27],
  [19.1,   16,     38,    218,    0,   28.5],
  [END_T,   7,     33,    204,    0,   30],
];

type Curve = (x: number) => number;

function monotone(xs: number[], ys: number[]): Curve {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const s = (x - xs[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * ys[i] +
      (s3 - 2 * s2 + s) * h * m[i] +
      (-2 * s3 + 3 * s2) * ys[i + 1] +
      (s3 - s2) * h * m[i + 1]
    );
  };
}

const ts = KNOTS.map((k) => k[0]);
const channel = (c: number) => monotone(ts, KNOTS.map((k) => k[c]));

const camY = channel(1);
const lookY = channel(2);
const dist = channel(3);
const azim = channel(4);
const fov = channel(5);

export type CameraPose = {
  x: number;
  y: number;
  z: number;
  lookY: number;
  fov: number;
  /** Azimuth in radians, for anything that wants to face the camera. */
  az: number;
};

export function cameraAt(t: number, out: CameraPose): CameraPose {
  const a = (azim(t) * Math.PI) / 180;
  const r = dist(t);
  out.x = Math.sin(a) * r;
  out.z = Math.cos(a) * r;
  out.y = camY(t);
  out.lookY = lookY(t);
  out.fov = fov(t);
  out.az = a;
  return out;
}

/**
 * When the tower turns: one quarter turn per edition after the first, centred
 * on that edition's card cue (TowerTimeline's 6.0 / 8.6 / 11.4), so the card
 * changes as the new face swings round. Each face enters from the left, as in
 * the footage.
 */
const TURNS = [6.0, 8.6, 11.4];
const TURN_SPAN = 2.0;

export function towerTurn(t: number) {
  let a = 0;
  for (const c of TURNS) {
    let k = (t - (c - TURN_SPAN / 2)) / TURN_SPAN;
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    a += k * k * k * (k * (k * 6 - 15) + 10);
  }
  return a * (Math.PI / 2);
}
