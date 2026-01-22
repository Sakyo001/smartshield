"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDHeroCanvasProps {
  imageSrc: string;
  width?: number;
  height?: number;
}

export default function ThreeDHeroCanvas({
  imageSrc,
  width = 800,
  height = 600,
}: ThreeDHeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rotationSpeedRef = useRef(0.002);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x545bff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xb19eef, 0.5);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageSrc, (texture) => {
      // Create geometry with more segments for better 3D effect
      const geometry = new THREE.BoxGeometry(2, 1.5, 0.3, 16, 16, 16);

      // Create material with the loaded texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.3,
        roughness: 0.4,
        emissiveIntensity: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Add edges for more definition
      const edges = new THREE.EdgesGeometry(geometry);
      const wireframe = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x545bff, linewidth: 0.5 })
      );
      mesh.add(wireframe);

      scene.add(mesh);
      meshRef.current = mesh;

      // Add subtle glow effect
      const glowGeometry = new THREE.BoxGeometry(2.05, 1.55, 0.35, 16, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x545bff,
        transparent: true,
        opacity: 0.1,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.z -= 0.05;
      mesh.add(glowMesh);
    });

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseXRef.current = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseYRef.current = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };

    containerRef.current.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (meshRef.current) {
        // Auto rotation
        meshRef.current.rotation.x += rotationSpeedRef.current;
        meshRef.current.rotation.y += rotationSpeedRef.current * 0.7;

        // Mouse-based tilt
        meshRef.current.rotation.x += (mouseYRef.current * 0.5 - meshRef.current.rotation.x) * 0.1;
        meshRef.current.rotation.y += (mouseXRef.current * 0.5 - meshRef.current.rotation.y) * 0.1;

        // Floating animation
        meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && window.innerWidth < 768) {
        // Hide 3D on mobile for better performance
        renderer.setSize(0, 0);
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      containerRef.current?.removeEventListener("mousemove", handleMouseMove);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [imageSrc, width, height]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      style={{ minHeight: `${height}px` }}
    />
  );
}
