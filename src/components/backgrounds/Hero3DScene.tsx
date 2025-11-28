import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function FloatingGeometries() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation of the entire group
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  // Create some random positions for "modules"
  const modules = useMemo(() => {
    return new Array(5).fill(0).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 5 - 2 // Push them back a bit
      ] as [number, number, number],
      scale: Math.random() * 0.5 + 0.5,
      type: i % 2 === 0 ? 'icosahedron' : 'torus'
    }));
  }, []);

  return (
    <group ref={groupRef}>
      {modules.map((mod, i) => (
        <Float 
          key={i} 
          speed={1.5} 
          rotationIntensity={1} 
          floatIntensity={2} 
          position={mod.position}
        >
          <mesh scale={mod.scale}>
            {mod.type === 'icosahedron' ? (
              <icosahedronGeometry args={[1, 0]} />
            ) : (
              <torusGeometry args={[0.8, 0.2, 16, 32]} />
            )}
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#4f46e5" : "#0ea5e9"} // Primary/Secondary colors
              roughness={0.2}
              metalness={0.8}
              emissive={i % 2 === 0 ? "#4f46e5" : "#0ea5e9"}
              emissiveIntensity={0.2}
              wireframe={false}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Central "Core" Module */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0, 0]} scale={1.5}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color="#ffffff" 
            roughness={0.1} 
            metalness={0.9} 
            wireframe 
          />
        </mesh>
      </Float>
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    // Smooth camera movement based on mouse position
    state.camera.position.lerp(
      new THREE.Vector3(state.pointer.x * 2, state.pointer.y * 2, 10),
      0.05
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Hero3DScene() {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-gradient-to-b from-slate-950 to-slate-900">
      <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#0ea5e9" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <FloatingGeometries />
        <CameraRig />
      </Canvas>
      
      {/* Overlay gradient to blend with content */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
