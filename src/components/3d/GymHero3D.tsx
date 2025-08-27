import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text3D, Float } from '@react-three/drei';
import { Group, Mesh } from 'three';

// Dumbbell component
function Dumbbell({ position, rotation = [0, 0, 0], scale = 1 }: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const dumbbellRef = useRef<Group>(null);

  useFrame((state) => {
    if (dumbbellRef.current) {
      dumbbellRef.current.rotation.y += 0.01;
      dumbbellRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={dumbbellRef} position={position} rotation={rotation} scale={scale}>
        {/* Handle */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Left weight */}
        <mesh position={[-0.7, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Right weight */}
        <mesh position={[0.7, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Weight plates */}
        <mesh position={[-0.85, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.05]} />
          <meshStandardMaterial color="#FF6B35" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.85, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.05]} />
          <meshStandardMaterial color="#FF6B35" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

// Floating orbs for ambient effect
function FloatingOrb({ position, color = "#FF6B35" }: { 
  position: [number, number, number];
  color?: string;
}) {
  const orbRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
      orbRef.current.rotation.x += 0.02;
      orbRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={orbRef} position={position}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

// Main 3D Scene
function Scene() {
  const dumbbells = useMemo(() => [
    { position: [-3, 1, -2] as [number, number, number], rotation: [0.2, 0.5, 0.1] as [number, number, number], scale: 0.8 },
    { position: [3, -1, -1] as [number, number, number], rotation: [-0.1, -0.3, 0.2] as [number, number, number], scale: 1.1 },
    { position: [-1, -2, -3] as [number, number, number], rotation: [0.3, 1.2, -0.1] as [number, number, number], scale: 0.6 },
    { position: [2, 2, -4] as [number, number, number], rotation: [-0.2, 0.8, 0.3] as [number, number, number], scale: 0.9 },
  ], []);

  const orbs = useMemo(() => [
    { position: [-4, 2, -1] as [number, number, number], color: "#FF6B35" },
    { position: [4, -2, -2] as [number, number, number], color: "#4A90E2" },
    { position: [0, 3, -3] as [number, number, number], color: "#7B68EE" },
    { position: [-2, -1, 1] as [number, number, number], color: "#FF6B35" },
    { position: [3, 1, 2] as [number, number, number], color: "#4A90E2" },
  ], []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#FF6B35" intensity={0.5} />
      <pointLight position={[10, 10, 10]} color="#4A90E2" intensity={0.3} />

      {/* Dumbbells */}
      {dumbbells.map((dumbbell, index) => (
        <Dumbbell
          key={index}
          position={dumbbell.position}
          rotation={dumbbell.rotation}
          scale={dumbbell.scale}
        />
      ))}

      {/* Floating orbs */}
      {orbs.map((orb, index) => (
        <FloatingOrb
          key={index}
          position={orb.position}
          color={orb.color}
        />
      ))}

      {/* Controls */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        enabled={false}
      />
    </>
  );
}

export default function GymHero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ 
          background: 'transparent',
          pointerEvents: 'none'
        }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}