import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------------ */
/* Fluted shaft                                                              */
/* ------------------------------------------------------------------------ */

/**
 * One point of a cross-section, at unit radius.
 *
 * `rho` is the radius factor (1 on a face, less in a groove). `nx, nz` is the
 * outward normal in plan, and `radial` says whether that normal is the radial
 * direction (faces and groove floors) or tangential (groove walls) — the two
 * tilt differently when the shaft tapers, see `loft`.
 *
 * Corners are emitted twice, once per side, with each copy carrying its own
 * side's normal. That is what keeps the groove edges crisp: a shared vertex
 * would average the face and the wall into one rounded normal, and the flutes
 * would shade like a soft wave instead of cut stone.
 */
type ProfilePoint = {
  theta: number;
  rho: number;
  nx: number;
  nz: number;
  radial: boolean;
};

export function flutedProfile(
  faces: number,
  grooveFrac: number,
  depth: number,
  faceSegs = 6,
  /** Turns the whole section about the axis, radians. */
  phase = 0,
): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  const period = TAU / faces;
  const g = period * grooveFrac;
  const radialAt = (theta: number, rho: number): ProfilePoint => ({
    theta, rho, nx: Math.sin(theta), nz: Math.cos(theta), radial: true,
  });
  /* Tangential normals: +θ for the wall on the groove's near side (it faces
     into the groove, i.e. forwards round the shaft), -θ for the far one. */
  const wall = (theta: number, rho: number, sign: 1 | -1): ProfilePoint => ({
    theta, rho, nx: Math.cos(theta) * sign, nz: -Math.sin(theta) * sign, radial: false,
  });

  for (let k = 0; k < faces; k++) {
    const g0 = k * period + phase; // groove centre
    const a = g0 + g / 2; // face starts
    const b = g0 + period - g / 2; // face ends

    /* Face, as an arc. */
    for (let s = 0; s <= faceSegs; s++) {
      out.push(radialAt(a + ((b - a) * s) / faceSegs, 1));
    }
    /* Into the next groove: wall down, floor across, wall up. */
    const ge = g0 + period - g / 2;
    const gs = g0 + period + g / 2;
    out.push(wall(ge, 1, 1));
    out.push(wall(ge, 1 - depth, 1));
    out.push(radialAt(ge, 1 - depth));
    out.push(radialAt(gs, 1 - depth));
    out.push(wall(gs, 1 - depth, -1));
    out.push(wall(gs, 1, -1));
  }

  /* The first face starts half a groove past 0 and the last groove ends half a
     groove past 2π — the same point, so the ring closes on itself. */
  return out;
}

/** Clips a profile to [t0, t1], interpolating the ends. For skins that cover
 *  part of the shaft, like the projected lettering. */
export function clipProfile(profile: ProfilePoint[], t0: number, t1: number): ProfilePoint[] {
  const norm = (t: number) => ((t % TAU) + TAU) % TAU;
  /* Unroll so the range is contiguous even if it crosses 0. */
  const start = norm(t0);
  const span = t1 - t0;
  const unrolled: ProfilePoint[] = [];
  for (const lap of [0, TAU, 2 * TAU]) {
    for (const p of profile) unrolled.push({ ...p, theta: p.theta + lap });
  }
  const end = start + span;
  const out: ProfilePoint[] = [];
  for (let i = 0; i < unrolled.length; i++) {
    const p = unrolled[i];
    if (p.theta < start || p.theta > end) continue;
    if (!out.length && i > 0) {
      const q = unrolled[i - 1];
      if (q.theta < start) {
        const f = (start - q.theta) / Math.max(1e-6, p.theta - q.theta);
        out.push({ ...p, theta: start, rho: q.rho + (p.rho - q.rho) * f });
      }
    }
    out.push(p);
  }
  const last = out[out.length - 1];
  if (last && last.theta < end) out.push({ ...last, theta: end });
  return out;
}

