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
      <group ref={dumbbellRef} scale={[2, 2, 2]} rotation={[0.1, 0.2, 0]}>
        <primitive object={scene} />
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