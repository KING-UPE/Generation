import * as THREE from "three";

/**
 * The band, and the furniture of a working stage.
 *
 * Built from primitives but posed as people: hips, a spine, shoulders that
 * carry arms bent at the elbow, weight on one leg. At the distance the main
 * camera sees them that is what reads — silhouette and gesture — and the side
 * screens carry a live close-up of the singer, which is where the rest of the
 * detail shows.
 *
 * Units are metres; everything stands on y = 0 and the caller places it on
 * the deck.
 */

type Mats = {
  skin: THREE.Material;
  dark: THREE.Material;
  white: THREE.Material;
  denim: THREE.Material;
  metal: THREE.Material;
  brass: THREE.Material;
  shell: THREE.Material;
  head: THREE.Material;
  gloss: THREE.Material;
};

export function performerMaterials(): Mats {
  return {
    skin: new THREE.MeshStandardMaterial({ color: 0x8a5a43, roughness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.75 }),
    white: new THREE.MeshStandardMaterial({ color: 0xd9d9de, roughness: 0.7 }),
    denim: new THREE.MeshStandardMaterial({ color: 0x1f2a3d, roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.9 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc89b45, roughness: 0.28, metalness: 1 }),
    shell: new THREE.MeshStandardMaterial({ color: 0x5a0f18, roughness: 0.25, metalness: 0.3 }),
    head: new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.5 }),
    gloss: new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.2, metalness: 0.2 }),
  };
}

const capsule = (r: number, len: number, mat: THREE.Material) => {
  const g = new THREE.CapsuleGeometry(r, len, 3, 8);
  g.translate(0, -len / 2 - r, 0); // hangs from its joint
  return new THREE.Mesh(g, mat);
};

/** A limb: a joint you rotate, carrying the upper segment, carrying the lower. */
function limb(
  r: number,
  upper: number,
  lower: number,
  mat: THREE.Material,
  bend: [number, number, number],
  fold: [number, number, number],
) {
  const joint = new THREE.Group();
  joint.add(capsule(r, upper, mat));
  const elbow = new THREE.Group();
  elbow.position.y = -upper - r * 1.4;
  elbow.add(capsule(r * 0.9, lower, mat));
  joint.add(elbow);
  joint.rotation.set(...bend);
  elbow.rotation.set(...fold);
  return { joint, elbow, end: -lower - r * 2 };
}

type Pose = {
  outfit: THREE.Material;
  legs: THREE.Material;
  /** Shoulder rotations [x, y, z] and elbow folds, left then right. */
  armL: [[number, number, number], [number, number, number]];
  armR: [[number, number, number], [number, number, number]];
  lean?: number;
  seated?: boolean;
};

function figure(m: Mats, pose: Pose) {
  const body = new THREE.Group();
  const hip = pose.seated ? 0.55 : 0.95;

  /* Legs: weight on the left, the right a touch forward and out. */
  for (const side of [-1, 1]) {
    const leg = limb(
      0.075,
      0.42,
      0.4,
      pose.legs,
      pose.seated ? [-1.45, 0, side * 0.12] : [side > 0 ? -0.12 : 0.04, 0, side * 0.06],
      pose.seated ? [1.5, 0, 0] : [side > 0 ? 0.16 : 0, 0, 0],
    );
    leg.joint.position.set(side * 0.1, hip, 0);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.26), m.dark);
    shoe.position.set(0, leg.end + 0.02, 0.06);
    leg.elbow.add(shoe);
    body.add(leg.joint);
  }

  const spine = new THREE.Group();
  spine.position.y = hip;
  spine.rotation.x = pose.lean ?? 0.04;
  body.add(spine);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 4, 10), pose.outfit);
  torso.scale.set(1.12, 1, 0.72);
  torso.position.y = 0.32;
  spine.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 8), m.skin);
  neck.position.y = 0.66;
  spine.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), m.skin);
  head.scale.set(0.9, 1.08, 0.98);
  head.position.y = 0.8;
  spine.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), m.dark);
  hair.position.y = 0.815;
  hair.rotation.x = -0.25;
  spine.add(hair);

  const arms: THREE.Group[] = [];
  for (const [side, [bend, fold]] of [[-1, pose.armL], [1, pose.armR]] as const) {
    const arm = limb(0.045, 0.27, 0.25, pose.outfit, bend, fold);
    arm.joint.position.set(side * 0.2, 0.56, 0);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m.skin);
    hand.position.y = arm.end;
    arm.elbow.add(hand);
    spine.add(arm.joint);
    arms.push(arm.elbow);
  }
  return { body, spine, head, hands: arms };
}

/** The singer, in white: mic up to the mouth in the right hand, the left
 *  arm out to the crowd. */
export function singer(m: Mats) {
  const f = figure(m, {
    outfit: m.white,
    legs: m.white,
    armL: [[-0.5, 0, -0.9], [-0.35, 0, 0]],
    armR: [[-0.35, 0, 0.35], [-2.0, 0, 0]],
    lean: -0.05,
  });
  const mic = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.17, 8), m.dark);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), m.metal);
  ball.position.y = 0.1;
  mic.add(grip, ball);
  mic.position.set(0, -0.3, 0.02);
  mic.rotation.x = 0.6;
  f.hands[1].add(mic);
  return f.body;
}

