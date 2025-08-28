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

  // Create materials with enhanced visuals for better 3D appearance
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFD700',
    metalness: 0.95,
    roughness: 0.1,
    envMapIntensity: 2.5,
    emissive: '#332200',
    emissiveIntensity: 0.05,
  }), []);

  const blackMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a0a0a',
    metalness: 0.7,
    roughness: 0.4,
    envMapIntensity: 1.5,
    emissive: '#000000',
    emissiveIntensity: 0.02,
  }), []);

  const handleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#C0C0C0',
    metalness: 0.98,
    roughness: 0.02,
    envMapIntensity: 3,
    emissive: '#111111',
    emissiveIntensity: 0.03,
  }), []);

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={dumbbellRef} scale={[1.2, 1.2, 1.2]} rotation={[0.2, 0.3, 0]}>
        {/* Left Weight Bell - Proper 3D spherical weight */}
        <group position={[-2.5, 0, 0]}>
          {/* Main weight sphere */}
          <mesh material={goldMaterial} castShadow receiveShadow>
            <sphereGeometry args={[1.2, 32, 32]} />
          </mesh>
          {/* Weight details - hexagonal pattern */}
          <mesh position={[0, 0, 1.21]} material={blackMaterial} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.02, 6]} />
          </mesh>
          <mesh position={[0, 0, -1.21]} material={blackMaterial} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.02, 6]} />
          </mesh>
          {/* Weight number marking */}
          <mesh position={[1.21, 0, 0]} material={blackMaterial} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 8]} />
          </mesh>
        </group>
        
        {/* Right Weight Bell - Proper 3D spherical weight */}
        <group position={[2.5, 0, 0]}>
          {/* Main weight sphere */}
          <mesh material={goldMaterial} castShadow receiveShadow>
            <sphereGeometry args={[1.2, 32, 32]} />
          </mesh>
          {/* Weight details - hexagonal pattern */}
          <mesh position={[0, 0, 1.21]} material={blackMaterial} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.02, 6]} />
          </mesh>
          <mesh position={[0, 0, -1.21]} material={blackMaterial} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.02, 6]} />
          </mesh>
          {/* Weight number marking */}
          <mesh position={[-1.21, 0, 0]} material={blackMaterial} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 8]} />
          </mesh>
        </group>
        
        {/* Main Handle/Bar - Horizontal orientation */}
        <mesh material={handleMaterial} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.08, 5.0, 32]} />
        </mesh>
        
        {/* Handle Grip Section - Textured for realism */}
        <mesh material={blackMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 2.0, 32]} />
        </mesh>
        
        {/* Handle grip texture rings */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh 
            key={i} 
            position={[(-0.8 + (i * 0.2)), 0, 0]} 
            material={handleMaterial} 
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.125, 0.125, 0.05, 32]} />
          </mesh>
        ))}
        
        {/* Connection joints between handle and weights */}
        <mesh position={[-1.3, 0, 0]} material={handleMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.15, 0.08, 0.4, 32]} />
        </mesh>
        <mesh position={[1.3, 0, 0]} material={handleMaterial} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.15, 0.08, 0.4, 32]} />
        </mesh>
        
        {/* End caps for professional look */}
        <mesh position={[-1.5, 0, 0]} material={goldMaterial} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
        </mesh>
        <mesh position={[1.5, 0, 0]} material={goldMaterial} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
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
        {/* Enhanced Lighting Setup for 3D depth */}
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5} 
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-5, 5, 3]} intensity={0.8} color="#FFD700" />
        <pointLight position={[5, -3, -2]} intensity={0.6} color="#87CEEB" />
        <spotLight 
          position={[0, 8, 0]} 
          angle={0.6} 
          penumbra={1} 
          intensity={1.2} 
          castShadow 
          color="#ffffff"
          shadow-mapSize={[1024, 1024]}
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