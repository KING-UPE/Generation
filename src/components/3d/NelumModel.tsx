"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/nelum-kuluna.glb");

type Props = {
  hovered?: boolean;
  scrollProgress?: number;
};

export default function NelumModel({ hovered = false, scrollProgress = 0 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  const { scene } = useGLTF("/models/nelum-kuluna.glb");

  // Clone scene and apply concert theme materials with red emissive highlights
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => enhanceMaterial(mat));
        } else if (mesh.material) {
          mesh.material = enhanceMaterial(mesh.material);
        }
      }
    });

    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth continuous concert rotation
    const baseSpeed = hovered ? 0.8 : 0.4;
    groupRef.current.rotation.y += delta * baseSpeed;

    // Subtle pointer lean
    const targetRotX = state.pointer.y * 0.18 + (scrollProgress - 0.5) * 0.2;
    const targetRotZ = -state.pointer.x * 0.18;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.06,
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      targetRotZ,
      0.06,
    );

    // Pulse stage energy rings
    if (ringRef.current && ring2Ref.current) {
      ringRef.current.rotation.z += delta * 0.8;
      ring2Ref.current.rotation.z -= delta * 0.5;

      const t = state.clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 3.5) * 0.08;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Float
        speed={1.4}
        rotationIntensity={0.2}
        floatIntensity={0.4}
        floatingRange={[-0.15, 0.15]}
      >
        <group ref={coreRef} position={[0, -2.4, 0]} scale={0.075}>
          <primitive object={clonedScene} />
        </group>
      </Float>

      {/* Stage Holographic Energy Rings */}
      <mesh
        ref={ringRef}
        position={[0, -2.42, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.8, 1.86, 64]} />
        <meshBasicMaterial
          color="#FF3B2F"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={ring2Ref}
        position={[0, -2.48, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.3, 2.34, 64]} />
        <meshBasicMaterial
          color="#E10600"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Stage ground aura plane */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.2, 32]} />
        <meshBasicMaterial
          color="#2A0207"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function enhanceMaterial(mat: THREE.Material): THREE.Material {
  const name = mat.name.toLowerCase();

  // Highlight petal and top features with fiery red emission
  if (name.includes("petal") || name.includes("top")) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#FF3B2F"),
      emissive: new THREE.Color("#8B0212"),
      emissiveIntensity: 0.85,
      metalness: 0.85,
      roughness: 0.25,
    });
  }

  // Dark metallic tower stem & base
  if (name.includes("stem") || name.includes("base") || name.includes("material")) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#181820"),
      emissive: new THREE.Color("#2A0207"),
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.28,
    });
  }

  // Glass and railing elements
  if (name.includes("glass") || name.includes("railing")) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#FFFFFF"),
      emissive: new THREE.Color("#FF3B2F"),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.75,
      metalness: 0.5,
      roughness: 0.15,
      transmission: 0.4,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1C1C24"),
    emissive: new THREE.Color("#E10600"),
    emissiveIntensity: 0.2,
    metalness: 0.8,
    roughness: 0.3,
  });
}
