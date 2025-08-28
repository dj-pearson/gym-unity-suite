import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// 3D Dumbbell Component
const Dumbbell = () => {
  const dumbbellRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (dumbbellRef.current) {
      // Smooth rotation animation
      dumbbellRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      dumbbellRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      dumbbellRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  // Create materials with enhanced visuals
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFD700',
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 2,
  }), []);

  const blackMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a0a0a',
    metalness: 0.8,
    roughness: 0.3,
  }), []);

  const handleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#DAA520',
    metalness: 0.95,
    roughness: 0.05,
    envMapIntensity: 2.5,
  }), []);

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={dumbbellRef} scale={[1.4, 1.4, 1.4]}>
        {/* Left Weight Plates - Stacked realistic plates */}
        {/* Outer large plate */}
        <mesh position={[-2.8, 0, 0]} material={goldMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.8, 32]} />
        </mesh>
        {/* Middle plate */}
        <mesh position={[-2.3, 0, 0]} material={blackMaterial} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.6, 32]} />
        </mesh>
        {/* Inner small plate */}
        <mesh position={[-1.9, 0, 0]} material={goldMaterial} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.4, 32]} />
        </mesh>
        
        {/* Right Weight Plates - Stacked realistic plates */}
        {/* Outer large plate */}
        <mesh position={[2.8, 0, 0]} material={goldMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.8, 32]} />
        </mesh>
        {/* Middle plate */}
        <mesh position={[2.3, 0, 0]} material={blackMaterial} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.6, 32]} />
        </mesh>
        {/* Inner small plate */}
        <mesh position={[1.9, 0, 0]} material={goldMaterial} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.4, 32]} />
        </mesh>
        
        {/* Main Handle/Bar - Extended to reach new plate positions */}
        <mesh material={handleMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 6.0, 32]} />
        </mesh>
        
        {/* Handle Grips */}
        <mesh position={[-0.9, 0, 0]} material={blackMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.8, 32]} />
        </mesh>
        <mesh position={[0.9, 0, 0]} material={blackMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.8, 32]} />
        </mesh>
        
        {/* Collar clamps to secure weights */}
        <mesh position={[-1.6, 0, 0]} material={goldMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 32]} />
        </mesh>
        <mesh position={[1.6, 0, 0]} material={goldMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 32]} />
        </mesh>
      </group>
    </Float>
  );
};

// Main Hero 3D Component
export const Hero3DDumbbell: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute right-2 md:right-8 lg:right-16 top-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 opacity-30 md:opacity-40 lg:opacity-50">
      <Canvas
        camera={{ 
          position: [0, 0, 9], 
          fov: 45,
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        shadows
      >
        {/* Enhanced Lighting Setup */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[15, 15, 8]} 
          intensity={2} 
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-8, -8, -8]} intensity={0.6} color="#DAA520" />
        <spotLight 
          position={[0, 12, 0]} 
          angle={0.4} 
          penumbra={1.2} 
          intensity={1.5} 
          castShadow 
          color="#ffffff"
        />
        
        {/* Environment for realistic reflections */}
        <Environment preset="studio" />
        
        {/* 3D Dumbbell */}
        <Dumbbell />
      </Canvas>
      </div>
    </div>
  );
};