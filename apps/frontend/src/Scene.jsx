import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ── Floating particles ───────────────────────────────────────────── */
function Particles({ count = 140 }) {
  const ref = useRef()
  const geoRef = useRef()

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#3b82f6'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#10b981'),
    ]
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 11
      positions[i * 3 + 1] = (Math.random() - 0.5) * 11
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [count])

  useEffect(() => {
    if (!geoRef.current) return
    geoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geoRef.current.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
  }, [positions, colors])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.04
    ref.current.rotation.x = clock.elapsedTime * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

/* ── Network graph (sphere of nodes + edges) ──────────────────────── */
function NetworkGraph() {
  const group = useRef()

  const nodes = useMemo(() => (
    Array.from({ length: 18 }, (_, i) => {
      const phi   = Math.acos(-1 + (2 * i) / 18)
      const theta = Math.sqrt(18 * Math.PI) * phi
      return new THREE.Vector3(
        2.6 * Math.sin(phi) * Math.cos(theta),
        2.6 * Math.sin(phi) * Math.sin(theta),
        2.6 * Math.cos(phi)
      )
    })
  ), [])

  const edges = useMemo(() => {
    const out = []
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++)
        if (nodes[i].distanceTo(nodes[j]) < 2.8)
          out.push([nodes[i], nodes[j]])
    return out
  }, [nodes])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.y = t * 0.18
    group.current.rotation.x = Math.sin(t * 0.12) * 0.25
  })

  const nodeColors = ['#3b82f6','#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b']

  return (
    <group ref={group}>
      {/* Central core */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#6366f1" emissive="#4338ca" emissiveIntensity={2} roughness={0.1} metalness={0.6} />
      </mesh>

      {/* Outer nodes */}
      {nodes.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.09 + (i % 3) * 0.04, 16, 16]} />
          <meshStandardMaterial
            color={nodeColors[i % nodeColors.length]}
            emissive={nodeColors[i % nodeColors.length]}
            emissiveIntensity={0.9}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* Connecting edges as cylinders */}
      {edges.map(([a, b], i) => {
        const mid  = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
        const dir  = new THREE.Vector3().subVectors(b, a)
        const len  = dir.length()
        const quat = new THREE.Quaternion()
        quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
        return (
          <mesh key={i} position={[mid.x, mid.y, mid.z]} quaternion={quat}>
            <cylinderGeometry args={[0.007, 0.007, len, 4]} />
            <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={0.5} transparent opacity={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ── Orbiting rings ───────────────────────────────────────────────── */
function Rings() {
  const r1 = useRef(), r2 = useRef(), r3 = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (r1.current) { r1.current.rotation.z = t * 0.22 }
    if (r2.current) { r2.current.rotation.x = t * 0.15; r2.current.rotation.y = t * 0.10 }
    if (r3.current) { r3.current.rotation.y = t * 0.28; r3.current.rotation.z = t * 0.08 }
  })

  return (
    <>
      <mesh ref={r1}>
        <torusGeometry args={[3.5, 0.018, 8, 128]} />
        <meshStandardMaterial color="#6366f1" emissive="#4338ca" emissiveIntensity={1.0} transparent opacity={0.55} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[2.9, 0.012, 8, 128]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.9} transparent opacity={0.4} />
      </mesh>
      <mesh ref={r3}>
        <torusGeometry args={[4.2, 0.010, 8, 128]} />
        <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.7} transparent opacity={0.3} />
      </mesh>
    </>
  )
}

/* ── Main scene export ────────────────────────────────────────────── */
export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 6, 6]}    intensity={3} color="#6366f1" />
      <pointLight position={[-6, -4, -6]} intensity={2} color="#3b82f6" />
      <pointLight position={[0, 6, -5]}   intensity={1.2} color="#8b5cf6" />

      <Particles />
      <NetworkGraph />
      <Rings />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        maxPolarAngle={Math.PI * 0.75}
        minPolarAngle={Math.PI * 0.25}
        rotateSpeed={0.5}
      />
    </Canvas>
  )
}
