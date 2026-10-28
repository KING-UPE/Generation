import * as THREE from "three";
import {
  clipProfile,
  flutedProfile,
  lathe,
  loft,
  mulberry,
  petalRims,
  petalTier,
  type PetalSpec,
  type Ring,
} from "./geometry";
import {
  COLLARS,
  HEAD,
  HEAD_LIFT,
  PANEL_ARC,
  PANEL_LEN,
  PANEL_YS,
  PROJECTION_ON,
  SHAFT,
  YEARS,
  budRadius,
  shaftRadius,
} from "./layout";
import { towerTurn } from "./path";
import { captionMaterial, petalMaterial, uplit, windowMaterial } from "./materials";
import { captionTexture, concreteTexture, panelTexture, tiled } from "./textures";

const DEG = Math.PI / 180;

/**
 * The faces are turned so one of them looks at -10°, the bearing the camera
 * holds while the tower turns. Each edition is projected square on a face a
 * quarter turn on from the last — in the opposite direction to the turn, so
 * the next year is always the one coming round from the left — and the groove
 * to the left of each carries a column of windows, as in the footage.
 */
const PHASE = -32.5 * DEG;
const TEXT_FACE = -10 * DEG;
const QUARTER = Math.PI / 2;

/**
 * Petal tiers, root to crown: eight to a tier, alternate tiers turned half a
 * petal, every one laid on the bud's outline (layout.ts) with its edges
 * pressed to it, tips included, so the bud keeps one smooth outline with
 * nothing standing outside it; its fullness through the middle is in the
 * outline itself. The upper tiers' tips curve in, rounding the crown off. Each tier sits further inside than the
 * last by more than a petal's ridge stands proud, so the lower petals always
 * lie over the upper ones, never cutting through.
 */
const TIERS: PetalSpec[] = [
  { count: 8, offset: 0, y0: 363.6, y1: 389, inset: 0, width: 8.6, crease: 0.7, bulge: 0.15, belly: 0.42, lean: 0 },
  { count: 8, offset: Math.PI / 8, y0: 366, y1: 401, inset: 1.0, width: 8.4, crease: 0.7, bulge: 0.15, belly: 0.44, lean: 0 },
  { count: 8, offset: 0, y0: 374, y1: 409, inset: 2.0, width: 7.2, crease: 0.6, bulge: 0.12, belly: 0.48, lean: -0.9 },
  { count: 8, offset: Math.PI / 8, y0: 382, y1: 414.5, inset: 3.0, width: 5.6, crease: 0.5, bulge: 0.1, belly: 0.52, lean: -1.2 },
];

/**
 * The cup's crown: a band of wide pointed teeth round its rim, one rising
 * between each pair of the lowest petals, the petals' roots coming down into
 * the valleys between them. One continuous surface rather than separate
 * leaves, so the teeth meet edge to edge and the zigzag runs unbroken.
 */
const CROWN_TEETH = 8;
const CROWN_BASE = 368.8;
const CROWN_RISE = 8.6;

/** Where the bud's crown now stands, against where the dome and spire were
 *  first placed (411): they are lifted by the difference. */
const BUD_TOP = 413.5;

export type Tower = {
  group: THREE.Group;
  update(t: number, time: number): void;
};