export type Ring = { y: number; r: number };

/**
 * Sweeps a profile up a list of rings.
 *
 * `offset` pushes the surface out along the plan normal by a fixed distance,
 * so a skin can sit just proud of the shaft without scaling its grooves.
 * UVs: u runs round the shaft (`uSpan` across the whole circle), v is height
 * divided by `vScale` — world-locked, so a texture tiles at the same size on
 * every part of the tower whatever its radius.
 */
export function loft(
  profile: ProfilePoint[],
  rings: Ring[],
  opts: {
    offset?: number;
    uSpan?: number;
    vScale?: number;
    uFrom?: number;
    uTo?: number;
    /** Darken the grooves through vertex colour — the light a recess loses
     *  to its own walls, which is most of what makes a flute read as cut. */
    occlude?: boolean;
  } = {},
) {
  const offset = opts.offset ?? 0;
  const uSpan = opts.uSpan ?? 1;
  const vScale = opts.vScale ?? 1;
  const np = profile.length;
  const nr = rings.length;
  const pos = new Float32Array(np * nr * 3);
  const nor = new Float32Array(np * nr * 3);
  const uv = new Float32Array(np * nr * 2);
  const col = opts.occlude ? new Float32Array(np * nr * 3) : null;

  const k3 = (j: number, i: number) => (j * np + i) * 3;
  const t0 = profile[0].theta;
  const t1 = profile[np - 1].theta;

  for (let j = 0; j < nr; j++) {
    const { y, r } = rings[j];
    const prev = rings[Math.max(0, j - 1)];
    const next = rings[Math.min(nr - 1, j + 1)];
    const dr = next.y !== prev.y ? (next.r - prev.r) / (next.y - prev.y) : 0;
    for (let i = 0; i < np; i++) {
      const p = profile[i];
      const k = (j * np + i) * 3;
      const s = Math.sin(p.theta);
      const c = Math.cos(p.theta);
      const R = r * p.rho;
      pos[k] = R * s + p.nx * offset;
      pos[k + 1] = y;
      pos[k + 2] = R * c + p.nz * offset;
      /* Radial normals tilt up as the shaft narrows; tangential ones are
         perpendicular to the taper and do not. */
      const ny = p.radial ? -dr * p.rho : 0;
      const len = Math.hypot(p.nx, ny, p.nz) || 1;
      nor[k] = p.nx / len;
      nor[k + 1] = ny / len;
      nor[k + 2] = p.nz / len;
      const u =
        opts.uFrom !== undefined && opts.uTo !== undefined
          ? opts.uFrom + ((p.theta - t0) / (t1 - t0)) * (opts.uTo - opts.uFrom)
          : (p.theta / TAU) * uSpan;
      uv[(j * np + i) * 2] = u;
      uv[(j * np + i) * 2 + 1] = y / vScale;
      if (col) {
        const k = p.rho < 1 ? (p.radial ? 0.5 : 0.62) : p.radial ? 1 : 0.78;
        col[k3(j, i)] = col[k3(j, i) + 1] = col[k3(j, i) + 2] = k;
      }
    }
  }

  const idx: number[] = [];
  for (let j = 0; j < nr - 1; j++) {
    for (let i = 0; i < np - 1; i++) {
      const a = profile[i];
      const b = profile[i + 1];
      /* Two copies of one corner: zero-width quad, skip it. */
      if (a.theta === b.theta && a.rho === b.rho) continue;
      const v0 = j * np + i;
      const v1 = v0 + 1;
      const v2 = v0 + np;
      const v3 = v2 + 1;
      idx.push(v0, v1, v2, v1, v3, v2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

/* ------------------------------------------------------------------------ */
/* Petals                                                                    */
/* ------------------------------------------------------------------------ */

export type PetalSpec = {
  count: number;
  /** Angle of the first petal, radians. */
  offset: number;
  /** Heights of the petal's root and tip, metres. */
  y0: number;
  y1: number;
  /**
   * How far inside the bud's outline this tier lies. Each tier sits a little
   * within the one below, and more than its own bulge, so the petals overlap
   * cleanly — the lower one always in front — and never cut through.
   */
  inset: number;
  /** Half-width at the widest point, metres. */
  width: number;
  /** A little curvature across each half of the petal. */
  bulge: number;
  /** The fold down the spine: how far the ridge stands out from the edges. */
  crease?: number;
  /** Where along the length the petal is widest, 0..1. */
  belly?: number;
  /** How far the tip lifts off the bud, metres. */
  lean?: number;
  uSegs?: number;
  vSegs?: number;
};

/** Radius of the bud's surface at a height. */
export type Outline = (y: number) => number;

/**
 * Half-width along a petal: zero at the root, full by `belly`, then drawn in
 * to a sharp point. Above the belly the edge follows 1 - s^1.7, whose slope at
 * the tip is finite — the two edges meet at an angle, a true point, the way
 * the tower's petals end in a gothic arch. (A sine profile there, as before,
 * meets flat and reads as a rounded, cartoon tip.)
 */
function petalWidth(v: number, belly: number) {
  if (v <= belly) {
    const s = v / belly;
    return Math.pow(Math.sin((s * Math.PI) / 2), 0.55);
  }
  const s = (v - belly) / (1 - belly);
  return 1 - Math.pow(s, 1.7);
}

/**
 * A point on a petal laid on the bud. The petal is folded down its spine —
 * two near-flat halves meeting at a ridge, as the steel petals are built —
 * with only a little curvature across each half. Its edges (u = ±1) sit on
 * the outline itself, pressed to the bud; the tip lifts away by `lean`.
 */
function petalPoint(spec: PetalSpec, outline: Outline, theta: number, u: number, v: number) {
  const y = spec.y0 + (spec.y1 - spec.y0) * v;
  const R0 = Math.max(0.5, outline(y) - spec.inset);
  const w = spec.width * petalWidth(v, spec.belly ?? 0.45);
  const th = theta + (u * w) / R0;
  const au = Math.abs(u);
  const swell = Math.pow(Math.sin(Math.PI * Math.min(v, 0.999)), 0.5);
  const ridge = (spec.crease ?? 0) * (1 - au) * swell;
  const curve = spec.bulge * (1 - au * au) * swell;
  const k = Math.max(0, Math.min(1, (v - 0.6) / 0.4));
  const lean = (spec.lean ?? 0) * k * k;
  const R = R0 + ridge + curve + lean;
  return [Math.sin(th) * R, y, Math.cos(th) * R] as const;
}

/**
 * One petal, built as two halves that share no vertices along the spine, so
 * each half keeps its own normal and the fold reads as a crisp edge — the two
 * sides of the petal catch the light differently, as faceted glass does.
 */
function onePetal(spec: PetalSpec, outline: Outline, theta: number) {
  const us = spec.uSegs ?? 6;
  const vs = spec.vSegs ?? 24;
  const halves: THREE.BufferGeometry[] = [];
  for (const [ua, ub] of [[-1, 0], [0, 1]] as const) {
    const pos: number[] = [];
    const uv: number[] = [];
    for (let j = 0; j <= vs; j++) {
      const v = j / vs;
      for (let i = 0; i <= us; i++) {
        const u = ua + ((ub - ua) * i) / us;
        pos.push(...petalPoint(spec, outline, theta, u, v));
        uv.push((u + 1) / 2, v);
      }
    }
    const idx: number[] = [];
    for (let j = 0; j < vs; j++) {
      for (let i = 0; i < us; i++) {
        const a = j * (us + 1) + i;
        const b = a + 1;
        const c = a + us + 1;
        const d = c + 1;
        /* Wound so the outside of the petal is the front face. */
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    halves.push(g);
  }
  return mergeGeometries(halves)!;
}

/** Every petal of a tier, merged, with a per-petal random in `aSeed`. */
export function petalTier(spec: PetalSpec, outline: Outline, seed = 1) {
  const parts: THREE.BufferGeometry[] = [];
  const rand = mulberry(seed);
  for (let k = 0; k < spec.count; k++) {
    const theta = spec.offset + (k / spec.count) * TAU;
    const g = onePetal(spec, outline, theta);
    const n = g.attributes.position.count;
    const s = rand();
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(new Array(n).fill(s), 1));
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

/** The outline of every petal in a tier as a thin tube — its lit frame. */
export function petalRims(spec: PetalSpec, outline: Outline, radius: number) {
  const parts: THREE.BufferGeometry[] = [];
  const N = 18;
  for (let k = 0; k < spec.count; k++) {
    const theta = spec.offset + (k / spec.count) * TAU;
    const pts: THREE.Vector3[] = [];
    const at = (u: number, v: number) => new THREE.Vector3(...petalPoint(spec, outline, theta, u, v));
    for (let i = 0; i <= N; i++) pts.push(at(-1, 0.04 + (0.96 * i) / N));
    for (let i = N - 1; i >= 0; i--) pts.push(at(1, 0.04 + (0.96 * i) / N));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    parts.push(new THREE.TubeGeometry(curve, 48, radius, 4, false));
  }
  return mergeGeometries(parts)!;
}

/* ------------------------------------------------------------------------ */
/* Truss                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * A square box truss between two points, as the four chords and the zig-zag
 * lacing on each side — written into an instance list rather than built as
 * geometry, so every truss on the stage is one draw call between them.
 *
 * Each entry is a unit cylinder's transform: start, end, radius.
 */
export type Strut = { a: THREE.Vector3; b: THREE.Vector3; r: number };

export function boxTruss(a: THREE.Vector3, b: THREE.Vector3, size: number, out: Strut[], pitch = 1.2) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  dir.normalize();
  const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const s1 = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(size / 2);
  const s2 = new THREE.Vector3().crossVectors(dir, s1).normalize().multiplyScalar(size / 2);
  const corners = [
    s1.clone().add(s2),
    s1.clone().sub(s2),
    s1.clone().negate().sub(s2),
    s1.clone().negate().add(s2),
  ];
  const chordR = size * 0.045;
  const laceR = size * 0.022;
  for (const c of corners) {
    out.push({ a: a.clone().add(c), b: b.clone().add(c), r: chordR });
  }
  const steps = Math.max(1, Math.round(len / pitch));
  for (let i = 0; i < steps; i++) {
    const p0 = a.clone().addScaledVector(dir, (len * i) / steps);
    const p1 = a.clone().addScaledVector(dir, (len * (i + 1)) / steps);
    for (let f = 0; f < 4; f++) {
      const c0 = corners[f];
      const c1 = corners[(f + 1) % 4];
      /* Alternate the diagonal's direction per bay: a zig-zag, not a ramp. */
      const flip = (i + f) % 2 === 0;
      out.push({
        a: p0.clone().add(flip ? c0 : c1),
        b: p1.clone().add(flip ? c1 : c0),
        r: laceR,
      });
    }
  }
}

export function strutsToMesh(struts: Strut[], material: THREE.Material) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, material, struts.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const d = new THREE.Vector3();
  const s = new THREE.Vector3();
  struts.forEach((st, i) => {
    d.subVectors(st.b, st.a);
    const len = d.length();
    q.setFromUnitVectors(yAxis, d.normalize());
    s.set(st.r, len, st.r);
    m.compose(st.a, q, s);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/* ------------------------------------------------------------------------ */

/** Small seeded PRNG, so the lit windows and the crowd come out the same on
 *  every load instead of reshuffling each visit. */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lathe(points: Array<[number, number]>, segments = 64) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}
