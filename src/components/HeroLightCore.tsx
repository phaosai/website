import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const LightSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  const color = useMemo(() => new THREE.Color("hsl(263, 70%, 58%)"), []);
  const emissive = useMemo(() => new THREE.Color("hsl(263, 70%, 40%)"), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.08;
    meshRef.current.rotation.y += delta * 0.12;
    // Subtle mouse reactivity
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, pointer.x * 0.3, 0.02);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, pointer.y * 0.2, 0.02);
  });

  return (
    <mesh ref={meshRef} scale={2.2}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.6}
        roughness={0.3}
        metalness={0.1}
        distort={0.35}
        speed={1.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

const HeroLightCore = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ willChange: "transform" }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="hsl(263, 70%, 58%)" />
        <pointLight position={[-5, -5, 3]} intensity={0.3} color="hsl(270, 80%, 68%)" />
        <LightSphere />
      </Canvas>
    </div>
  );
};

export default HeroLightCore;
