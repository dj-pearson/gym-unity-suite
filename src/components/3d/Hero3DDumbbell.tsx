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

  // Create materials with clean, professional appearance
  const weightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2c3e50',
    metalness: 0.6,
    roughness: 0.2,
    envMapIntensity: 1.5,
  }), []);

  const handleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#34495e',
    metalness: 0.8,
    roughness: 0.1,
    envMapIntensity: 2,
  }), []);

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={dumbbellRef} scale={[1.8, 1.8, 1.8]} rotation={[0.1, 0.2, 0]}>
        {/* Left Weight - Simple cylinder */}
        <mesh position={[-2.2, 0, 0]} material={weightMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 0.8, 32]} />
        </mesh>
        
        {/* Right Weight - Simple cylinder */}
        <mesh position={[2.2, 0, 0]} material={weightMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 0.8, 32]} />
        </mesh>
        
        {/* Main Handle/Bar */}
        <mesh material={handleMaterial} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.08, 4.4, 32]} />
        </mesh>
        
        {/* Handle Grip */}
        <mesh material={handleMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.5, 32]} />
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
          position: [4, 2, 6], 
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          shadowMap: {
            enabled: true,
            type: THREE.PCFSoftShadowMap,
          },
        }}
        shadows="soft"
      >
        {/* Clean professional lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Simple environment */}
        <Environment preset="sunset" />
        
        {/* 3D Dumbbell */}
        <Dumbbell />
      </Canvas>
      </div>
    </div>
  );
};