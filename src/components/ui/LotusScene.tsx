"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Mode = "concert" | "wireframe";

export default function LotusScene({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>("concert");
  const modeRef = useRef<Mode>("concert");
  modeRef.current = mode;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.018);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 65);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0x0d0e14, 2.5);
    scene.add(ambientLight);

    const redSpot = new THREE.SpotLight(0xff3b2f, 45, 120, Math.PI / 4, 0.5, 1.2);
    redSpot.position.set(30, 45, 30);
    scene.add(redSpot);

    const blueRim = new THREE.DirectionalLight(0x385888, 3.5);
    blueRim.position.set(-30, 20, -25);
    scene.add(blueRim);

    const torchLight = new THREE.PointLight(0xff2e2e, 18, 60, 1.5);
    torchLight.position.set(0, 10, 25);
    scene.add(torchLight);

    const laserLight = new THREE.PointLight(0xff5a3c, 12, 45, 1.8);
    laserLight.position.set(0, 0, 15);
    scene.add(laserLight);

    // --- Atmospheric Particles ---
    const particleCount = reduced ? 80 : 320;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 80;
      particlePos[i * 3 + 1] = Math.random() * 60 - 10;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff5a3c,
      size: 0.75,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Neon Grid Rings around the Tower Base ---
    const ringGeo = new THREE.RingGeometry(10, 10.4, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2e2e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -8;
    scene.add(ring);

    const outerRingGeo = new THREE.RingGeometry(22, 22.5, 64);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = -8.1;
    scene.add(outerRing);

    // --- Model Container ---
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3b2f,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    const loader = new GLTFLoader();
    loader.load(
      "/models/lotus_tower.glb",
      (gltf) => {
        const root = gltf.scene;

        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 38 / maxDim;
        root.scale.setScalar(scale);

        box.setFromObject(root);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.x = -center.x;
        root.position.y = -center.y + 4;
        root.position.z = -center.z;

        root.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            originalMaterials.set(mesh, mesh.material);

            if (mesh.material && !Array.isArray(mesh.material)) {
              const m = mesh.material as THREE.MeshStandardMaterial;
              m.roughness = 0.32;
              m.metalness = 0.85;
              m.emissive = new THREE.Color(0x2a0408);
              m.emissiveIntensity = 0.45;
            }
          }
        });

        modelGroup.add(root);
        setLoaded(true);
      },
      undefined,
      (err) => {
        console.warn("Failed to load Lotus Tower 3D model:", err);
      }
    );

    // --- Mouse Interactivity ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // --- ScrollTrigger Camera Choreography ---
    let stVision: ScrollTrigger | null = null;
    let stAbout: ScrollTrigger | null = null;

    if (!reduced) {
      stVision = ScrollTrigger.create({
        trigger: "#vision",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          modelGroup.rotation.y = p * Math.PI * 0.9;
          laserLight.position.y = 10 + p * 20;
          ring.rotation.z = p * Math.PI;
        },
      });

      stAbout = ScrollTrigger.create({
        trigger: "#about",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          camera.position.y = 15 + p * 12;
          camera.position.z = 65 - p * 18;
          camera.lookAt(0, 8 + p * 6, 0);
        },
      });
    }

    // --- Resize Observer ---
    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // --- Animation Loop ---
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      torchLight.position.x = mouse.x * 25;
      torchLight.position.y = 10 + mouse.y * 18;

      if (!reduced) {
        modelGroup.rotation.y += delta * 0.22;
        particles.rotation.y += delta * 0.05;
        ring.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.03);
      }

      // Material wireframe mode toggle check
      modelGroup.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          if (modeRef.current === "wireframe") {
            mesh.material = wireMaterial;
          } else {
            const orig = originalMaterials.get(mesh);
            if (orig) mesh.material = orig;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      stVision?.kill();
      stAbout?.kill();
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      outerRingGeo.dispose();
      wireMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={"relative flex h-full w-full min-h-[380px] items-center justify-center overflow-hidden rounded-2xl " + className}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />

      {/* 3D Scene HUD & Interaction Pill */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex flex-wrap items-center gap-3">
        <div className="badge-pill bg-black/60 backdrop-blur-md">
          <span className="h-2 w-2 animate-ping rounded-full bg-red-hot" />
          <span>LOTUS TOWER 3D ARENA</span>
        </div>

        <button
          type="button"
          data-cursor="link"
          onClick={() => setMode((m) => (m === "concert" ? "wireframe" : "concert"))}
          className="badge-pill pointer-events-auto cursor-pointer border-hairline transition-colors hover:border-red-hot"
        >
          {mode === "concert" ? "⚡ WIREFRAME MODE" : "✨ CONCERT GLOW"}
        </button>
      </div>

      {!loaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-ink/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 font-mono-ui text-xs tracking-widest text-muted">
            <span className="h-2 w-2 animate-spin rounded-full border-2 border-red border-t-transparent" />
            LOADING 3D ARENA...
          </div>
        </div>
      )}
    </div>
  );
}
