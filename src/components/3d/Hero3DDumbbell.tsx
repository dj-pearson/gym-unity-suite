import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 3D Dumbbell Component using GLB model
const Dumbbell = () => {
  const dumbbellRef = useRef<THREE.Group>(null);
  
  // Load the GLB model
  const { scene } = useGLTF('/models/dumbbells.glb');
  
  useFrame((state) => {
    if (dumbbellRef.current) {
      // Smooth rotation animation
      dumbbellRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      dumbbellRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      dumbbellRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={dumbbellRef} scale={[0.05, 0.05, 0.05]} rotation={[0.1, 0.2, 0]}>
        <primitive object={scene} />
      </group>
    </Float>
  );
};

// Main Hero 3D Component
export const Hero3DDumbbell: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute right-0 top-0 w-full h-full md:w-3/4 lg:w-2/3 opacity-20 md:opacity-25 lg:opacity-30">
      <Canvas
        camera={{ 
          position: [15, 8, 90], 
          fov: 35,
          near: 0.1,
          far: 1000,
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows
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

// Preload the GLB model for better performance
useGLTF.preload('/models/dumbbells.glb');