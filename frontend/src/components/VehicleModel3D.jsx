import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Low-poly procedural EV car built from Three.js primitives.
 * Color changes based on battery status.
 */
export default function VehicleModel3D({ soc = 80, mode = 'idle' }) {
  const groupRef = useRef();
  const wheelRefs = [useRef(), useRef(), useRef(), useRef()];

  const bodyColor = soc < 15 ? '#ff2244'
                  : soc < 30 ? '#ffaa00'
                  : mode === 'charging' ? '#00aaff'
                  : '#00ff88';

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (mode === 'driving' ? 0.8 : 0.3);
    }
    if (mode === 'driving') {
      wheelRefs.forEach(r => {
        if (r.current) r.current.rotation.x += delta * 5;
      });
    }
  });

  const wheelPositions = [
    [-0.85, -0.25, 0.7], [0.85, -0.25, 0.7],
    [-0.85, -0.25, -0.7], [0.85, -0.25, -0.7],
  ];

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.5, 1.1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.42, 0.05]}>
        <boxGeometry args={[1.3, 0.45, 0.9]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0.55, 0.42, 0.05]}>
        <boxGeometry args={[0.05, 0.4, 0.85]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.6} />
      </mesh>
      {/* Headlights */}
      {[-0.45, 0.45].map((z, i) => (
        <mesh key={i} position={[1.1, 0.05, z]}>
          <boxGeometry args={[0.05, 0.12, 0.18]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={mode === 'driving' ? 2 : 0.3} />
        </mesh>
      ))}
      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <mesh key={i} ref={wheelRefs[i]} position={pos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 16]} />
          <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* Charging glow when plugged in */}
      {mode === 'charging' && (
        <pointLight position={[0, 0.5, 0]} color="#00aaff" intensity={2} distance={3} />
      )}
      {/* Emergency pulse */}
      {soc < 15 && (
        <pointLight position={[0, 1, 0]} color="#ff2244" intensity={3} distance={4} />
      )}
    </group>
  );
}
