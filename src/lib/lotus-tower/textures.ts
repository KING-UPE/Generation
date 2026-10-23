import * as THREE from "three";
import { mulberry } from "./geometry";

/**
 * Everything the scene textures itself with is drawn here at load time, so
 * there is nothing to download: a few canvases' worth of CPU, once.
 */

/** Tileable value noise on a `freq` x `freq` lattice, sampled at (x, y) in 0..1. */
function makeNoise(freq: number, rand: () => number) {
  const g = new Float32Array(freq * freq);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  const at = (ix: number, iy: number) =>
    g[((iy % freq) + freq) % freq * freq + (((ix % freq) + freq) % freq)];
  return (x: number, y: number) => {
    const fx = x * freq;
    const fy = y * freq;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    let tx = fx - ix;
    let ty = fy - iy;
    tx = tx * tx * (3 - 2 * tx);
    ty = ty * ty * (3 - 2 * ty);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

/**
 * Cast concrete, one tile = 25.6m square.
 *
 * What makes concrete read as concrete at this distance is not the grain, it
 * is the construction: the horizontal lift joints every pour (3.2m here), the
 * staggered vertical board joints, the tie holes, and rain streaking down from
 * every ledge. The noise underneath only stops the faces looking printed.
 */
export function concreteTexture() {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const rand = mulberry(11);
  const n1 = makeNoise(6, rand);
  const n2 = makeNoise(18, rand);
  const n3 = makeNoise(64, rand);
  const streak = makeNoise(96, rand);
  const streakLen = makeNoise(8, rand);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const v = y / S;
      let k = 0.5 * n1(u, v) + 0.3 * n2(u, v) + 0.2 * n3(u, v);
      k = 0.86 + (k - 0.5) * 0.28;

      /* Rain streaks: thin in x, long in y, only where the slow mask allows. */
      const s = streak(u, v * 0.06);
      const mask = Math.max(0, streakLen(u, v) - 0.45) * 2.2;
      k -= Math.max(0, s - 0.62) * 0.55 * mask;

      /* Lift joints every 64px, with the slightly lighter laitance band that
         sits under each one. */
      const jy = y % 64;
      if (jy === 0 || jy === 1) k *= 0.72;
      else if (jy === 2 || jy === 3) k *= 1.05;

      /* Board joints, staggered by half a board on alternate lifts. */
      const lift = Math.floor(y / 64);
      const jx = (x + (lift % 2) * 64) % 128;
      if (jx === 0) k *= 0.88;

      /* Tie holes, a grid of small dark dots. */
      const tx = (x + (lift % 2) * 32) % 64;
      const ty = jy - 32;
      if (Math.abs(tx - 32) <= 1 && Math.abs(ty) <= 1) k *= 0.55;

      const i = (y * S + x) * 4;
      img.data[i] = Math.min(255, k * 158);
      img.data[i + 1] = Math.min(255, k * 157);
      img.data[i + 2] = Math.min(255, k * 149);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Clad metal: painted steel panels, one tile = `rows` x `cols` panels.
 *
 * The concrete taught the lesson: construction is what reads at a distance.
 * So this is seams before it is surface — a dark joint and a lit lip on every
 * panel edge, a bolt line along each horizontal seam, panels never quite the
 * same shade as their neighbours, and weather running down from each joint.
 */
export function panelTexture(base: [number, number, number], rows: number, cols: number, seed: number) {
  /* 256 is plenty: these clad parts are a few metres across on screen. */
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const rand = mulberry(seed);
  const n1 = makeNoise(5, rand);
  const n2 = makeNoise(40, rand);
  const streak = makeNoise(128, rand);
  const ph = S / rows;
  const pw = S / cols;
  const shade: number[] = [];
  for (let i = 0; i < rows * cols * 2; i++) shade.push(0.93 + rand() * 0.14);

  for (let y = 0; y < S; y++) {
    const row = Math.floor(y / ph);
    const fy = y - row * ph;
    const off = (row % 2) * (pw / 2);
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const v = y / S;
      const col = Math.floor(((x + off) % S) / pw);
      const fx = (x + off) % pw;
      let k = shade[(row * cols + col) % shade.length];
      k *= 0.94 + 0.06 * n1(u, v) + 0.05 * (n2(u, v) - 0.5);
      /* Weather: streaks running down from the seam above. */
      k -= Math.max(0, streak(u, v * 0.05) - 0.6) * 0.5 * Math.max(0, 1 - fy / (ph * 0.9));
      /* Joints, with the lit lip of the panel below each horizontal one. */
      if (fy < 1) k *= 0.55;
      else if (fy < 2) k *= 1.08;
      if (fx < 1) k *= 0.62;
      /* Bolts along the horizontal seam. */
      if (fy > 2 && fy < 3.5 && fx % 8 < 1.2) k *= 1.12;
      const i = (y * S + x) * 4;
      img.data[i] = Math.min(255, base[0] * k);
      img.data[i + 1] = Math.min(255, base[1] * k);
      img.data[i + 2] = Math.min(255, base[2] * k);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The same texture at a different tiling, sharing its pixels. */
export function tiled(tex: THREE.Texture, x: number, y: number) {
  const t = tex.clone();
  t.repeat.set(x, y);
  t.needsUpdate = true;
  return t;
}

/** Height of the lettering texture, against its 2048px length. Matches the
 *  panel's own proportion on the shaft so the glyphs are not stretched. */
const TEXT_H = 352;

/**
 * One projected caption, "GENERATION 23" and its corner brackets.
 *
 * The two are drawn into separate channels — text in red, brackets in green —
 * so the shader can bring them up at different moments: the frame lands first,
 * then the words wipe in along it, the way a projection is lined up and then
 * switched on.
 */
export function captionTexture(year: string, family: string) {
  const W = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = TEXT_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, TEXT_H);
  ctx.globalCompositeOperation = "lighter";

  const label = `GENERATION ${year}`;
  ctx.font = `800 196px ${family}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "10px";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const width = Math.min(W - 260, ctx.measureText(label).width);
  ctx.fillStyle = "rgb(255,0,0)";
  ctx.fillText(label, W / 2, TEXT_H / 2 + 6, W - 260);

  /* Viewfinder corners, hugging the text along its length and standing off it
     across, as in the footage. */
  const x0 = W / 2 - width / 2 - 70;
  const x1 = W / 2 + width / 2 + 70;
  const y0 = 46;
  const y1 = TEXT_H - 46;
  const arm = 64;
  const th = 9;
  ctx.fillStyle = "rgb(0,255,0)";
  for (const [x, dx] of [[x0, 1], [x1, -1]] as const) {
    for (const [y, dy] of [[y0, 1], [y1, -1]] as const) {
      ctx.fillRect(dx > 0 ? x : x - arm, dy > 0 ? y : y - th, arm, th);
      ctx.fillRect(dx > 0 ? x : x - th, dy > 0 ? y : y - arm, th, arm);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** Soft round sprite for light sources, so bloom has a shape to grow from. */
export function glowTexture() {
  const S = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.85)");
  g.addColorStop(0.45, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(canvas);
}

/** The event wordmark for the stage's back wall: GENERATION in white, the
 *  year in the brand red, on transparent. */
export function wordmarkTexture(family: string) {
  const W = 1024;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "middle";
  ctx.font = `400 190px ${family}`;
  const word = "GENERATION";
  const year = "26";
  const gap = 34;
  const ww = ctx.measureText(word).width;
  const yw = ctx.measureText(year).width;
  const x0 = (W - (ww + gap + yw)) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(word, x0, H / 2 + 8);
  ctx.fillStyle = "#ff3b2e";
  ctx.fillText(year, x0 + ww + gap, H / 2 + 8);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The side screens' lower-third caption: a red tab, the event name, and a
 *  live tag. */
export function lowerThirdTexture(display: string, text: string) {
  const W = 512;
  const H = 146;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(8,8,12,0.82)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ff3b2e";
  ctx.fillRect(0, 0, 14, H);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = `400 64px ${display}`;
  ctx.fillText("GENERATION 26", 38, 78);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `600 26px ${text}`;
  ctx.fillText("LIVE  ·  LOTUS TOWER OPEN ARENA", 40, 122);
  ctx.fillStyle = "#ff3b2e";
  ctx.beginPath();
  ctx.arc(W - 40, 40, 9, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
