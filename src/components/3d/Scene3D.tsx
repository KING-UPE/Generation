"use client";

import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sparkles, Center } from "@react-three/drei";
import NelumModel from "./NelumModel";

type Props = {
  className?: string;
  scrollProgress?: number;
};

export default function Scene3D({ className = "", scrollProgress = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      data-cursor="view"
      data-cursor-label="3D DRAG"
      className={"relative h-full w-full select-none " + className}
    >
      <Canvas
        camera={{ position: [0, 0.4, 6.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#050507"]} />
        <fog attach="fog" args={["#050507", 7, 18]} />

        {/* Concert Stage Lighting */}
        <ambientLight intensity={0.4} color="#8B8B96" />

        {/* Key Red Spotlight from above */}
        <spotLight
          position={[0, 9, 3]}
          angle={0.45}
          penumbra={0.9}
          intensity={6}
          color="#FF3B2F"
          castShadow
        />

        {/* Secondary Warm Rim Light */}
        <pointLight position={[-4, 2, -2]} intensity={2.5} color="#FF5A3C" />
        {/* Cool Silhouette Backlight */}
        <pointLight position={[4, -1, -3]} intensity={2.2} color="#4A6E9B" />
        {/* Upward stage glow */}
        <pointLight position={[0, -2.8, 0]} intensity={3.5} color="#E10600" />

        <Suspense fallback={<Loader />}>
          <Center top>
            <NelumModel hovered={hovered} scrollProgress={scrollProgress} />
          </Center>

          {/* Red Stage Floating Ember Particles */}
          <Sparkles
            count={60}
            scale={5.5}
            size={2.4}
            speed={0.4}
            opacity={0.65}
            color="#FF3B2F"
          />
          <Sparkles
            count={40}
            scale={7}
            size={1.5}
            speed={0.25}
            opacity={0.4}
            color="#EDEDF0"
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.75}
          rotateSpeed={0.6}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Interactive Helper Pill */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-hairline bg-ink-2/80 px-4 py-1.5 backdrop-blur-md">
        <span className="eyebrow text-[10px] tracking-[0.2em] text-muted">
          ✦ Drag to Orbit · Colombo Nelum Kuluna
        </span>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial color="#FF3B2F" wireframe />
    </mesh>
  );
}
