"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ── Floating Shield GLB ── */
function Shield() {
  const { scene } = useGLTF("/images/smartshield-logo-3d.glb");
  const groupRef = useRef<THREE.Group>(null!);
  const startTimeRef = useRef<number | null>(null);
  const introDoneRef = useRef(false);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.8 / maxDim;
    clone.scale.setScalar(scale);
    clone.position.sub(center.multiplyScalar(scale));
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Record when model first renders
    if (startTimeRef.current === null) startTimeRef.current = t;
    const elapsed = t - startTimeRef.current;

    // ── Intro: full 360° spin so the viewer immediately sees it is 3D ──
    const introDuration = 2.4;
    if (!introDoneRef.current && elapsed < introDuration) {
      const p = elapsed / introDuration;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      groupRef.current.rotation.y = Math.PI * 2 * eased;
      // Slight tilt up then back during intro
      groupRef.current.rotation.x = Math.sin(p * Math.PI) * 0.28;
      return;
    }
    introDoneRef.current = true;

    // ── Idle: wide oscillation + strong pointer parallax ──
    const idleT = elapsed - introDuration;
    groupRef.current.rotation.y =
      Math.sin(idleT * 0.38) * 0.42 + state.pointer.x * 0.45;
    groupRef.current.rotation.x =
      Math.cos(idleT * 0.3) * 0.15 - state.pointer.y * 0.28;
    // Z-axis sway adds subtle tilt that reads as 3D
    groupRef.current.rotation.z = Math.sin(idleT * 0.22) * 0.06;
  });

  return (
    // Float adds organic up/down movement emphasising the 3D nature
    <Float speed={2.5} rotationIntensity={0.08} floatIntensity={1.1} floatingRange={[-0.18, 0.18]}>
      <group ref={groupRef}>
        <primitive object={clonedScene} />
      </group>
    </Float>
  );
}

/* ── Two coloured point lights that orbit the model ──
   They cast moving highlights + shadows, making depth very obvious. */
function OrbitLights() {
  const l1 = useRef<THREE.PointLight>(null!);
  const l2 = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (l1.current) {
      l1.current.position.set(
        Math.cos(t * 0.55) * 4.5,
        1.8,
        Math.sin(t * 0.55) * 4.5
      );
      l1.current.intensity = 3.0;
    }
    if (l2.current) {
      l2.current.position.set(
        Math.cos(t * 0.55 + Math.PI) * 4.5,
        -1.8,
        Math.sin(t * 0.55 + Math.PI) * 4.5
      );
      l2.current.intensity = 2.4;
    }
  });

  return (
    <>
      <pointLight ref={l1} intensity={2.2} color="#7c6fff" distance={12} decay={2} />
      <pointLight ref={l2} intensity={1.8} color="#4d8fff" distance={12} decay={2} />
    </>
  );
}

/* ── Floating particles in the background ── */
function Particles({ count = 35 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        position: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 14,
          -2 - Math.random() * 7,
        ] as [number, number, number],
        speed: 0.08 + Math.random() * 0.28,
        offset: Math.random() * Math.PI * 2,
        scale: 0.012 + Math.random() * 0.022,
      })),
    [count]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(t * p.speed + p.offset) * 0.35,
        p.position[1] + Math.cos(t * p.speed * 0.7 + p.offset) * 0.28,
        p.position[2]
      );
      dummy.scale.setScalar(p.scale * (1 + Math.sin(t * 1.6 + p.offset) * 0.22));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#8080ff" transparent opacity={0.38} />
    </instancedMesh>
  );
}

/* ── Main Export ── */
export default function ShieldModel() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.8], fov: 46 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
      frameloop="always"
    >
      {/* Base lighting */}
      <ambientLight intensity={1.6} />
      <directionalLight position={[4, 6, 5]} intensity={2.8} color="#ffffff" castShadow />
      <directionalLight position={[-4, 2, 2]} intensity={1.1} color="#ddd8ff" />
      {/* Top rim light — creates shiny top edge that proves depth */}
      <pointLight position={[0, 6, 1]} intensity={2.5} color="#ffffff" />
      {/* Bottom fill */}
      <pointLight position={[0, -5, 2]} intensity={0.9} color="#545BFF" />

      <Suspense fallback={null}>
        {/* Orbiting lights move around the model continuously */}
        <OrbitLights />
        <Shield />
        <Environment preset="studio" environmentIntensity={0.7} />
      </Suspense>

      <Particles />
    </Canvas>
  );
}

useGLTF.preload("/images/smartshield-logo-3d.glb");
