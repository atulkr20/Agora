import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = ['#FF6B6B', '#FFE500', '#00F5D4', '#B65FCF', '#FF9F1C', '#2EC4B6', '#FFFFFF']

/* ── Single voxel (box) ─────────────────────────────────────────────── */
function Voxel({ position, color, delay = 0 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + delay
    ref.current.position.y = position[1] + Math.sin(t * 0.9 + delay) * 0.12
  })
  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[0.82, 0.82, 0.82]} />
      <meshStandardMaterial
        color={color}
        roughness={0.0}
        metalness={0.0}
        emissive={color}
        emissiveIntensity={0.25}
      />
    </mesh>
  )
}

/* ── The full voxel structure ───────────────────────────────────────── */
function VoxelStructure() {
  const group = useRef()

  // Build a pixel-art style "chart going up" shape using a grid of voxels
  const voxels = useMemo(() => {
    const out = []
    // 8×8 pixel pattern — mimics a rising bar chart / crypto logo feel
    const pattern = [
      [0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1,1],
      [0,0,1,0,1,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
    ]
    const colorColumns = [
      '#FF6B6B','#FF6B6B','#FFE500','#FFE500','#00F5D4','#00F5D4','#B65FCF','#B65FCF'
    ]
    const W = 8, H = 8
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        if (!pattern[row][col]) continue
        out.push({
          x: (col - W / 2 + 0.5) * 1.0,
          y: ((H - 1 - row) - H / 2 + 0.5) * 1.0,
          z: 0,
          color: colorColumns[col],
          delay: col * 0.3 + row * 0.15,
        })
      }
    }

    // Second layer — depth stack behind for 3D effect
    for (let row = 2; row < H; row++) {
      for (let col = 3; col < W; col++) {
        if (!pattern[row][col]) continue
        out.push({
          x: (col - W / 2 + 0.5) * 1.0,
          y: ((H - 1 - row) - H / 2 + 0.5) * 1.0,
          z: -1.0,
          color: colorColumns[col],
          delay: col * 0.2 + row * 0.1 + 1.5,
        })
      }
    }
    return out
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.2) * 0.35
    group.current.rotation.x = Math.sin(t * 0.15) * 0.12
  })

  return (
    <group ref={group}>
      {voxels.map((v, i) => (
        <Voxel key={i} position={[v.x, v.y, v.z]} color={v.color} delay={v.delay} />
      ))}
    </group>
  )
}

/* ── Floating mini cubes in background ──────────────────────────────── */
function FloatingCubes({ count = 22 }) {
  const cubes = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      pos: [
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10,
        -3 - Math.random() * 4,
      ],
      color: COLORS[i % COLORS.length],
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      size: 0.15 + Math.random() * 0.25,
    }))
  , [count])

  const refs = useRef([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      const c = cubes[i]
      mesh.position.y = c.pos[1] + Math.sin(t * c.speed + c.phase) * 0.4
      mesh.rotation.x = t * c.speed * 0.7
      mesh.rotation.y = t * c.speed * 0.5
    })
  })

  return (
    <>
      {cubes.map((c, i) => (
        <mesh key={i} ref={el => refs.current[i] = el} position={c.pos}>
          <boxGeometry args={[c.size, c.size, c.size]} />
          <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={0.3} roughness={0.1} />
        </mesh>
      ))}
    </>
  )
}

/* ── Pixel grid floor ───────────────────────────────────────────────── */
function PixelGrid() {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const verts = []
    const size = 10, step = 1
    for (let x = -size; x <= size; x += step) {
      verts.push(x, -4, -size, x, -4, size)
    }
    for (let z = -size; z <= size; z += step) {
      verts.push(-size, -4, z, size, -4, z)
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
    return g
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.z = (clock.elapsedTime * 0.4) % 1
  })

  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial color="#333333" transparent opacity={0.6} />
    </lineSegments>
  )
}

/* ── Main export ────────────────────────────────────────────────────── */
export default function VoxelScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#111111']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]}  intensity={2.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -3]} intensity={1.0} color="#B65FCF" />
      <pointLight position={[0, -3, 4]} intensity={1.5} color="#FFE500" />

      <PixelGrid />
      <FloatingCubes />
      <VoxelStructure />
    </Canvas>
  )
}
