import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * 3D animated battery cell — cylindrical tank that fills/drains with SOC %.
 * Pulsing glow effect based on charging state.
 */
export default function BatteryTank3D({ soc = 80, mode = 'idle' }) {
  const fillRef = useRef();
  const glowRef = useRef();
  const time = useRef(0);

  const fillHeight = (soc / 100) * 2.4;
  const fillColor = soc < 15 ? '#ff2244'
                  : soc < 30 ? '#ffaa00'
                  : mode === 'charging' ? '#00aaff'
                  : '#00ff88';

  useFrame((_, delta) => {
    time.current += delta;
    if (glowRef.current) {
      const pulse = mode === 'charging'
        ? 1.5 + Math.sin(time.current * 4) * 0.8
        : 0.5 + Math.sin(time.current * 1.5) * 0.3;
      glowRef.current.intensity = pulse;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer shell */}
      <mesh>
        <cylinderGeometry args={[0.7, 0.7, 2.6, 32, 1, true]} />
        <meshStandardMaterial color="#1a2a4a" metalness={0.9} roughness={0.1} transparent opacity={0.4} side={2} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 32]} />
        <meshStandardMaterial color="#2a3a5a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Bottom cap */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 32]} />
        <meshStandardMaterial color="#2a3a5a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Fill level */}
      <mesh ref={fillRef} position={[0, -1.2 + fillHeight / 2, 0]}>
        <cylinderGeometry args={[0.62, 0.62, Math.max(0.01, fillHeight), 32]} />
        <meshStandardMaterial color={fillColor} emissive={fillColor} emissiveIntensity={0.4} transparent opacity={0.85} />
      </mesh>
      {/* Glow light */}
      <pointLight ref={glowRef} position={[0, 0, 0]} color={fillColor} intensity={1} distance={3} />
      {/* Percentage rings */}
      {[25, 50, 75].map(pct => (
        <mesh key={pct} position={[0, -1.2 + (pct / 100) * 2.4, 0]}>
          <torusGeometry args={[0.68, 0.015, 8, 32]} />
          <meshStandardMaterial color="#334466" emissive="#334466" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
