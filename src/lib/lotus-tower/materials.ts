import * as THREE from "three";

/**
 * The scene's own shaders. Everything here outputs linear HDR colour: the
 * composer's last pass does tone mapping and sRGB, and anything above 1.0 is
 * what the bloom pass picks up — so "how much does this glow" is simply "how
 * far past 1 is it", set per material below.
 */

const HASH = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
`;

/* ------------------------------------------------------------------------ */
/* Lotus petals                                                              */
/* ------------------------------------------------------------------------ */

/**
 * The petals at night: dark glass lit from inside, in a dark steel frame,
 * the way the tower glows after dark.
 *
 * Each petal is glazed in flat panes, and every pane is one of three
 * strengths of light (dim, mid, bright), so the bud reads as a mosaic of lit
 * boxes rather than one even sheet. The light gathers toward each petal's
 * edges and root, where the fittings are; that is the glow. The petal has no
 * outline of any kind: a lit line round it was taken out, and the dark frame
 * left behind read as a black outline, so the glass now runs to the edge.
 * The floodlights barely
 * touch the glass and its reflections are kept low, so nothing reads as
 * daylit; the panes still sit at their own slight angles, so a little night
 * sky slides across them as the camera moves.
 *
 *  - the frame: ribs and transoms in dark steel, so the boxes stay
 *    separate; nothing round the edge;
 *  - the glass: deep magenta, three shades, each pane glowing at its own
 *    strength.
 */
export function petalMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.15,
    emissive: 0xffffff,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aSeed;\nvarying vec2 vPUv;\nvarying float vPSeed;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvPUv = uv;\nvPSeed = aSeed;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vPUv;
        varying float vPSeed;
        ${HASH}
        float pGrid(float x, float w) {
          float f = fract(x);
          return 1.0 - smoothstep(0.0, w, min(f, 1.0 - f));
        }
        float pFrame;
        float pPane;
        vec2 pTilt;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          float u = vPUv.x * 2.0 - 1.0;
          float v = vPUv.y;
          float au = abs(u);
          float pv = v * 8.0;
          float cu = au * 3.0;
          float transom = pGrid(pv, 0.05 + fwidth(pv)) * step(0.04, v);
          float mullion = pGrid(cu, 0.05 + fwidth(cu)) * step(au, 0.97);
          pFrame = max(transom, mullion);
          vec2 cell = vec2(floor(cu) + step(0.0, u) * 5.0 + vPSeed * 17.0, floor(pv));
          /* Three shades, one per pane: 0, 0.5 or 1. */
          pPane = floor(hash12(cell) * 3.0) / 2.0;
          pTilt = vec2(hash12(cell + 7.3), hash12(cell + 19.1)) - 0.5;
          vec3 glass = mix(vec3(0.06, 0.004, 0.03), vec3(0.12, 0.009, 0.055), pPane);
          vec3 steel = vec3(0.14, 0.018, 0.04);
          diffuseColor.rgb = mix(glass, steel, pFrame);
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.07 + 0.08 * pPane, 0.38, pFrame);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(0.15, 0.55, pFrame);`,
      )
      /* Each pane a flat facet at its own slight angle. */
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        normal = normalize(normal + vec3(pTilt * 0.22, 0.0) * (1.0 - pFrame));`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float v = vPUv.y;
          float au = abs(vPUv.x * 2.0 - 1.0);
          vec3 pink = vec3(0.9, 0.05, 0.36);
          /* Each pane lit at one of three strengths, gathering toward the
             petal's edges and root. */
          float edgeward = smoothstep(0.3, 1.0, au);
          float rootward = 1.0 - smoothstep(0.05, 0.95, v);
          vec3 glow = pink * mix(0.06, 0.28, pPane) * (0.45 + 1.0 * edgeward + 0.25 * rootward);
          /* Ribs and transoms dark between the panes. */
          totalEmissiveRadiance = glow * (1.0 - pFrame) + pink * 0.05 * pFrame;
        }`,
      )
      .replace(
        "#include <aomap_fragment>",
        `reflectedLight.directSpecular = vec3(0.0);
        reflectedLight.directDiffuse *= 0.3;
        #include <aomap_fragment>`,
      )
      /* A guard on the way out: a stray Inf or NaN, spread by the bloom
         blur, would take the whole frame with it. */
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        gl_FragColor.rgb = any(isnan(gl_FragColor.rgb)) ? vec3(0.0) : min(gl_FragColor.rgb, vec3(24.0));`,
      );
  };
  mat.customProgramCacheKey = () => "petal-glass-16";
  return mat;
}

/* ------------------------------------------------------------------------ */
/* Glazing with lit floors behind it                                         */
/* ------------------------------------------------------------------------ */

export type Band = { y0: number; y1: number; gain: number; rows: number };

/**
 * Dark glass with the floors behind it lit — the bud's core, the balcony, the
 * collars round the shaft.
 *
 * Windows are cells of a grid in (angle, height): mullions round the drum,
 * `rows` of panes up each band. Every pane rolls its own brightness and a
 * fraction stay dark, which is the whole difference between "an occupied
 * building at night" and "a cylinder with an orange stripe". The top of each
 * pane is brighter — that is the ceiling lights, seen from outside.
 */
export function windowMaterial(opts: {
  bands: Band[];
  mullions: number;
  seed: number;
  lit?: number;
  glass?: THREE.ColorRepresentation;
  warm?: THREE.ColorRepresentation;
  sky?: THREE.ColorRepresentation;
}) {
  const bands = opts.bands.slice(0, 8).map((b) => new THREE.Vector4(b.y0, b.y1, b.gain, b.rows));
  while (bands.length < 8) bands.push(new THREE.Vector4(0, 0, 0, 1));
  return new THREE.ShaderMaterial({
    uniforms: {
      uBands: { value: bands },
      uCount: { value: opts.bands.length },
      uMullions: { value: opts.mullions },
      uSeed: { value: opts.seed },
      uLit: { value: opts.lit ?? 0.82 },
      uGlass: { value: new THREE.Color(opts.glass ?? 0x0b1220) },
      uWarm: { value: new THREE.Color(opts.warm ?? 0xffa860) },
      uSky: { value: new THREE.Color(opts.sky ?? 0x1c2a44) },
    },
    /* The pane grid is laid out in the model's own space, so it turns with the
       tower rather than sliding over it. */
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vLocal;
      varying vec3 vN;
      void main() {
        vLocal = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec4 uBands[8];
      uniform int uCount;
      uniform float uMullions;
      uniform float uSeed;
      uniform float uLit;
      uniform vec3 uGlass;
      uniform vec3 uWarm;
      uniform vec3 uSky;
      varying vec3 vWorld;
      varying vec3 vLocal;
      varying vec3 vN;
      ${HASH}
      void main() {
        float ang = atan(vLocal.x, vLocal.z);
        float a = (ang / 6.2831853 + 0.5) * uMullions;
        float cell = floor(a);
        float fa = fract(a);
        float aw = fwidth(a);
        float frame = smoothstep(0.0, 0.07 + aw, fa) * smoothstep(1.0, 0.93 - aw, fa);

        float lit = 0.0;
        float slab = 0.0;
        for (int i = 0; i < 8; i++) {
          if (i >= uCount) break;
          vec4 b = uBands[i];
          float yy = (vLocal.y - b.x) / (b.y - b.x);
          if (yy < 0.0 || yy > 1.0) continue;
          float ry = yy * b.w;
          float row = floor(ry);
          float fy = fract(ry);
          float fw = fwidth(ry);
          float rowFrame = smoothstep(0.0, 0.08 + fw, fy) * smoothstep(1.0, 0.86 - fw, fy);
          float h = hash12(vec2(cell + uSeed * 13.0, row + float(i) * 17.0));
          float on = step(1.0 - uLit, h);
          float level = mix(0.4, 1.25, hash12(vec2(cell * 1.37 + uSeed, row * 7.1 + float(i))));
          /* A few panes run cooler — screens, a lift lobby. */
          float cool = step(0.93, hash12(vec2(cell + 3.0, row + uSeed)));
          /* Floors read from outside as a strip of ceiling light with the
             room going dark below it, not as a lit box. */
          float ceiling = 0.12 + 1.35 * smoothstep(0.52, 0.86, fy);
          lit += on * level * ceiling * rowFrame * b.z * (1.0 - cool * 0.5);
          slab = max(slab, 1.0 - rowFrame);
        }

        vec3 n = normalize(vN);
        vec3 V = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 4.0);
        vec3 col = uGlass + uSky * fres * 0.6 + uWarm * lit * frame;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */
/* Projected lettering                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Light thrown onto the shaft, not a sign stuck to it.
 *
 * It is additive, so it brightens whatever concrete it lands on rather than
 * covering it, and it is shaded by the angle to its projector: a groove wall
 * turned away from the beam takes almost none of it, which is what makes the
 * letters break across the flutes the way real projection does.
 *
 * `uReveal` runs 0..1: the corners land by 0.2, the words then wipe in along
 * the reading direction behind a bright scan line, with a short flicker while
 * the lamp settles.
 */
export function captionMaterial(map: THREE.Texture, y0: number, len: number, projector: THREE.Vector3) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uY0: { value: y0 },
      uLen: { value: len },
      uProj: { value: projector },
      uReveal: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(1.0, 0.97, 0.92).multiplyScalar(0.95) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    /* Model space throughout: the projector is fixed to the face it throws
       onto, so the lettering turns with the tower. */
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vLocal;
      varying vec3 vN;
      void main() {
        vUv = uv;
        vLocal = position;
        vN = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uY0;
      uniform float uLen;
      uniform vec3 uProj;
      uniform float uReveal;
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vLocal;
      varying vec3 vN;
      ${HASH}
      void main() {
        if (uReveal <= 0.001) discard;
        float along = (vLocal.y - uY0) / uLen;
        float across = vUv.x;
        vec4 t = texture2D(uMap, vec2(along, 1.0 - across));

        float corners = t.g * smoothstep(0.0, 0.2, uReveal);
        float front = mix(-0.05, 1.08, smoothstep(0.18, 1.0, uReveal));
        float shown = 1.0 - smoothstep(front - 0.035, front, along);
        float scan = exp(-abs(along - front) * 70.0)
                   * (1.0 - smoothstep(0.9, 1.0, uReveal))
                   * smoothstep(0.12, 0.3, across) * smoothstep(0.88, 0.7, across);

        float settling = (1.0 - smoothstep(0.85, 1.0, uReveal)) * step(0.01, uReveal);
        float flicker = mix(1.0, 0.55 + 0.45 * hash12(vec2(floor(uTime * 22.0), 3.0)), settling);

        vec3 L = normalize(uProj - vLocal);
        float ndl = clamp(dot(normalize(vN), L), 0.0, 1.0);
        float lamp = 0.12 + 0.88 * ndl;

        float k = (t.r * shown + corners + scan * 0.55) * lamp * flicker;
        gl_FragColor = vec4(uColor * k, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */
/* Light beams                                                               */
/* ------------------------------------------------------------------------ */

/**
 * A moving-head beam through haze: an open cone, brightest where you look down
 * its axis and fading toward its silhouette, so it reads as a volume rather
 * than a lampshade. Brightness falls with distance from the lamp.
 */
export function beamMaterial(color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uGain: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute float aGain;
      varying float vAlong;
      varying vec3 vN;
      varying vec3 vView;
      varying float vGain;
      void main() {
        vAlong = uv.y;
        vGain = aGain;
        vec4 lp = instanceMatrix * vec4(position, 1.0);
        vec4 wp = modelMatrix * lp;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vView = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uGain;
      varying float vAlong;
      varying vec3 vN;
      varying vec3 vView;
      varying float vGain;
      void main() {
        float f = abs(dot(normalize(vN), normalize(vView)));
        float core = pow(clamp(f, 0.0, 1.0), 3.0);
        /* Clamped: at the far rim vAlong can land a hair past 1, and pow() of
           a negative is NaN — one NaN pixel, and the bloom blur spreads it
           over the whole frame. */
        float fall = pow(clamp(1.0 - vAlong, 0.0, 1.0), 1.8) * smoothstep(0.0, 0.015, vAlong);
        gl_FragColor = vec4(uColor * core * fall * vGain * uGain, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */
/* LED screens                                                               */
/* ------------------------------------------------------------------------ */

/**
 * The stage screens, drawn rather than textured. `kind` 0 is the back wall —
 * deep blue with white shards cutting across it; 1 is a side screen carrying
 * the "camera feed": a bright figure in a light column over a crowd.
 * A faint LED pitch grid sits on both, which is what tells the eye it is a
 * screen and not a lit poster.
 */
export function ledMaterial(kind: 0 | 1, aspect: number, logo: THREE.Texture | null = null) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uKind: { value: kind },
      uAspect: { value: aspect },
      uGain: { value: 1 },
      uLogo: { value: logo },
      uHasLogo: { value: logo ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uKind;
      uniform float uAspect;
      uniform float uGain;
      uniform sampler2D uLogo;
      uniform float uHasLogo;
      varying vec2 vUv;
      ${HASH}
      float shard(vec2 p, float ang, float off, float w) {
        float s = sin(ang), c = cos(ang);
        float d = p.x * c + p.y * s - off;
        return 1.0 - smoothstep(0.0, w, abs(d));
      }
      void main() {
        vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
        vec3 col;
        if (uKind < 0.5) {
          col = mix(vec3(0.005, 0.015, 0.09), vec3(0.02, 0.06, 0.3), smoothstep(-0.5, 0.5, p.y));
          float t = uTime * 0.35;
          float k = 0.0;
          k += shard(p, 0.9, sin(t) * 0.6, 0.035);
          k += shard(p, -0.9, cos(t * 0.8) * 0.6, 0.035);
          k += shard(p, 1.25, sin(t * 1.3 + 2.0) * 0.9, 0.02) * 0.7;
          k += shard(p, -1.25, cos(t * 1.1 + 1.0) * 0.9, 0.02) * 0.7;
          col += vec3(0.75, 0.85, 1.0) * k * 1.8;
          col += vec3(0.35, 0.55, 1.0) * exp(-dot(p, p) * 6.0) * 0.9;
          /* The wordmark across the middle of the wall, breathing with the
             show — what the crowd photographs. */
          if (uHasLogo > 0.5) {
            vec2 l = vec2((vUv.x - 0.5) / 0.64 + 0.5, (vUv.y - 0.52) / 0.5 + 0.5);
            if (l.x > 0.0 && l.x < 1.0 && l.y > 0.0 && l.y < 1.0) {
              vec4 g = texture2D(uLogo, l);
              float pulse = 0.85 + 0.15 * sin(uTime * 2.1);
              col = mix(col, g.rgb * 2.4 * pulse, g.a);
            }
          }
        } else {
          col = mix(vec3(0.02, 0.06, 0.25), vec3(0.08, 0.22, 0.75), smoothstep(-0.5, 0.45, p.y));
          float column = exp(-abs(p.x) * 9.0) * smoothstep(-0.5, 0.2, p.y);
          col += vec3(0.85, 0.92, 1.0) * column * 2.4;
          float fan = shard(p, 1.2, -0.05, 0.05) + shard(p, -1.2, -0.05, 0.05);
          col += vec3(0.6, 0.75, 1.0) * fan * 0.8 * smoothstep(-0.2, 0.3, p.y);
          /* The crowd along the bottom of the shot, heads against the glow. */
          float x = p.x * 26.0;
          float heads = 0.0;
          for (int i = 0; i < 3; i++) {
            float fi = float(i);
            float cx = floor(x + fi * 0.33);
            float h = hash12(vec2(cx, fi));
            float px = fract(x + fi * 0.33) - 0.5;
            float top = -0.36 + h * 0.06 - fi * 0.03;
            heads = max(heads, step(p.y, top - px * px * 0.5));
          }
          col *= 1.0 - heads * 0.92;
          col += vec3(0.9) * step(0.996, hash12(floor(vUv * vec2(90.0, 50.0)) + floor(uTime * 3.0))) * heads;
        }
        vec2 g = fract(vUv * vec2(160.0 * uAspect, 160.0));
        float pitch = smoothstep(0.0, 0.25, g.x) * smoothstep(0.0, 0.25, g.y);
        col *= mix(0.62, 1.0, pitch);
        gl_FragColor = vec4(col * uGain, 1.0);
      }
    `,
  });
}

