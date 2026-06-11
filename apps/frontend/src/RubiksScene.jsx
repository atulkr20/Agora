import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Float } from '@react-three/drei'

// ── THE MAGNETIC CONSTELLATION ───────────────────────────────────────
// We removed all the aggressive meteors. This scene focuses on the 
// requested Yellow Core, surrounded by a highly subtle, smooth, and 
// and gracefully curving tethers that orbit in perfect tranquility.

const NUM_NODES = 80;

function OrbitingNode({ angle, radius, speed, heightOffset, color }) {
  const groupRef = useRef()
  const lineRef = useRef()
  const packetRef = useRef()
  
  const { curve } = useMemo(() => {
    return { curve: new THREE.QuadraticBezierCurve3() }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    
    const x = Math.cos(t + angle) * radius;
    const z = Math.sin(t + angle) * radius;
    const y = heightOffset + Math.sin(t * 1.5 + angle) * 1.5;
    
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
    }
    
    if (lineRef.current) {
      const start = new THREE.Vector3(x, y, z);
      const end = new THREE.Vector3(0, 0, 0); 
      
      const swayX = Math.sin(state.clock.elapsedTime * 1.5 + angle) * 1.5;
      const swayZ = Math.cos(state.clock.elapsedTime * 2.0 + angle) * 1.5;
      
      // Beautiful, sweeping arc downwards like a magnetic field line
      const mid = new THREE.Vector3(x * 0.5 + swayX, y * 0.5 - 2.0, z * 0.5 + swayZ);
      
      curve.v0.copy(start);
      curve.v1.copy(mid);
      curve.v2.copy(end);
      
      lineRef.current.geometry.setFromPoints(curve.getPoints(20));
    }

    // A tiny pulse of light traveling along the line to show energy drawing into the core
    if (packetRef.current && curve.v0) {
      const packetSpeed = 0.4; 
      // Travel from 0 to 1 (from outer node into the cube)
      const packetProgress = (state.clock.elapsedTime * packetSpeed + angle) % 1.0;
      
      const point = curve.getPointAt(packetProgress);
      packetRef.current.position.copy(point);
      
      // Fade in smoothly and flash as it gets sucked into the energy source
      const fade = Math.sin(packetProgress * Math.PI);
      packetRef.current.material.opacity = fade * 0.9;
    }
  })

  return (
    <group>
      {/* The outer hovering data node */}
      <mesh ref={groupRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* The beautiful thin lines drawing power into the core */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color={color} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </line>

      {/* Energy pulse traveling along the line */}
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function LiquidParticleAura() {
  const pointsRef = useRef()
  
  // We use a high-density sphere of tiny points instead of a wireframe. 
  // This creates a much softer, deeply appealing "stardust" ghost-shell.
  const geometry = useMemo(() => new THREE.SphereGeometry(3.5, 64, 64), [])
  const basePositions = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])

  useFrame((state) => {
    if (!pointsRef.current) return
    const t = state.clock.elapsedTime * 0.2; // Glacial, tranquil speed
    
    const posAttribute = pointsRef.current.geometry.attributes.position;
    const positions = posAttribute.array;
    
    // Massive, slow-rolling sine waves passing through the stardust
    for (let i = 0; i < positions.length; i += 3) {
      const x = basePositions[i];
      const y = basePositions[i + 1];
      const z = basePositions[i + 2];
      
      // Wavelength increased significantly (0.4) so the ripples are huge and elegant, not chaotic
      const wave = Math.sin(x * 0.4 + t) * Math.cos(y * 0.4 + t) * Math.sin(z * 0.4 + t);
      
      // Extremely subtle displacement (only 3% expansion)
      const displacement = 1.0 + wave * 0.03;
      
      positions[i] = x * displacement;
      positions[i + 1] = y * displacement;
      positions[i + 2] = z * displacement;
    }
    
    posAttribute.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.1;
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial 
        size={0.015} 
        color="#FFE500" 
        transparent 
        opacity={0.25} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  )
}

function TheYellowCore() {
  const coreRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.15
      coreRef.current.rotation.x = t * 0.08
      
      // Faster pulse to simulate a beating energy heart
      const pulse = 1.0 + Math.sin(t * 3.0) * 0.02
      coreRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[2.5, 1]} />
        <meshBasicMaterial color="#FFE500" wireframe={true} transparent opacity={0.8} />
        <mesh>
          <icosahedronGeometry args={[2.45, 1]} />
          <meshBasicMaterial color="#05050A" />
        </mesh>
      </mesh>

      {/* Intense Energy Source Glow */}
      <mesh>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial color="#FFE500" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      
      {/* Outer softer halo */}
      <mesh>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial color="#FF007A" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <LiquidParticleAura />
    </group>
  )
}

function TheDataNetwork() {
  const nodes = useMemo(() => {
    const arr = []
    const colors = ['#00F5D4', '#FF007A', '#9D4EDD', '#ffffff'] 
    
    for(let i=0; i < NUM_NODES; i++) {
      const angle = (i / NUM_NODES) * Math.PI * 2 + Math.random();
      const radius = 8 + Math.random() * 12; // Spread smoothly from the center out to deep space
      const speed = 0.02 + Math.random() * 0.04; // Extremely slow, tranquil orbit
      const heightOffset = (Math.random() - 0.5) * 18; // Vertical spread
      const color = colors[i % colors.length];
      
      arr.push({ angle, radius, speed, heightOffset, color })
    }
    return arr
  }, [])

  return (
    <group>
      {nodes.map((n, i) => (
        <OrbitingNode key={i} angle={n.angle} radius={n.radius} speed={n.speed} heightOffset={n.heightOffset} color={n.color} />
      ))}
    </group>
  )
}

function AmbientWrapper() {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      // Cinematic, microscopic rotation of the entire ambient network
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <TheYellowCore />
      <TheDataNetwork />
    </group>
  )
}

export default function RubiksScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 28], fov: 40 }} 
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#05050A']} /> 
      <fog attach="fog" args={['#05050A', 15, 45]} />

      <group position={[0, -1.0, 0]}>
        {/* Soft, beautiful floating motion to give the entire scene a liquid feel */}
        <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.3}>
          <AmbientWrapper />
        </Float>
      </group>
    </Canvas>
  )
}
