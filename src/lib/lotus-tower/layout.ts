/**
 * The tower's dimensions, in metres, y up, the shaft on the y axis.
 *
 * Measured off the footage rather than the real drawings: the bud was taken as
 * 48m across and everything else scaled from its width in the frames — spire
 * 48m above the bud, shaft about 0.45 of the bud's width.
 *
 * The shaft is one section: no ring platforms dividing it, just the bud's
 * balcony at the top, the four projected editions just below it, and plain
 * concrete down to a flared foot. Short enough that the camera's trip from the
 * lettering to the arena is a step down, not a fall.
 *
 * Azimuth convention throughout: a point at angle θ sits at (r·sinθ, y, r·cosθ),
 * so θ = 0 faces +z — the stage, and the camera at the end of the move.
 */

/** Height of the shaft, ground to balcony. */
const SHAFT_TOP = 175;

/**
 * Where the head (balcony, bud and spire) sits. Its own dimensions below are
 * written against a shaft top of 338, where they were first measured; the head
 * group is moved by this much to stand on the shaft as it is now.
 */
export const HEAD_LIFT = SHAFT_TOP - 338;

export const SHAFT = {
  /** Faces round the shaft, each split from the next by a narrow groove. */
  faces: 8,
  /** Groove width as a fraction of one face's angular period. */
  grooveFrac: 0.2,
  /** Groove depth as a fraction of radius. */
  grooveDepth: 0.1,
  top: SHAFT_TOP,
};

/** Shaft radius at height y. Slight taper over the length, then a flare into
 *  the ground that opens fastest at the very bottom, like a column's foot. */
export function shaftRadius(y: number) {
  const taper = 12.6 - (Math.min(y, SHAFT.top) / SHAFT.top) * 1.8;
  const foot = y < 34 ? Math.pow(1 - y / 34, 2.4) * 4.2 : 0;
  return taper + foot;
}

/** Ring platforms dividing the shaft, as [bottom of band, top of band].
 *  None: the shaft is one section. Kept as a list so one can be put back. */
export const COLLARS: ReadonlyArray<readonly [number, number]> = [];

/**
 * Projected lettering. Every shaft segment carries all four editions, one per
 * side, a quarter turn apart — the tower turns to bring each one round as its
 * card arrives (see `towerTurn` in path.ts), the way the footage turns it.
 * Listed in the order they come round.
 */
export const YEARS = ["23", "24", "25", "26"] as const;

/** Centre height of the lettering: just under the balcony, where the camera
 *  holds while the tower turns. The shaft below stays bare concrete. */
export const PANEL_YS = [SHAFT_TOP - 42] as const;

/** When the projection switches on: the 2023 card's cue, during the drop. */
export const PROJECTION_ON = 2.6;

/** Projected lettering block, in metres: along the shaft, and across it. */
export const PANEL_LEN = 62;
export const PANEL_ARC = 0.56; // radians either side of centre

/** Everything above the shaft, bottom up, in the head's own frame (shaft top
 *  at `base`) — the head group is raised by HEAD_LIFT. */
export const HEAD = {
  base: 338,
  soffit: 346.2,
  balconyTop: 351.6,
  slab: 352.3,
  drumTop: 358.5,
  roof: 359.2,
  neckTop: 364,
  budBase: 363.5,
  budTop: 409.5,
  domeTop: 414.5,
  mastLowTop: 431,
  bigCollar: 431.6,
  upperCollar: 447.6,
  mastTop: 455,
  tip: 462,
};

export const STAGE = {
  /** Centre of the deck's front edge distance from the axis. */
  z: 75,
  width: 40,
  depth: 16,
  deck: 1.8,
  roof: 15,
};

/**
 * The bud's outline: radius against height, in the head's frame.
 *
 * Taken from the tower itself rather than the footage — narrow where it leaves
 * the neck, swelling fast to its widest a little above the middle, and drawing
 * in only slightly toward a broad, flat crown. Every petal is laid on this surface,
 * each tier a little inside the one below it, so the bud reads as one closed
 * form with its petals pressed to it instead of a cup of loose leaves.
 */
const BUD: ReadonlyArray<readonly [number, number]> = [
  [363.5, 9.8],
  [367, 15.2],
  [371, 19.2],
  [376, 22.3],
  [382, 24.0],
  [388, 24.6],
  [394, 24.4],
  [399, 23.6],
  [404, 22.4],
  [408, 21.2],
  [411, 20.4],
];

export function budRadius(y: number) {
  const k = BUD;
  if (y <= k[0][0]) return k[0][1];
  if (y >= k[k.length - 1][0]) return k[k.length - 1][1];
  let i = 0;
  while (y > k[i + 1][0]) i++;
  /* Catmull-Rom through the table, so the outline has no corners. */
  const p0 = k[Math.max(0, i - 1)][1];
  const p1 = k[i][1];
  const p2 = k[i + 1][1];
  const p3 = k[Math.min(k.length - 1, i + 2)][1];
  const t = (y - k[i][0]) / (k[i + 1][0] - k[i][0]);
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
