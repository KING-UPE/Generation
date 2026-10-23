import * as THREE from "three";
import { boxTruss, mulberry, strutsToMesh, type Strut } from "./geometry";
import {
  beamMaterial,
  cityMaterial,
  crowdMaterial,
  groundMaterial,
  imagMaterial,
  ledMaterial,
} from "./materials";
import {
  ampStack,
  drumKit,
  guitarist,
  keys,
  micStand,
  performerMaterials,
  singer,
  wedge,
} from "./performers";
import { glowTexture, lowerThirdTexture, wordmarkTexture } from "./textures";

/**
 * The arena at the tower's foot, where the descent ends: the stage with its
 * truss, screens and moving heads, the tents along the sides, and the crowd
 * between the camera and all of it.
 *
 * Stage coordinates: the deck runs x -20..20 and z 60..76, its front edge
 * facing +z, which is where the camera finishes.
 */

const FRONT = 76;
const BACK = 60;
const ROOF = 15;

/** Moving heads: [x, y, z, base yaw (deg, + = right), base pitch (deg)]. */
const HEADS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [-16, ROOF - 0.6, FRONT, -52, 38],
  [-9.5, ROOF - 0.6, FRONT, -18, 62],
  [-3, ROOF - 0.6, FRONT, 22, 70],
  [3, ROOF - 0.6, FRONT, -22, 70],
  [9.5, ROOF - 0.6, FRONT, 18, 62],
  [16, ROOF - 0.6, FRONT, 52, 38],
  [-13, 2.3, FRONT - 0.6, -36, 50],
  [-4.5, 2.3, FRONT - 0.6, 8, 78],
  [4.5, 2.3, FRONT - 0.6, -8, 78],
  [13, 2.3, FRONT - 0.6, 36, 50],
];

