import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { cameraAt, END_T, type CameraPose } from "./path";
import { buildStage } from "./stage";
import { buildTower } from "./tower";

export { END_T };

/**
 * The Lotus Tower, built in code and drawn with three.js — the replacement for
 * the 12.5MB scrubbed footage the hero used to carry.
 *
 * Nothing is downloaded but this module: every surface is generated, every
 * texture drawn into a canvas at load. The camera is a function of timeline
 * time (see path.ts), so a scroll position always maps to exactly one frame,
 * at any speed, with nothing to decode and nothing to seek.
 */

/**
 * Where on screen the picture sits, as the old video element's CSS transform
 * described it: `translate(x%, y%) scale(s)`. The frame is now composed in the
 * lens instead of by moving an element, so there is never an edge to see.
 */
export type Framing = { x: number; y: number; scale: number };

export type LotusTower = {
  /** Timeline time, 0..END_T. */
  setTime(t: number): void;
  setFraming(f: Framing): void;
  /** `steady` says this frame follows the previous one directly — only those
   *  intervals tell us anything about how fast the GPU is. */
  render(now: number, steady?: boolean): void;
  resize(): void;
  dispose(): void;
};

/** The footage's own aspect: its framing is what the camera path was cut to. */
const SOURCE_ASPECT = 16 / 9;

/** A font family from one of the layout's next/font variables, with a
 *  fallback that still draws if it has not loaded. */