/**
 * A side screen showing the live camera — the image magnification every
 * concert this size runs. `feed` is a render of the singer from a camera on
 * the stage lip, redrawn as the show plays; over it a lower-third caption
 * and the LED pitch grid that tells you it is a screen.
 */
export function imagMaterial(feed: THREE.Texture, lower: THREE.Texture, aspect: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFeed: { value: feed },
      uLower: { value: lower },
      uAspect: { value: aspect },
      uGain: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uFeed;
      uniform sampler2D uLower;
      uniform float uAspect;
      uniform float uGain;
      varying vec2 vUv;
      void main() {
        vec3 col = texture2D(uFeed, vUv).rgb * 1.05;
        /* Lower third, bottom left. */
        vec2 l = vec2((vUv.x - 0.04) / 0.56, (vUv.y - 0.06) / 0.16);
        if (l.x > 0.0 && l.x < 1.0 && l.y > 0.0 && l.y < 1.0) {
          vec4 g = texture2D(uLower, l);
          col = mix(col, g.rgb * 1.4, g.a);
        }
        vec2 px = fract(vUv * vec2(150.0 * uAspect, 150.0));
        float pitch = smoothstep(0.0, 0.22, px.x) * smoothstep(0.0, 0.22, px.y);
        col *= mix(0.58, 1.0, pitch);
        gl_FragColor = vec4(col * uGain, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */
/* Crowd                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * The audience as billboards: one quad per person, turned to the camera about
 * the vertical, with the figure drawn in the fragment shader as a signed
 * distance field — head, shoulders, torso, and for some an arm or two up, or a
 * phone held high with its screen lit.
 *
 * Ten thousand people as real geometry would be the heaviest thing in the
 * scene by far, for a crowd that is only ever seen from behind, against the
 * stage, as silhouettes. Silhouettes are exactly what a distance field draws
 * well, and its gradient gives the rim of stage light round every head for
 * free.
 */
export function crowdMaterial(stage: THREE.Vector3) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStage: { value: stage },
      uRim: { value: new THREE.Color(0.55, 0.68, 1.0) },
    },
    alphaToCoverage: true,
    transparent: false,
    vertexShader: /* glsl */ `
      attribute vec4 aPerson; // x,z base, height, seed
      varying vec2 vLocal;
      varying float vSeed;
      varying float vHeight;
      varying float vLight;
      void main() {
        vec3 base = vec3(aPerson.x, 0.0, aPerson.y);
        float h = aPerson.z;
        vec3 toCam = cameraPosition - base;
        vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x));
        float w = 1.0;
        vec3 wp = base + right * (position.x * w) + vec3(0.0, position.y * (h + 0.55), 0.0);
        vLocal = vec2(position.x * w, position.y * (h + 0.55));
        vSeed = aPerson.w;
        vHeight = h;
        /* Nearer the stage, more of its light reaches you. */
        vLight = clamp(1.25 - length(base.xz - vec2(0.0, 82.0)) / 95.0, 0.15, 1.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uRim;
      varying vec2 vLocal;
      varying float vSeed;
      varying float vHeight;
      varying float vLight;
      ${HASH}
      float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h) - r;
      }
      float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }
      void main() {
        vec2 p = vLocal;
        float H = vHeight;
        float s = vSeed;
        float shoulder = 0.19 + 0.05 * fract(s * 7.3);
        float sway = sin(uTime * (1.2 + s) + s * 40.0) * 0.03;

        float d = length(p - vec2(sway, H - 0.12)) - 0.105;
        d = min(d, sdRoundBox(p - vec2(sway * 0.5, (H - 0.3) * 0.5), vec2(shoulder, (H - 0.3) * 0.5), 0.09));

        float pose = fract(s * 13.7);
        vec2 shL = vec2(-shoulder + 0.04, H - 0.34);
        vec2 shR = vec2(shoulder - 0.04, H - 0.34);
        bool phone = false;
        vec2 hand = vec2(0.0);
        if (pose > 0.78) {
          float lift = 0.5 + 0.08 * sin(uTime * 2.4 + s * 20.0);
          d = min(d, sdCapsule(p, shL, shL + vec2(-0.12, lift), 0.045));
          d = min(d, sdCapsule(p, shR, shR + vec2(0.12, lift), 0.045));
        } else if (pose > 0.66) {
          hand = shR + vec2(0.06, 0.52);
          d = min(d, sdCapsule(p, shR, hand, 0.045));
          phone = fract(s * 31.1) > 0.82;
        }

        float aw = fwidth(d);
        float alpha = 1.0 - smoothstep(-aw, aw, d);
        float rim = (1.0 - smoothstep(0.0, 0.05, -d)) * vLight;
        vec3 col = vec3(0.003, 0.0035, 0.005) + uRim * rim * 0.12;

        if (phone) {
          float scr = sdRoundBox(p - hand - vec2(0.0, 0.08), vec2(0.035, 0.06), 0.01);
          float glow = 1.0 - smoothstep(-fwidth(scr), fwidth(scr), scr);
          col = mix(col, vec3(1.5, 1.6, 1.85), glow);
          alpha = max(alpha, glow);
        }
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */
/* Ground                                                                    */
/* ------------------------------------------------------------------------ */

/** Dark ground, lit only where something lights it: the stage's spill across
 *  the arena and the floodlights' pools round the foot of the tower. */
export function groundMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uStageGain: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uStageGain;
      varying vec3 vWorld;
      ${HASH}
      void main() {
        vec2 p = vWorld.xz;
        vec3 col = vec3(0.006, 0.006, 0.007);
        float grain = hash12(floor(p * 3.0)) * 0.003;
        col += grain;
        /* Out past the arena the ground goes to night: no horizon line. */
        col *= 1.0 - smoothstep(180.0, 520.0, length(p - vec2(0.0, 60.0)));
        /* Stage spill, a wide fan opening toward the crowd. */
        vec2 s = p - vec2(0.0, 84.0);
        float spill = exp(-dot(s * vec2(0.022, 0.03), s * vec2(0.022, 0.03))) * step(0.0, s.y + 6.0);
        col += vec3(0.16, 0.2, 0.32) * spill * uStageGain;
        /* Floodlight pools at the tower's foot. */
        float r = length(p);
        col += vec3(0.32, 0.27, 0.2) * exp(-pow(max(r - 16.0, 0.0) / 14.0, 2.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */
/* Distant city                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Far buildings: dark blocks whose windows are a grid in world space, a
 * quarter of them lit. At this distance a window is a few pixels, so the grid
 * and its irregularity are all the detail there is to give.
 */
export function cityMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vN;
      void main() {
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vN;
      ${HASH}
      void main() {
        vec3 n = abs(vN);
        if (n.y > 0.5) { gl_FragColor = vec4(0.004, 0.004, 0.005, 1.0); return; }
        float u = n.x > 0.5 ? vWorld.z : vWorld.x;
        vec2 cell = vec2(u / 3.6, vWorld.y / 3.3);
        vec2 id = floor(cell);
        vec2 f = fract(cell);
        float pane = step(0.2, f.x) * step(f.x, 0.8) * step(0.25, f.y) * step(f.y, 0.75);
        float h = hash12(id + floor(vWorld.xz / 40.0) * 7.0);
        float on = step(0.76, h);
        vec3 warm = vec3(1.0, 0.68, 0.38);
        vec3 cool = vec3(0.65, 0.78, 1.0);
        vec3 lit = mix(warm, cool, step(0.93, h)) * (0.5 + 0.9 * fract(h * 37.0));
        vec3 col = vec3(0.004, 0.004, 0.006) + lit * pane * on * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/* ------------------------------------------------------------------------ */

/**
 * Lets a standard material glow by height — the spire's floodlit sections,
 * brightest just above the collar their lamps sit on and fading up the mast.
 * Height is the mesh's own, so it holds as the tower turns.
 */
export function uplit(
  mat: THREE.MeshStandardMaterial,
  y0: number,
  y1: number,
  k0: number,
  k1: number,
) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uUp = { value: new THREE.Vector4(y0, y1, k0, k1) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vUpY;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvUpY = transformed.y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vUpY;\nuniform vec4 uUp;")
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= mix(uUp.z, uUp.w, smoothstep(uUp.x, uUp.y, vUpY));",
      );
  };
  mat.customProgramCacheKey = () => `uplit:${y0}:${y1}:${k0}:${k1}`;
  return mat;
}