export function buildTower(family: string): Tower {
  const group = new THREE.Group();
  const rand = mulberry(26);

  /* ---------------------------------------------------------------- */
  /* Materials                                                         */
  /* ---------------------------------------------------------------- */

  const concreteMap = concreteTexture();
  const concrete = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: 0xa9afae,
    roughness: 0.93,
    metalness: 0,
  });
  /* Ledges and slabs read lighter than the shaft in the footage — they catch
     the floodlights square on instead of at a graze. */
  const slabConcrete = new THREE.MeshStandardMaterial({
    map: concreteMap,
    color: 0xd8d4cc,
    roughness: 0.9,
  });
  const blueMetal = new THREE.MeshStandardMaterial({
    color: 0x4c5a70,
    roughness: 0.38,
    metalness: 0.55,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x555a63,
    roughness: 0.5,
    metalness: 0.6,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0xb9bcc2,
    roughness: 0.35,
    metalness: 0.75,
  });
  /* Painted steel cladding, drawn once per finish and tiled per part. */
  const blueClad = panelTexture([118, 132, 156], 4, 6, 41);
  const darkClad = panelTexture([70, 74, 80], 3, 8, 42);
  const creamClad = panelTexture([236, 226, 204], 6, 3, 43);
  darkMetal.map = tiled(darkClad, 6, 1);
  const gold = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.1, 0.55) });
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 0.25, 0.15) });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.0, 2.6) });

  /* ---------------------------------------------------------------- */
  /* Shaft                                                             */
  /* ---------------------------------------------------------------- */

  const profile = flutedProfile(SHAFT.faces, SHAFT.grooveFrac, SHAFT.grooveDepth, 6, PHASE);

  const rings: Ring[] = [];
  for (const y of [0, 0.8, 2, 3.6, 5.6, 8, 11, 14.5, 18.5, 23, 28, 34]) rings.push({ y, r: shaftRadius(y) });
  for (let y = 46; y < SHAFT.top; y += 12) rings.push({ y, r: shaftRadius(y) });
  rings.push({ y: SHAFT.top + 1, r: shaftRadius(SHAFT.top + 1) });
  const shaftConcrete = concrete.clone();
  shaftConcrete.vertexColors = true;
  const shaft = new THREE.Mesh(loft(profile, rings, { uSpan: 3, vScale: 25.6, occlude: true }), shaftConcrete);
  group.add(shaft);

  /* Windows down the groove left of each lettered face. Each is a small lit
     pane set into the groove floor — a stair core, in the real thing. */
  {
    const paneGeo = new THREE.BoxGeometry(0.75, 1.55, 0.3);
    const spots: Array<{ y: number; theta: number }> = [];
    const blocked = (y: number) =>
      COLLARS.some(([a, b]) => y > a - 5.5 && y < b + 4.5) || y < 14;
    for (let side = 0; side < 4; side++) {
      const theta = PHASE - side * QUARTER;
      for (let y = 16; y < SHAFT.top - 3; y += 4.6) {
        if (!blocked(y)) spots.push({ y, theta });
      }
    }
    const panes = new THREE.InstancedMesh(paneGeo, new THREE.MeshBasicMaterial(), spots.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    spots.forEach(({ y, theta }, i) => {
      const r = shaftRadius(y) * (1 - SHAFT.grooveDepth) + 0.02;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), theta);
      m.compose(new THREE.Vector3(Math.sin(theta) * r, y, Math.cos(theta) * r), q, new THREE.Vector3(1, 1, 1));
      panes.setMatrixAt(i, m);
      const on = rand() < 0.78;
      const k = on ? 0.7 + rand() * 0.9 : 0.02;
      c.setRGB(1.0 * k, 0.72 * k, 0.45 * k);
      panes.setColorAt(i, c);
    });
    group.add(panes);
  }

  /* ---------------------------------------------------------------- */
  /* Collars                                                           */
  /* ---------------------------------------------------------------- */

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(3.6, 4.4);
  finShape.lineTo(0, 4.4);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.36, bevelEnabled: false });
  finGeo.translate(0, 0, -0.18);

  COLLARS.forEach(([b0, b1], ci) => {
    const rs0 = shaftRadius(b0 - 4.6);
    const rs1 = shaftRadius(b1 + 4.6);
    const under = lathe([
      [rs0 - 0.4, b0 - 4.8],
      [rs0 + 0.4, b0 - 3.6],
      [12.8, b0 - 1.6],
      [14.4, b0 - 0.5],
      [15.0, b0],
      [14.6, b0 + 0.1],
    ], 72);
    group.add(new THREE.Mesh(under, slabConcrete));

    const band = new THREE.CylinderGeometry(14.75, 14.75, b1 - b0, 72, 1, true);
    band.translate(0, (b0 + b1) / 2, 0);
    group.add(
      new THREE.Mesh(
        band,
        windowMaterial({
          bands: [{ y0: b0 + 1.2, y1: b1 - 1.0, gain: 1.1, rows: 1 }],
          mullions: 140,
          seed: 3 + ci,
          lit: 0.32,
        }),
      ),
    );

    const lip = lathe([
      [14.6, b1 - 0.05],
      [15.9, b1],
      [15.9, b1 + 0.75],
      [14.6, b1 + 0.95],
      [rs1 + 0.6, b1 + 3.4],
      [rs1 - 0.4, b1 + 4.8],
    ], 72);
    group.add(new THREE.Mesh(lip, slabConcrete));

    /* Corbels under the platform, one on every face of the shaft. */
    const fins = new THREE.InstancedMesh(finGeo, slabConcrete, SHAFT.faces * 2);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let k = 0; k < SHAFT.faces * 2; k++) {
      const theta = PHASE + (k * Math.PI) / SHAFT.faces + Math.PI / SHAFT.faces / 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), theta - Math.PI / 2);
      const r = rs0 - 0.2;
      m.compose(
        new THREE.Vector3(Math.sin(theta) * r, b0 - 4.5, Math.cos(theta) * r),
        q,
        new THREE.Vector3(1, 1, 1),
      );
      fins.setMatrixAt(k, m);
    }
    group.add(fins);
  });

  /* ---------------------------------------------------------------- */
  /* Projected lettering                                               */
  /* ---------------------------------------------------------------- */

  const captions: THREE.ShaderMaterial[] = [];
  const yearTex = YEARS.map((year) => captionTexture(year, family));
  for (const y of PANEL_YS) {
    const y0 = y - PANEL_LEN / 2;
    const y1 = y + PANEL_LEN / 2;
    const skinRings: Ring[] = [];
    for (let ry = y0; ry <= y1 + 0.01; ry += PANEL_LEN / 8) skinRings.push({ y: ry, r: shaftRadius(ry) });
    YEARS.forEach((_, i) => {
      const centre = TEXT_FACE - i * QUARTER;
      const part = clipProfile(profile, centre - PANEL_ARC, centre + PANEL_ARC);
      const geo = loft(part, skinRings, { offset: 0.05, uFrom: 0, uTo: 1, vScale: 1 });
      const proj = new THREE.Vector3(Math.sin(centre) * 230, y - 36, Math.cos(centre) * 230);
      const mat = captionMaterial(yearTex[i], y0, PANEL_LEN, proj);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 5;
      group.add(mesh);
      captions.push(mat);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Balcony, drum and neck under the bud                              */
  /* ---------------------------------------------------------------- */

  const head = new THREE.Group();
  head.position.y = HEAD_LIFT;
  group.add(head);

  /* The balcony's underside: a bowl the shaft runs straight up into, its
     curve catching the floodlights — the bright ring under the bud. */
  head.add(
    new THREE.Mesh(
      lathe([
        [shaftRadius(SHAFT.top) - 0.6, HEAD.base - 0.5],
        [12.6, HEAD.base + 2.5],
        [14.4, HEAD.base + 5.3],
        [15.4, HEAD.soffit - 1.2],
        [15.8, HEAD.soffit - 0.6],
        [15.8, HEAD.soffit],
        [15.3, HEAD.soffit],
      ], 96),
      slabConcrete,
    ),
  );
  {
    const g = new THREE.CylinderGeometry(15.3, 15.3, HEAD.balconyTop - HEAD.soffit, 96, 1, true);
    g.translate(0, (HEAD.soffit + HEAD.balconyTop) / 2, 0);
    head.add(
      new THREE.Mesh(
        g,
        windowMaterial({
          bands: [{ y0: HEAD.soffit + 1.4, y1: HEAD.balconyTop - 1.2, gain: 1.7, rows: 1 }],
          mullions: 120,
          seed: 9,
          lit: 0.3,
        }),
      ),
    );
  }
  head.add(
    new THREE.Mesh(
      lathe([[15.3, HEAD.balconyTop], [15.8, HEAD.balconyTop + 0.05], [15.8, HEAD.slab], [13.4, HEAD.slab]], 96),
      slabConcrete,
    ),
  );

  /* Railing round the slab edge: posts and two rails. */
  {
    const n = 150;
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 1.15, 0.07), steel, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      m.makeTranslation(Math.sin(a) * 15.6, HEAD.slab + 0.58, Math.cos(a) * 15.6);
      posts.setMatrixAt(i, m);
    }
    head.add(posts);
    for (const [h, tube] of [[1.15, 0.05], [0.6, 0.025]] as const) {
      const rail = new THREE.Mesh(new THREE.TorusGeometry(15.6, tube, 4, 160), steel);
      rail.rotation.x = Math.PI / 2;
      rail.position.y = HEAD.slab + h;
      head.add(rail);
    }
  }

  /* The glazed drum behind the railing. Mostly dark; its mullions stand proud
     and catch the bud's glow, which is the row of vertical light lines the
     footage shows here. */
  {
    const g = new THREE.CylinderGeometry(13.4, 13.4, HEAD.drumTop - HEAD.slab, 96, 1, true);
    g.translate(0, (HEAD.slab + HEAD.drumTop) / 2, 0);
    head.add(
      new THREE.Mesh(
        g,
        windowMaterial({
          bands: [{ y0: HEAD.slab + 0.3, y1: HEAD.drumTop - 0.3, gain: 0.14, rows: 3 }],
          mullions: 64,
          seed: 14,
          lit: 0.4,
          glass: 0x1c2533,
          sky: 0x3a4a66,
        }),
      ),
    );
    const n = 64;
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, HEAD.drumTop - HEAD.slab, 0.6), blueMetal, n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
      m.compose(
        new THREE.Vector3(Math.sin(a) * 13.6, (HEAD.slab + HEAD.drumTop) / 2, Math.cos(a) * 13.6),
        q,
        new THREE.Vector3(1, 1, 1),
      );
      fins.setMatrixAt(i, m);
    }
    head.add(fins);
  }
  head.add(
    new THREE.Mesh(
      lathe([
        [13.4, HEAD.drumTop],
        [14.2, HEAD.drumTop + 0.05],
        [14.2, HEAD.roof],
        [13.6, HEAD.roof],
      ], 96),
      darkMetal,
    ),
  );

  /* The dome and spire, lifted onto the bud's crown. */
  const crown = new THREE.Group();
  crown.position.y = BUD_TOP - 411;
  head.add(crown);

  /* The cup the bud sits in: it rises from the drum and flares out round the
     roots of the lowest petals, as on the tower, with pointed leaves standing
     up between them. Concrete, to match the shaft. */
  head.add(
    new THREE.Mesh(
      lathe([
        [10.4, HEAD.roof - 0.05],
        [10.9, HEAD.roof + 1.8],
        [11.8, HEAD.roof + 4.0],
        [13.1, HEAD.roof + 6.4],
        [14.5, HEAD.roof + 8.8],
        [15.4, HEAD.roof + 10.4],
        [15.0, HEAD.roof + 10.8],
        [13.6, HEAD.roof + 10.2],
      ], 96),
      slabConcrete,
    ),
  );
  {
    /* Columns land exactly on every peak and valley, so the points stay
       sharp; the rows run from the base up to that column's edge. */
    const perTooth = 12;
    const cols = CROWN_TEETH * perTooth;
    const rows = 8;
    const pos: number[] = [];
    const uv: number[] = [];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const theta = Math.PI / CROWN_TEETH + (i / cols) * Math.PI * 2;
        const f = (i % perTooth) / perTooth;
        /* 1 at a peak, 0 at a valley, sides bowed slightly out so each tooth
           reads as a broad leaf rather than a thin spike. */
        const tri = Math.pow(1 - Math.abs(f * 2 - 1), 1.25);
        const peak = 1 - tri;
        const top = CROWN_BASE + CROWN_RISE * peak;
        const y = CROWN_BASE + ((top - CROWN_BASE) * j) / rows;
        const r = budRadius(y) + 0.9;
        pos.push(Math.sin(theta) * r, y, Math.cos(theta) * r);
        uv.push((i / cols) * 6, (y - CROWN_BASE) / 25.6);
      }
    }
    const idx: number[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i;
        const b = a + 1;
        const c = a + cols + 1;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    head.add(new THREE.Mesh(g, slabConcrete));
  }

  /* ---------------------------------------------------------------- */
  /* Bud                                                               */
  /* ---------------------------------------------------------------- */

  /* The glazed core the petals close over — dark ruby glass and its floors,
     seen only in the gaps between the upper petals, as on the tower. */
  head.add(
    new THREE.Mesh(
      lathe([
        [8.6, 363.6],
        [9.8, 367.5],
        [11.4, 373],
        [12.8, 380],
        [13.8, 388],
        [14.2, 396],
        [14.0, 403],
        [13.0, 408],
        [11.6, 411.5],
        [10.0, 413.6],
      ], 64),
      windowMaterial({
        bands: [
          { y0: 389.5, y1: 395, gain: 0.7, rows: 2 },
          { y0: 397, y1: 402, gain: 0.8, rows: 2 },
          { y0: 404, y1: 408, gain: 0.7, rows: 1 },
        ],
        mullions: 110,
        seed: 21,
        lit: 0.6,
        glass: 0x12030a,
        sky: 0x3a0a20,
      }),
    ),
  );

  /* One glass material for every tier. The rod along each petal's edge
     wears the glass's own colour and glow, so the edge reads as the petal
     ending, not as an outline: lit pink it was a neon line, dark it was a
     black one, and both were taken out. */
  const glass = petalMaterial();
  const frame = new THREE.MeshStandardMaterial({
    color: 0x1e0410,
    roughness: 0.2,
    metalness: 0.15,
    emissive: new THREE.Color(0.9, 0.05, 0.36),
    emissiveIntensity: 0.26,
  });
  TIERS.forEach((spec, i) => {
    head.add(new THREE.Mesh(petalTier(spec, budRadius, 7 + i * 5), glass));
    head.add(new THREE.Mesh(petalRims(spec, budRadius, 0.17), frame));
  });

  /* The crown: a ring roof from inside the top tier in to the dome, low
     enough that the tips stand above it. */
  head.add(
    new THREE.Mesh(
      lathe([
        [budRadius(411) - 3.6, 410.8],
        [12.6, 411.9],
        [10.0, 412.3],
        [8.3, 412.2],
      ], 64),
      slabConcrete,
    ),
  );

  /* ---------------------------------------------------------------- */
  /* Dome and spire                                                    */
  /* ---------------------------------------------------------------- */

  crown.add(
    new THREE.Mesh(
      lathe([
        [7.4, 409.2],
        [8.5, 409.8],
        [8.4, 410.9],
        [7.7, 412.3],
        [6.3, 413.6],
        [4.2, 414.4],
        [2.6, 414.6],
      ], 64),
      new THREE.MeshStandardMaterial({
        map: tiled(blueClad, 10, 1.5),
        color: 0xc8d0dc,
        roughness: 0.32,
        metalness: 0.45,
        emissive: new THREE.Color(0.05, 0.06, 0.09),
      }),
    ),
  );
  /* A darker band where the dome meets the crown of petals. */
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8.45, 0.18, 6, 96), darkMetal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 409.9;
    crown.add(ring);
  }

  const cyl = (rTop: number, rBot: number, y0: number, y1: number, mat: THREE.Material, seg = 24) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, y1 - y0, seg);
    g.translate(0, (y0 + y1) / 2, 0);
    const mesh = new THREE.Mesh(g, mat);
    crown.add(mesh);
    return mesh;
  };

  /* Lower mast: equipment section, blue-grey, lit from the dome. */
  const mastLow = new THREE.MeshStandardMaterial({
    map: tiled(blueClad, 3, 4),
    color: 0xb0b8c4,
    roughness: 0.45,
    metalness: 0.5,
    emissive: new THREE.Color(0.12, 0.13, 0.16),
  });
  cyl(2.45, 2.75, HEAD.domeTop, HEAD.mastLowTop, uplit(mastLow, HEAD.domeTop, HEAD.mastLowTop, 1.4, 0.5));
  for (const y of [418.5, 423.5, 428.6]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.11, 6, 40), darkMetal);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    crown.add(band);
  }
  /* Panel antennas, clamped in a ring. */
  {
    const n = 12;
    const panels = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 2.8, 0.22), steel, n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      /* Two rings of six sector panels, the upper turned half a step. */
      const ring = i < 6 ? 0 : 1;
      const a = ((i % 6) / 6) * Math.PI * 2 + ring * (Math.PI / 6) + 0.2;
      const y = ring ? 426.2 : 420.4;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
      m.compose(new THREE.Vector3(Math.sin(a) * 3.0, y, Math.cos(a) * 3.0), q, new THREE.Vector3(1, 1, 1));
      panels.setMatrixAt(i, m);
    }
    crown.add(panels);
  }
  /* Microwave dishes on short arms. */
  {
    const dishGeo = new THREE.SphereGeometry(1.15, 20, 6, 0, Math.PI * 2, 0, 0.62);
    dishGeo.rotateX(-Math.PI / 2);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xd9dadc,
      roughness: 0.5,
      metalness: 0.2,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0.18, 0.18, 0.2),
    });
    for (const [deg, y] of [[38, 421.2], [-104, 424.8], [168, 417.6], [-30, 427.2]] as const) {
      const a = deg * DEG;
      const dish = new THREE.Mesh(dishGeo, dishMat);
      const r = 3.6;
      dish.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
      dish.lookAt(Math.sin(a) * 20, y - 1.5, Math.cos(a) * 20);
      crown.add(dish);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), steel);
      arm.position.set(Math.sin(a) * 2.95, y, Math.cos(a) * 2.95);
      arm.rotation.set(Math.PI / 2, 0, 0);
      arm.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), a);
      crown.add(arm);
    }
  }
  /* Small work lamps on the equipment section. */
  {
    const n = 10;
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), lamp, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const y = HEAD.domeTop + 1.5 + rand() * 14;
      m.makeTranslation(Math.sin(a) * 2.78, y, Math.cos(a) * 2.78);
      lamps.setMatrixAt(i, m);
    }
    crown.add(lamps);
  }

  /* Collars with lit gold rims, and the floodlit mast between them. */
  const collar = (y: number, r: number, h: number) => {
    cyl(r, r - 0.25, y - h / 2, y + h / 2, darkMetal, 48);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.17, 6, 64), gold);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y + h / 2 - 0.05;
    crown.add(rim);
    const under = new THREE.Mesh(new THREE.TorusGeometry(r - 0.4, 0.1, 6, 64), gold);
    under.rotation.x = Math.PI / 2;
    under.position.y = y - h / 2;
    crown.add(under);
  };
  collar(HEAD.bigCollar, 3.9, 1.3);
  collar(HEAD.upperCollar, 2.15, 0.8);

  const cream = (y0: number, y1: number) =>
    uplit(
      new THREE.MeshStandardMaterial({
        map: tiled(creamClad, 2, 5),
        emissiveMap: tiled(creamClad, 2, 5),
        roughness: 0.55,
        metalness: 0.15,
        emissive: new THREE.Color(0.95, 0.85, 0.66),
      }),
      y0,
      y1,
      0.62,
      0.2,
    );
  cyl(0.95, 1.1, HEAD.bigCollar + 0.65, HEAD.upperCollar - 0.4, cream(HEAD.bigCollar, HEAD.upperCollar), 20);
  cyl(0.62, 0.8, HEAD.upperCollar + 0.4, HEAD.mastTop, cream(HEAD.upperCollar, HEAD.mastTop), 16);
  cyl(0.72, 0.72, HEAD.mastTop, HEAD.mastTop + 0.45, darkMetal, 16);
  cyl(0.06, 0.24, HEAD.mastTop + 0.45, HEAD.tip, cream(HEAD.mastTop, HEAD.tip), 8);

  /* Aviation lights: red on the collars and the dome's rim, and a flasher at
     the tip — the first thing anyone notices about a tower at night. */
  {
    const spots: THREE.Vector3[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      spots.push(new THREE.Vector3(Math.sin(a) * 3.95, HEAD.bigCollar + 0.75, Math.cos(a) * 3.95));
      spots.push(new THREE.Vector3(Math.sin(a) * 2.2, HEAD.upperCollar + 0.45, Math.cos(a) * 2.2));
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      spots.push(new THREE.Vector3(Math.sin(a) * 8.0, 411.6, Math.cos(a) * 8.0));
    }
    const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 8, 6), red, spots.length);
    const m = new THREE.Matrix4();
    spots.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z);
      lights.setMatrixAt(i, m);
    });
    crown.add(lights);
  }
  const flasherMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 0.4, 0.25) });
  const flasher = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), flasherMat);
  flasher.position.y = HEAD.tip + 0.2;
  crown.add(flasher);

  /* ---------------------------------------------------------------- */
  /* Podium at the foot                                                */
  /* ---------------------------------------------------------------- */

  {
    const g = new THREE.CylinderGeometry(36, 37, 8.5, 120, 1, true);
    g.translate(0, 4.25, 0);
    group.add(
      new THREE.Mesh(
        g,
        windowMaterial({
          bands: [
            { y0: 0.9, y1: 3.6, gain: 0.55, rows: 1 },
            { y0: 4.6, y1: 7.6, gain: 0.45, rows: 1 },
          ],
          mullions: 160,
          seed: 31,
          lit: 0.45,
          glass: 0x07080b,
        }),
      ),
    );
    group.add(
      new THREE.Mesh(lathe([[37.6, 8.5], [37.6, 9.4], [shaftRadius(9.4) - 0.5, 9.4]], 120), slabConcrete),
    );
  }

  /* ---------------------------------------------------------------- */

  const flash = new THREE.Color();
  return {
    group,
    update(t, time) {
      /* The projection comes on with the first edition's card; every face
         is lit from then on, so each year is already there as it turns
         round. */
      const reveal = THREE.MathUtils.clamp((t - (PROJECTION_ON - 0.9)) / 1.25, 0, 1);
      for (const m of captions) {
        m.uniforms.uReveal.value = reveal;
        m.uniforms.uTime.value = time;
      }
      group.rotation.y = towerTurn(t);
      /* A short flash every 1.5s, with a soft tail. */
      const ph = (time % 1.5) / 1.5;
      const k = ph < 0.08 ? 1 : Math.max(0.04, Math.exp(-(ph - 0.08) * 18));
      flash.setRGB(9 * k, 0.4 * k, 0.25 * k);
      flasherMat.color.copy(flash);
    },
  };
}