function fontFamily(variable: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export async function createLotusTower(canvas: HTMLCanvasElement): Promise<LotusTower> {
  const family = fontFamily("--font-inter-tight", `"Arial Narrow", Arial, sans-serif`);
  const display = fontFamily("--font-anton", `Impact, "Arial Narrow", sans-serif`);
  try {
    await Promise.all([
      document.fonts.load(`800 100px ${family}`),
      document.fonts.load(`400 100px ${display}`),
    ]);
  } catch {
    /* Falls back to whatever is loaded; the lettering still draws. */
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, SOURCE_ASPECT, 2, 4000);

  /*
   * Something for metal and glass to reflect. Without an environment a
   * metallic surface has nothing to show but its lights and goes flat grey;
   * this is a night sky drawn once — navy overhead, the city's warm glow along
   * the horizon, dark ground — and prefiltered, so the dome, the steel leaves
   * under the bud and the mast all pick up a believable sheen.
   */
  {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(10, 48, 24),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          vertexShader: /* glsl */ `
            varying vec3 vDir;
            void main() {
              vDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vDir;
            float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float n(vec2 p) {
              vec2 i = floor(p), f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
            }
            void main() {
              float y = vDir.y;
              float az = atan(vDir.x, vDir.z);
              /* Night over a lit city: deep blue overhead, warming toward a
                 violet horizon, the city's glow in a band along it. */
              vec3 sky = mix(vec3(0.2, 0.12, 0.2), vec3(0.03, 0.05, 0.13), smoothstep(0.0, 0.7, y));
              vec3 glow = vec3(0.55, 0.3, 0.16) * exp(-abs(y) * 12.0);
              /* Clouds, lit from below by the city. */
              vec2 cp = vec2(az * 2.2, y * 9.0);
              float c = n(cp) * 0.6 + n(cp * 2.3) * 0.3 + n(cp * 5.1) * 0.1;
              sky += vec3(0.22, 0.13, 0.2) * smoothstep(0.5, 0.85, c) * smoothstep(0.02, 0.15, y) * (1.0 - smoothstep(0.4, 0.8, y));
              /* Moonlight: a broad, soft brightness high on the camera's side,
                 for the glass to sheen with as it turns. */
              vec3 md = normalize(vec3(-0.45, 0.5, 0.75));
              sky += vec3(0.5, 0.48, 0.58) * pow(max(dot(normalize(vDir), md), 0.0), 14.0);
              /* Streets below, scattered with lights. */
              vec2 gp = vec2(az * 60.0, y * 60.0);
              float lamp = step(0.9, h(floor(gp))) * (1.0 - smoothstep(0.2, 0.45, length(fract(gp) - 0.5)));
              vec3 ground = vec3(0.05, 0.04, 0.045) + vec3(0.9, 0.6, 0.35) * lamp * 0.6;
              gl_FragColor = vec4((y > 0.0 ? sky : ground) + glow, 1.0);
            }
          `,
        }),
      ),
    );
    scene.environment = pmrem.fromScene(envScene, 0.02).texture;
    pmrem.dispose();
  }

  /* ------------------------------------------------------------------ */
  /* Light                                                               */
  /* ------------------------------------------------------------------ */

  /*
   * Night, floodlit from the ground, and balanced: a warm key from below left
   * and a cooler fill from below right at a little over half its strength, so
   * both sides of the shaft read and each flute still shows a lit face and a
   * shaded one. The hemisphere is the city glow, there so nothing in shadow
   * goes fully black.
   */
  scene.add(new THREE.HemisphereLight(0x2e3e58, 0x100c08, 0.6));

  const key = new THREE.DirectionalLight(0xf6eee2, 1.3);
  key.position.set(-250, -55, 120);
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xd2ddf5, 0.75);
  fill.position.set(220, -30, 150);
  scene.add(fill, fill.target);

  /* Floodlights at the foot, which is why the base reads brightest. */
  const flood = new THREE.SpotLight(0xffe6c4, 900, 260, 0.36, 0.9, 1.5);
  flood.position.set(-10, 2, 60);
  flood.target.position.set(0, 70, 0);
  scene.add(flood, flood.target);


  /* ------------------------------------------------------------------ */

  /* Yield between the heavy steps — drawing the textures, building the
     geometry — so the build never holds the main thread long enough to
     stutter the loader in front of it. */
  const breathe = () => new Promise<void>((r) => setTimeout(r, 0));
  await breathe();
  const tower = buildTower(family);
  scene.add(tower.group);
  await breathe();
  const stage = buildStage({ display, text: family });
  scene.add(stage.group);

  /* ------------------------------------------------------------------ */
  /* Post                                                                */
  /* ------------------------------------------------------------------ */

  /* Device pixel ratio, held down where the GPU cannot keep up. Dense
     screens get fewer MSAA samples: their pixels are already small enough
     that the extra samples cost more than they show. */
  const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let dpr = Math.min(maxDpr, 1.25);

  const target = new THREE.WebGLRenderTarget(4, 4, {
    type: THREE.HalfFloatType,
    samples: maxDpr > 1.2 ? 2 : 4,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.32, 0.3, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ------------------------------------------------------------------ */
  /* Frame                                                               */
  /* ------------------------------------------------------------------ */

  let t = 0;
  let framing: Framing = { x: 0, y: 0, scale: 1 };
  let width = 0;
  let height = 0;

  const pose: CameraPose = { x: 0, y: 0, z: 0, lookY: 0, fov: 24, az: 0 };

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    width = w;
    height = h;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
  };

  const place = () => {
    cameraAt(t, pose);
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(0, pose.lookY, 0);

    /* The footage was 16:9 and shown `object-fit: cover`. On anything taller
       that keeps the vertical field and crops the sides — which is what the
       camera path was framed against — and on anything wider it keeps the
       width and crops top and bottom. */
    const aspect = width / Math.max(1, height);
    let fov = pose.fov;
    if (aspect > SOURCE_ASPECT) {
      const k = Math.tan(((fov / 2) * Math.PI) / 180) * (SOURCE_ASPECT / aspect);
      fov = (2 * Math.atan(k) * 180) / Math.PI;
    }
    camera.fov = fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    /* The hero framing, applied in clip space: scale about the centre, then
       shift. Exactly the old element transform, without the element. */
    const s = framing.scale;
    const tx = (framing.x / 100) * 2;
    const ty = -(framing.y / 100) * 2;
    if (s !== 1 || tx !== 0 || ty !== 0) {
      const lens = new THREE.Matrix4().set(
        s, 0, 0, tx,
        0, s, 0, ty,
        0, 0, 1, 0,
        0, 0, 0, 1,
      );
      camera.projectionMatrix.premultiply(lens);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
  };

  /*
   * Adaptive resolution: a rolling frame time, checked every second.
   *
   * Only back-to-back frames count. When nothing is moving the caller draws
   * on purpose at a lower rate, and timing those gaps would read a resting
   * page as a struggling GPU and throw resolution away for nothing. Hidden
   * and throttled frames are left out for the same reason.
   *
   * It takes two slow seconds in a row to step down — one hitch is not a
   * slow GPU — and four good ones to step back up. Frame time cannot fall
   * below the display's refresh, so "good" means holding refresh rate, and
   * after a step down it waits before trying again rather than see-sawing.
   */
  const startDpr = dpr;
  let acc = 0;
  let frames = 0;
  let lastFrameAt = 0;
  let lastSteady = false;
  let lastCheck = 0;
  let slow = 0;
  let good = 0;
  let cooldownUntil = 0;
  const adapt = (now: number, steady: boolean) => {
    if (lastFrameAt && steady && lastSteady && !document.hidden) {
      const dt = now - lastFrameAt;
      if (dt < 100) {
        acc += dt;
        frames++;
      }
    }
    lastFrameAt = now;
    lastSteady = steady;
    if (now - lastCheck < 1000) return;
    lastCheck = now;
    if (frames < 20) {
      acc = 0;
      frames = 0;
      return;
    }
    const avg = acc / frames;
    acc = 0;
    frames = 0;
    /* Below about 42 frames a second is slow: a phone sitting at 35 was
       left there, which reads as lag on a scroll-driven scene. */
    slow = avg > 24 ? slow + 1 : 0;
    good = avg < 18 ? good + 1 : 0;
    let next = dpr;
    if (slow >= 2 && dpr > 0.75) {
      next = Math.max(0.75, dpr - 0.25);
      cooldownUntil = now + 8000;
      slow = 0;
    } else if (good >= 4 && dpr < startDpr && now > cooldownUntil) {
      next = Math.min(startDpr, dpr + 0.25);
      good = 0;
    }
    if (next !== dpr) {
      dpr = next;
      resize();
    }
  };

  resize();
  place();
  await renderer.compileAsync(scene, camera);

  return {
    setTime(next) {
      t = Math.max(0, Math.min(END_T, next));
    },
    setFraming(f) {
      framing = f;
    },
    render(now, steady = false) {
      adapt(now, steady);
      const time = now / 1000;

      tower.update(t, time);
      stage.update(t, time);
      place();
      stage.renderFeed(renderer, scene);
      composer.render();
    },
    resize,
    dispose() {
      composer.dispose();
      target.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
    },
  };
}
