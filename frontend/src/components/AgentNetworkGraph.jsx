import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AGENTS = [
  { id: 'battery', label: 'Battery', angle: 0 },
  { id: 'route', label: 'Route', angle: Math.PI / 3 },
  { id: 'charging', label: 'Charging', angle: (2 * Math.PI) / 3 },
  { id: 'emergency', label: 'Emergency', angle: Math.PI },
  { id: 'energy', label: 'Energy', angle: (4 * Math.PI) / 3 },
  { id: 'pricing', label: 'Pricing', angle: (5 * Math.PI) / 3 },
  { id: 'analytics', label: 'Analytics', angle: (11 * Math.PI) / 6 },
];

const RADIUS = 2.8;

function AgentNode({ agent, isActive, position }) {
  const meshRef = useRef();
  const lightRef = useRef();
  const time = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    time.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      const scale = isActive ? 1.3 + Math.sin(time.current * 6) * 0.15 : 1.0;
      meshRef.current.scale.setScalar(scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = isActive ? 2 + Math.sin(time.current * 8) * 1 : 0.4;
    }
  });

  const color = isActive ? '#00f5ff' : '#334466';
  const emissive = isActive ? '#00f5ff' : '#112233';

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={isActive ? 1.5 : 0.3} metalness={0.8} roughness={0.2} />
      </mesh>
      <pointLight ref={lightRef} color={isActive ? '#00f5ff' : '#334466'} intensity={0.4} distance={1.5} />
    </group>
  );
}

function PulseLine({ start, end, isActive }) {
  const ref = useRef();
  const time = useRef(Math.random() * Math.PI * 2);

  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  useFrame((_, delta) => {
    time.current += delta;
    if (ref.current) {
      ref.current.material.opacity = isActive
        ? 0.4 + Math.sin(time.current * 8) * 0.4
        : 0.08;
      ref.current.material.color.set(isActive ? '#00f5ff' : '#223355');
    }
  });

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial transparent opacity={0.08} color="#223355" />
    </line>
  );
}

/**
 * 3D Agent Network Graph — visual centerpiece of the Agent Collaboration Console.
 * Shows 8 agents as glowing nodes connected to central Supervisor node.
 * Active agents pulse with neon cyan light.
 */
export default function AgentNetworkGraph({ activeAgents = [], agentResults = {} }) {
  const supervisorRef = useRef();
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    if (supervisorRef.current) {
      supervisorRef.current.rotation.y += delta * 0.4;
      supervisorRef.current.rotation.x = Math.sin(time.current * 0.5) * 0.1;
    }
  });

  const agentPositions = AGENTS.map(a => [
    Math.cos(a.angle) * RADIUS,
    Math.sin(a.angle) * 0.8,
    Math.sin(a.angle) * RADIUS,
  ]);

  return (
    <group>
      {/* Central Supervisor node */}
      <group ref={supervisorRef} position={[0, 0, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial color="#bf00ff" emissive="#bf00ff" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} />
        </mesh>
        <pointLight color="#bf00ff" intensity={2} distance={4} />
      </group>

      {/* Agent nodes + connection lines */}
      {AGENTS.map((agent, i) => {
        const isActive = activeAgents.includes(agent.id);
        const pos = agentPositions[i];
        return (
          <group key={agent.id}>
            <AgentNode agent={agent} isActive={isActive} position={pos} />
            <PulseLine start={[0, 0, 0]} end={pos} isActive={isActive} />
          </group>
        );
      })}

      {/* Ambient ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS, 0.02, 8, 64]} />
        <meshStandardMaterial color="#1a2a4a" emissive="#1a2a4a" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export { AGENTS };