export type Stage = {
  group: THREE.Group;
  update(t: number, time: number): void;
  /** Redraws the side screens' live feed. Call before the main render. */
  renderFeed(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void;
};

/** Where the singer stands on the deck. */
const SINGER = new THREE.Vector3(0.6, 1.8, 72.6);

export function buildStage(fonts: { display: string; text: string }): Stage {
  const group = new THREE.Group();
  const rand = mulberry(2026);

  /* ---------------------------------------------------------------- */
  /* Ground                                                            */
  /* ---------------------------------------------------------------- */

  const groundMat = groundMaterial();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), groundMat);
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  /* The city beyond the arena — low, dark, scattered with lit windows. It
     sits behind and to the sides of the tower, where the end of the move
     looks out over it. */
  {
    const n = 46;
    const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityMaterial(), n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const a = side * (0.5 + rand() * 1.9);
      const r = 300 + rand() * 650;
      const w = 18 + rand() * 34;
      const d = 18 + rand() * 30;
      const h = 12 + Math.pow(rand(), 2.2) * 95;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI);
      m.compose(
        new THREE.Vector3(Math.sin(a) * r, h / 2, -Math.abs(Math.cos(a)) * r * 0.6 - 60),
        q,
        new THREE.Vector3(w, h, d),
      );
      blocks.setMatrixAt(i, m);
    }
    group.add(blocks);
  }

  /* ---------------------------------------------------------------- */
  /* Structure                                                         */
  /* ---------------------------------------------------------------- */

  const trussMat = new THREE.MeshStandardMaterial({ color: 0xc7cbd2, roughness: 0.4, metalness: 0.8 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.7, metalness: 0.2 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(40, 1.8, FRONT - BACK), blackMat);
  deck.position.set(0, 0.9, (FRONT + BACK) / 2);
  group.add(deck);
  /* Lit edge of the deck — the strip of floor light along the front. */
  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.8, 2.2) }),
  );
  lip.position.set(0, 1.82, FRONT + 0.02);
  group.add(lip);

  const struts: Strut[] = [];
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  /* Roof grid. */
  boxTruss(v(-22, ROOF, FRONT + 1), v(22, ROOF, FRONT + 1), 0.76, struts);
  boxTruss(v(-22, ROOF, BACK - 1), v(22, ROOF, BACK - 1), 0.76, struts);
  for (const x of [-22, -11, 0, 11, 22]) boxTruss(v(x, ROOF, BACK - 1), v(x, ROOF, FRONT + 1), 0.76, struts);
  boxTruss(v(-22, ROOF, (FRONT + BACK) / 2), v(22, ROOF, (FRONT + BACK) / 2), 0.6, struts);
  /* Corner towers, running past the roof the way ground-support towers do. */
  for (const x of [-22, 22]) {
    for (const z of [BACK - 1, FRONT + 1]) boxTruss(v(x, 0, z), v(x, ROOF + 2.6, z), 0.76, struts);
  }
  /* Tall towers either side carrying the hang. */
  for (const x of [-25.5, 25.5]) boxTruss(v(x, 0, FRONT - 1), v(x, 21, FRONT - 1), 0.6, struts);
  /* Side-screen goalposts. */
  for (const side of [-1, 1]) {
    boxTruss(v(side * 32.5, 0, FRONT - 2), v(side * 32.5, 14, FRONT - 2), 0.5, struts);
    boxTruss(v(side * 43.5, 0, FRONT - 2), v(side * 43.5, 14, FRONT - 2), 0.5, struts);
    boxTruss(v(side * 32.5, 13.4, FRONT - 2), v(side * 43.5, 13.4, FRONT - 2), 0.5, struts);
  }
  group.add(strutsToMesh(struts, trussMat));

  /* Line arrays hanging off the towers: a J of boxes, curving out at the
     bottom to throw down into the crowd. */
  {
    const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.46, 1.0), blackMat, 16);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let k = 0;
    for (const x of [-24, 24]) {
      for (let i = 0; i < 8; i++) {
        const tilt = Math.pow(i / 7, 2) * 0.5;
        q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        m.compose(v(x, 17.5 - i * 0.48, FRONT + 0.5 + Math.pow(i / 7, 2) * 0.6), q, new THREE.Vector3(1, 1, 1));
        boxes.setMatrixAt(k++, m);
      }
    }
    group.add(boxes);
  }

  /* ---------------------------------------------------------------- */
  /* Screens                                                           */
  /* ---------------------------------------------------------------- */

  const wallMat = ledMaterial(0, 34 / 11, wordmarkTexture(fonts.display));
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(34, 11), wallMat);
  wall.position.set(0, 7.6, BACK + 0.6);
  group.add(wall);

  /* The side screens carry the live camera: a render of the singer from a
     camera on the stage lip, redrawn as the show plays. */
  const feed = new THREE.WebGLRenderTarget(384, 216, { type: THREE.HalfFloatType });
  const feedCam = new THREE.PerspectiveCamera(22, 16 / 9, 0.5, 400);
  feedCam.position.set(SINGER.x + 1.2, SINGER.y + 1.6, SINGER.z + 7.2);
  feedCam.lookAt(SINGER.x, SINGER.y + 1.2, SINGER.z);
  const lower = lowerThirdTexture(fonts.display, fonts.text);
  const sideMats: THREE.ShaderMaterial[] = [];
  const sideScreens: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const mat = imagMaterial(feed.texture, lower, 10 / 5.8);
    sideMats.push(mat);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.8), mat);
    s.position.set(side * 38, 9.3, FRONT - 1.6);
    s.rotation.y = -side * 0.1;
    group.add(s);
    sideScreens.push(s);
    const back = new THREE.Mesh(new THREE.BoxGeometry(10.4, 6.2, 0.3), blackMat);
    back.position.set(side * 38, 9.3, FRONT - 1.85);
    back.rotation.y = -side * 0.1;
    group.add(back);
  }

  /* ---------------------------------------------------------------- */
  /* Performers                                                        */
  /* ---------------------------------------------------------------- */

  let lead: THREE.Object3D | null = null;
  {
    const pm = performerMaterials();
    const on = (o: THREE.Object3D, x: number, z: number, ry = 0) => {
      o.position.set(x, 1.8, z);
      o.rotation.y = ry;
      group.add(o);
      return o;
    };
    lead = on(singer(pm), SINGER.x, SINGER.z, -0.1);
    on(guitarist(pm), -6.5, 70.5, 0.35);
    on(guitarist(pm, true), 7, 70, -0.3);
    on(drumKit(pm), 0, 65.2);
    on(keys(pm), 11.5, 66.5, -0.4);
    on(micStand(pm), -6.2, 71.6);
    on(micStand(pm), 6.6, 71.2);
    for (const x of [-7.5, -2.2, 2.6, 7.8]) on(wedge(pm), x, 75.1);
    for (const x of [-9.5, -8.6, 9.2, 10.1]) on(ampStack(pm), x, 63.2);
  }

  /* ---------------------------------------------------------------- */
  /* Tents                                                             */
  /* ---------------------------------------------------------------- */

  {
    const tentMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f2,
      roughness: 0.85,
      emissive: new THREE.Color(0.05, 0.055, 0.07),
    });
    const bodyGeo = new THREE.BoxGeometry(9, 2.6, 9);
    bodyGeo.translate(0, 1.3, 0);
    /* A pagoda roof: a pyramid with the eaves kicked out, which a plain cone
       cannot do — so the cone's lower ring is pushed out after the fact. */
    const roofGeo = new THREE.ConeGeometry(6.6, 4.2, 4, 3);
    const pos = roofGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const f = (2.1 - y) / 4.2; // 0 at the peak, 1 at the eave
      const k = 1 + 0.18 * Math.pow(f, 3) - 0.22 * Math.sin(f * Math.PI) * (1 - f);
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
    roofGeo.computeVertexNormals();
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.translate(0, 2.6 + 2.1, 0);
    for (const [x, z] of [[-66, 72], [-55, 74], [-80, 76], [55, 74], [66, 72], [80, 77]] as const) {
      const b = new THREE.Mesh(bodyGeo, tentMat);
      b.position.set(x, 0, z);
      group.add(b);
      const r = new THREE.Mesh(roofGeo, tentMat);
      r.position.set(x, 0, z);
      group.add(r);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Light                                                             */
  /* ---------------------------------------------------------------- */

  const glow = glowTexture();

  /* Moving-head beams, one instanced cone each. */
  const beamGeo = new THREE.CylinderGeometry(1, 0.012, 1, 28, 1, true);
  beamGeo.translate(0, 0.5, 0);
  const beamMat = beamMaterial(new THREE.Color(0.62, 0.72, 1.0));
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, HEADS.length);
  const gains = new Float32Array(HEADS.length);
  HEADS.forEach((_, i) => (gains[i] = 0.55 + rand() * 0.35));
  beams.geometry.setAttribute("aGain", new THREE.InstancedBufferAttribute(gains, 1));
  beams.frustumCulled = false;
  group.add(beams);

  /* Every lamp as a soft point — the beam sources, the PAR cans along the
     front truss, and the blinders on the tall towers. */
  const lampPos: number[] = [];
  const lampCol: number[] = [];
  const addLamp = (x: number, y: number, z: number, r: number, g: number, b: number) => {
    lampPos.push(x, y, z);
    lampCol.push(r, g, b);
  };
  for (const [x, y, z] of HEADS) addLamp(x, y, z, 4, 4.4, 5.5);
  for (let i = 0; i < 18; i++) {
    const x = -20 + (40 * i) / 17;
    const warm = i % 3 === 1;
    addLamp(x, ROOF - 0.9, FRONT + 1.1, warm ? 3.2 : 1.4, warm ? 2.4 : 1.9, warm ? 1.4 : 3.6);
  }
  for (const x of [-25.5, 25.5]) addLamp(x, 20.2, FRONT - 0.2, 6, 5.4, 4.2);
  for (const x of [-22, 22]) addLamp(x, ROOF + 2.2, FRONT + 1.2, 5, 4.6, 3.8);
  const lampGeo = new THREE.BufferGeometry();
  lampGeo.setAttribute("position", new THREE.Float32BufferAttribute(lampPos, 3));
  lampGeo.setAttribute("color", new THREE.Float32BufferAttribute(lampCol, 3));
  const lampMat = new THREE.PointsMaterial({
    size: 2.6,
    map: glow,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const lamps = new THREE.Points(lampGeo, lampMat);
  group.add(lamps);

  /* Haze lit from inside the stage — what makes the beams look like they are
     passing through air. */
  const hazeMat = new THREE.SpriteMaterial({
    map: glow,
    color: new THREE.Color(0.22, 0.3, 0.6),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Sprite(hazeMat);
  haze.scale.set(90, 46, 1);
  haze.position.set(0, 9, 64);
  group.add(haze);

  const keyL = new THREE.PointLight(0xaec4ff, 900, 150, 1.6);
  keyL.position.set(-14, 13, 84);
  const keyR = new THREE.PointLight(0xaec4ff, 900, 150, 1.6);
  keyR.position.set(14, 13, 84);
  group.add(keyL, keyR);

  /* ---------------------------------------------------------------- */
  /* Crowd                                                             */
  /* ---------------------------------------------------------------- */

  const people: number[] = [];
  for (let z = 86; z < 190; z += 1.15) {
    const half = 24 + (z - 86) * 0.38;
    for (let x = -half; x < half; x += 1.0) {
      /* Thinner toward the edges and the back, as crowds are. */
      const edge = Math.abs(x) / half;
      if (rand() < edge * edge * 0.7 + (z - 86) / 400) continue;
      people.push(
        x + (rand() - 0.5) * 0.55,
        z + (rand() - 0.5) * 0.5,
        1.56 + rand() * 0.3,
        rand(),
      );
    }
  }
  const crowdGeo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1);
  quad.translate(0, 0.5, 0);
  crowdGeo.index = quad.index;
  crowdGeo.setAttribute("position", quad.attributes.position);
  crowdGeo.setAttribute("aPerson", new THREE.InstancedBufferAttribute(new Float32Array(people), 4));
  crowdGeo.instanceCount = people.length / 4;
  const crowdMat = crowdMaterial(new THREE.Vector3(0, 8, 70));
  const crowd = new THREE.Mesh(crowdGeo, crowdMat);
  crowd.frustumCulled = false;
  group.add(crowd);

  /* ---------------------------------------------------------------- */

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const at = new THREE.Vector3();

  let feedFrame = 0;
  let feedLive = false;

  return {
    group,
    renderFeed(renderer, scene) {
      if (!feedLive) return;
      /* Every other frame is plenty for a screen across an arena. */
      if (feedFrame++ % 2) return;
      for (const sc of sideScreens) sc.visible = false;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(feed);
      renderer.render(scene, feedCam);
      renderer.setRenderTarget(prev);
      for (const sc of sideScreens) sc.visible = true;
    },
    update(t, time) {
      /* The show is on before the camera gets there, but the light that
         reaches the sky comes up as the stage enters the frame, so the
         beams sweep in rather than appearing. */
      const show = THREE.MathUtils.smoothstep(t, 16.8, 18.6);
      /* Nothing down here is in frame above the lower segment. */
      group.visible = t > 14.5;
      crowd.visible = t > 17.4;
      beams.visible = show > 0;
      if (!group.visible) return;

      HEADS.forEach(([x, y, z, yaw, pitch], i) => {
        const ph = i * 1.7;
        const a = ((yaw + 16 * Math.sin(time * 0.42 + ph)) * Math.PI) / 180;
        const p = ((pitch + 12 * Math.sin(time * 0.57 + ph * 1.3)) * Math.PI) / 180;
        dir.set(Math.sin(a) * Math.cos(p), Math.sin(p), Math.cos(a) * Math.cos(p) * 0.55 + 0.25).normalize();
        q.setFromUnitVectors(up, dir);
        const len = 190;
        scale.set(len * 0.045, len, len * 0.045);
        at.set(x, y, z);
        m.compose(at, q, scale);
        beams.setMatrixAt(i, m);
      });
      beams.instanceMatrix.needsUpdate = true;
      beamMat.uniforms.uGain.value = 0.32 * show;

      wallMat.uniforms.uTime.value = time;
      feedLive = group.visible && t > 16.6;
      for (const s of sideMats) s.uniforms.uGain.value = 0.4 + 0.6 * show;
      /* The singer is never quite still: turning to one side of the crowd
         and back, weight shifting with it. */
      if (lead) {
        lead.rotation.y = -0.1 + 0.28 * Math.sin(time * 0.55);
        lead.position.x = SINGER.x + 0.18 * Math.sin(time * 0.55 + 0.6);
      }
      crowdMat.uniforms.uTime.value = time;
      groundMat.uniforms.uStageGain.value = 0.35 + 0.65 * show;
      hazeMat.opacity = 0.35 + 0.65 * show;
      lampMat.opacity = 0.5 + 0.5 * show;
    },
  };
}
