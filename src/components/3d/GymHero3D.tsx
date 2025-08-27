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
  console.log('Scene component rendering');

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Simple test cube to verify rendering */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#FF6B35" />
      </mesh>

      {/* Single dumbbell for testing */}
      <Dumbbell position={[2, 0, -1]} rotation={[0, 0, 0]} scale={1} />

      {/* Single floating orb for testing */}
      <FloatingOrb position={[-2, 1, -1]} color="#4A90E2" />

      {/* Controls */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        enabled={false}
      />
    </>
  );
}

export default function GymHero3D() {
  console.log('GymHero3D component mounting');
  
  return (
    <div 
      className="absolute inset-0 -z-10"
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ 
          width: '100%',
          height: '100%',
          background: 'transparent',
          pointerEvents: 'none'
        }}
        gl={{ alpha: true, antialias: true }}
        onCreated={(state) => console.log('Canvas created:', state)}
      >
        <Scene />
      </Canvas>
    </div>
  );
}