/** A guitarist: guitar slung across the body, fretting hand up the neck. */
export function guitarist(m: Mats, bass = false) {
  const f = figure(m, {
    outfit: m.dark,
    legs: m.denim,
    armL: [[-0.9, 0.5, -0.25], [-1.3, 0, 0]],
    armR: [[-0.4, -0.2, 0.15], [-1.0, 0, 0]],
    lean: 0.1,
  });
  const guitar = new THREE.Group();
  const lower = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), bass ? m.gloss : m.shell);
  lower.scale.set(0.2, 0.22, 0.05);
  const upper = lower.clone();
  upper.scale.set(0.15, 0.15, 0.05);
  upper.position.y = 0.2;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, bass ? 0.8 : 0.62, 0.025), m.dark);
  neck.position.y = bass ? 0.68 : 0.58;
  const headstock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.025), m.dark);
  headstock.position.y = neck.position.y + (bass ? 0.46 : 0.38);
  guitar.add(lower, upper, neck, headstock);
  guitar.position.set(-0.02, 0.18, 0.17);
  guitar.rotation.set(0.1, 0, 1.05);
  f.spine.add(guitar);
  return f.body;
}

/** The drummer behind the kit, seated, sticks down on the snare. */
export function drumKit(m: Mats) {
  const kit = new THREE.Group();
  const drummer = figure(m, {
    outfit: m.dark,
    legs: m.denim,
    armL: [[-0.9, 0, -0.3], [-0.9, 0, 0]],
    armR: [[-1.0, 0, 0.3], [-0.8, 0, 0]],
    seated: true,
    lean: 0.15,
  });
  drummer.body.position.z = -0.55;
  kit.add(drummer.body);
  for (const h of drummer.hands) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 5), m.head);
    stick.position.set(0, -0.06, 0.15);
    stick.rotation.x = 1.2;
    h.add(stick);
  }
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12), m.dark);
  stool.position.set(0, 0.25, -0.6);
  kit.add(stool);

  const drum = (r: number, h: number, x: number, y: number, z: number, rx = 0) => {
    const g = new THREE.Group();
    const shellMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), m.shell);
    const top = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 20), m.head);
    top.rotation.x = -Math.PI / 2;
    top.position.y = h / 2 + 0.002;
    g.add(shellMesh, top);
    g.position.set(x, y, z);
    g.rotation.x = rx;
    kit.add(g);
  };
  /* Kick on its side facing the crowd, snare, two rack toms, floor tom. */
  drum(0.3, 0.42, 0, 0.3, 0.15, Math.PI / 2);
  drum(0.18, 0.14, -0.35, 0.66, -0.1, 0.15);
  drum(0.15, 0.18, -0.16, 0.88, 0.18, 0.4);
  drum(0.16, 0.2, 0.18, 0.88, 0.18, 0.4);
  drum(0.21, 0.42, 0.5, 0.42, -0.15);

  const cymbal = (r: number, x: number, y: number, z: number, tilt: number) => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, y, 6), m.metal);
    stand.position.set(x, y / 2, z);
    kit.add(stand);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.2, 0.012, 24), m.brass);
    disc.position.set(x, y, z);
    disc.rotation.z = tilt;
    kit.add(disc);
  };
  cymbal(0.18, -0.65, 0.95, -0.05, 0);
  cymbal(0.22, -0.55, 1.35, 0.3, 0.3);
  cymbal(0.26, 0.62, 1.4, 0.25, -0.3);

  const riser = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 2.6), m.dark);
  riser.position.set(0, -0.25, -0.2);
  kit.add(riser);
  kit.children.forEach((c) => (c.position.y += 0.5));
  return kit;
}

/** Keyboard on an X-stand. */
export function keys(m: Mats) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.36), m.gloss);
  board.position.y = 0.95;
  const keysTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.012, 0.16), m.head);
  keysTop.position.set(0, 0.995, 0.08);
  g.add(board, keysTop);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 0.04), m.metal);
    leg.position.set(0, 0.47, 0);
    leg.rotation.z = s * 0.75;
    g.add(leg);
  }
  return g;
}

/** A floor wedge monitor, angled back up at the performer. */
export function wedge(m: Mats) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.62, 0);
  shape.lineTo(0.5, 0.34);
  shape.lineTo(0, 0.42);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: false });
  g.translate(-0.31, 0, -0.35);
  g.rotateY(Math.PI / 2);
  return new THREE.Mesh(g, m.gloss);
}

/** Amp stack: a head on a 4x12 cab, grille cloth front. */
export function ampStack(m: Mats) {
  const g = new THREE.Group();
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.36), m.dark);
  cab.position.y = 0.38;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.26, 0.3), m.gloss);
  head.position.y = 0.9;
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.68), m.denim);
  grille.position.set(0, 0.38, 0.181);
  g.add(cab, head, grille);
  return g;
}

/** A boom mic stand. */
export function micStand(m: Mats) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 6), m.gloss);
  pole.position.y = 0.7;
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), m.gloss);
  boom.position.set(0, 1.42, 0.2);
  boom.rotation.x = 1.0;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), m.gloss);
  base.position.y = 0.01;
  g.add(pole, boom, base);
  return g;
}
