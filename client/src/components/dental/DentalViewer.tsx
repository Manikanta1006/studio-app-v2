'use client'

import { useEffect, useMemo, useRef, useState, MouseEvent } from 'react'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  ToothData,
  defaultLowerTeeth,
  defaultUpperTeeth,
  useDentalStore,
} from '@/store/dental-store'

type ToothKind = 'molar' | 'premolar' | 'canine' | 'incisor'
type Jaw = 'upper' | 'lower'

interface ToothDimensions {
  width: number
  height: number
  depth: number
  rootLength: number
  rootRadius: number
}

const molarNumbers = new Set(['1', '2', '3', '14', '15', '16', '17', '18', '19', '30', '31', '32'])
const premolarNumbers = new Set(['4', '5', '12', '13', '20', '21', '28', '29'])
const canineNumbers = new Set(['6', '11', '22', '27'])
const centralIncisorNumbers = new Set(['8', '9', '24', '25'])

function getJaw(number: string): Jaw {
  return Number(number) <= 16 ? 'upper' : 'lower'
}

function getToothKind(number: string): ToothKind {
  if (molarNumbers.has(number)) {
    return 'molar'
  }

  if (premolarNumbers.has(number)) {
    return 'premolar'
  }

  if (canineNumbers.has(number)) {
    return 'canine'
  }

  return 'incisor'
}

function getToothDimensions(number: string, jaw: Jaw): ToothDimensions {
  const kind = getToothKind(number)
  const isCentralIncisor = centralIncisorNumbers.has(number)
  const lowerScale = jaw === 'lower' ? 0.94 : 1

  if (kind === 'molar') {
    return {
      width: 0.78 * lowerScale,
      height: 0.78 * lowerScale,
      depth: 0.88 * lowerScale,
      rootLength: 0.72,
      rootRadius: 0.12,
    }
  }

  if (kind === 'premolar') {
    return {
      width: 0.54 * lowerScale,
      height: 0.9 * lowerScale,
      depth: 0.64 * lowerScale,
      rootLength: 0.74,
      rootRadius: 0.1,
    }
  }

  if (kind === 'canine') {
    return {
      width: 0.46 * lowerScale,
      height: 1.02 * lowerScale,
      depth: 0.54 * lowerScale,
      rootLength: 0.88,
      rootRadius: 0.09,
    }
  }

  return {
    width: (isCentralIncisor ? 0.58 : 0.46) * lowerScale,
    height: (isCentralIncisor ? 1.02 : 0.92) * lowerScale,
    depth: (isCentralIncisor ? 0.44 : 0.38) * lowerScale,
    rootLength: 0.72,
    rootRadius: 0.08,
  }
}

function createCrownGeometry(number: string, jaw: Jaw) {
  const kind = getToothKind(number)
  const { width, height, depth } = getToothDimensions(number, jaw)
  const geometry = new THREE.SphereGeometry(1, 32, 28)
  const positions = geometry.attributes.position
  const twist = Number(number) % 2 === 0 ? 1 : -1

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const y = positions.getY(index)
    const z = positions.getZ(index)
    const neckTaper = THREE.MathUtils.mapLinear(y, -1, 1, 0.68, 1.04)
    const cuspInfluence = Math.max(y, 0)
    const cervicalInfluence = Math.max(-y, 0)

    let scaledX = x * width * neckTaper
    let scaledY = y * height
    let scaledZ = z * depth * (0.78 + cuspInfluence * 0.18)

    if (kind === 'molar') {
      scaledY += Math.sin((x + z * 0.6) * 4.2) * 0.035 * cuspInfluence
      scaledX *= 1.1 - cervicalInfluence * 0.08
      scaledZ *= 1.05 - cervicalInfluence * 0.06
    } else if (kind === 'premolar') {
      scaledY += Math.cos(x * 5.8) * 0.045 * cuspInfluence
      scaledZ *= 0.94
    } else if (kind === 'canine') {
      scaledY += cuspInfluence * 0.18
      scaledX *= 0.92 - cuspInfluence * 0.05
      scaledZ *= 0.82
    } else {
      scaledY += cuspInfluence * 0.08
      scaledX *= centralIncisorNumbers.has(number) ? 1.08 : 0.96
      scaledZ *= 0.76
    }

    scaledY -= cervicalInfluence * 0.08
    scaledZ += twist * x * 0.025

    positions.setXYZ(index, scaledX, scaledY, scaledZ)
  }

  geometry.computeVertexNormals()
  return geometry
}

function createRootTransforms(number: string, jaw: Jaw, dimensions: ToothDimensions) {
  const kind = getToothKind(number)
  const direction = jaw === 'upper' ? 1 : -1
  const baseOffset = direction * (dimensions.height * 0.42 + dimensions.rootLength * 0.32)

  if (kind === 'molar') {
    const offsets =
      jaw === 'upper'
        ? [
            [-0.19, baseOffset, 0.06],
            [0.19, baseOffset, 0.06],
            [0, baseOffset, -0.15],
          ]
        : [
            [-0.16, baseOffset, 0],
            [0.16, baseOffset, 0],
          ]

    return offsets.map(([x, y, z]) => ({
      position: [x, y, z] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    }))
  }

  if (kind === 'premolar') {
    const offsets =
      jaw === 'upper'
        ? [
            [-0.09, baseOffset, 0],
            [0.09, baseOffset, -0.02],
          ]
        : [[0, baseOffset, 0]]

    return offsets.map(([x, y, z]) => ({
      position: [x, y, z] as [number, number, number],
      scale: [0.9, 1, 0.9] as [number, number, number],
    }))
  }

  return [
    {
      position: [0, baseOffset, 0] as [number, number, number],
      scale: [0.82, 1, 0.82] as [number, number, number],
    },
  ]
}

function getIncisalTilt(number: string, jaw: Jaw) {
  const kind = getToothKind(number)

  if (kind === 'molar') {
    return jaw === 'upper' ? -0.04 : 0.04
  }

  if (kind === 'premolar') {
    return jaw === 'upper' ? -0.08 : 0.08
  }

  if (kind === 'canine') {
    return jaw === 'upper' ? -0.1 : 0.1
  }

  return jaw === 'upper' ? -0.14 : 0.14
}

function ToothMesh({
  tooth,
  isSelected,
  onClick,
  movement,
}: {
  tooth: ToothData
  isSelected: boolean
  onClick: () => void
  movement?: {
    rotation: number
    translationX: number
    translationY: number
    translationZ: number
  }
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const jaw = getJaw(tooth.number)

  const position = useMemo<[number, number, number]>(() => {
    return [
      tooth.position.x + (movement?.translationX ?? 0),
      tooth.position.y + (movement?.translationY ?? 0),
      tooth.position.z + (movement?.translationZ ?? 0),
    ]
  }, [movement, tooth.position.x, tooth.position.y, tooth.position.z])

  const rotation = useMemo<[number, number, number]>(() => {
    return [
      getIncisalTilt(tooth.number, jaw),
      THREE.MathUtils.degToRad(tooth.rotation + (movement?.rotation ?? 0)),
      0,
    ]
  }, [jaw, movement?.rotation, tooth.number, tooth.rotation])

  const dimensions = useMemo(() => getToothDimensions(tooth.number, jaw), [jaw, tooth.number])
  const crownGeometry = useMemo(() => createCrownGeometry(tooth.number, jaw), [jaw, tooth.number])
  const rootTransforms = useMemo(
    () => createRootTransforms(tooth.number, jaw, dimensions),
    [dimensions, jaw, tooth.number]
  )

  const crownMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: isSelected ? '#c7fdff' : hovered ? '#f4f0ec' : '#f6f3ef',
        emissive: isSelected ? '#26d6df' : '#000000',
        emissiveIntensity: isSelected ? 0.12 : 0,
        roughness: 0.2,
        metalness: 0,
        clearcoat: 0.9,
        clearcoatRoughness: 0.25,
      }),
    [hovered, isSelected]
  )

  const rootMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f4d8cf',
        roughness: 0.65,
        transparent: true,
        opacity: 0.35,
      }),
    []
  )

  useFrame(() => {
    if (!groupRef.current) {
      return
    }

    const targetScale = hovered || isSelected ? 1.04 : 1
    const nextScale = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.18)
    groupRef.current.scale.setScalar(nextScale)
  })

  const crownOffset = jaw === 'upper' ? -dimensions.height * 0.16 : dimensions.height * 0.16

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {rootTransforms.map((root, index) => (
        <mesh
          key={`${tooth.number}-root-${index}`}
          position={root.position}
          scale={root.scale}
          material={rootMaterial}
        >
          <cylinderGeometry
            args={[dimensions.rootRadius * 0.6, dimensions.rootRadius, dimensions.rootLength, 10]}
          />
        </mesh>
      ))}

      <mesh
        geometry={crownGeometry}
        material={crownMaterial}
        position={[0, crownOffset, 0]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onClick()
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      />

      {isSelected && (
        <mesh position={[0, jaw === 'upper' ? -0.95 : 0.95, 0]}>
          <torusGeometry args={[0.22, 0.025, 12, 32]} />
          <meshStandardMaterial color="#1bdde7" emissive="#1bdde7" emissiveIntensity={0.55} />
        </mesh>
      )}
    </group>
  )
}

function GumMesh({ teeth, jaw }: { teeth: ToothData[]; jaw: Jaw }) {
  const curve = useMemo(() => {
    const ridgeOffsetY = jaw === 'upper' ? 0.5 : -0.5
    const ridgeOffsetZ = jaw === 'upper' ? -0.24 : -0.2
    const controlPoints = teeth.map((tooth, index) => {
      const posteriorDrop = index < 2 || index > 13 ? (jaw === 'upper' ? 0.12 : -0.12) : 0
      return new THREE.Vector3(
        tooth.position.x,
        tooth.position.y + ridgeOffsetY + posteriorDrop,
        tooth.position.z + ridgeOffsetZ
      )
    })

    return new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal')
  }, [jaw, teeth])

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 160, jaw === 'upper' ? 0.9 : 0.76, 30, false),
    [curve, jaw]
  )

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: jaw === 'upper' ? '#d796a0' : '#dca1ab',
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.45,
      }),
    [jaw]
  )

  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={[1.02, jaw === 'upper' ? 0.82 : 0.78, 1.08]}
      receiveShadow
      castShadow
    />
  )
}

function TeethScene() {
  const { currentStep, selectedTooth, setSelectedTooth, steps } = useDentalStore()
  const currentStepData = steps[currentStep - 1]

  const handleToothClick = (tooth: ToothData) => {
    setSelectedTooth(selectedTooth?.number === tooth.number ? null : tooth)
  }

  return (
    <group position={[0, 0.08, 0]}>
      <GumMesh teeth={defaultUpperTeeth} jaw="upper" />
      <GumMesh teeth={defaultLowerTeeth} jaw="lower" />

      {defaultUpperTeeth.map((tooth) => (
        <ToothMesh
          key={tooth.number}
          tooth={tooth}
          isSelected={selectedTooth?.number === tooth.number}
          onClick={() => handleToothClick(tooth)}
          movement={currentStepData?.toothMovements.get(tooth.number)?.movement}
        />
      ))}

      {defaultLowerTeeth.map((tooth) => (
        <ToothMesh
          key={tooth.number}
          tooth={tooth}
          isSelected={selectedTooth?.number === tooth.number}
          onClick={() => handleToothClick(tooth)}
          movement={currentStepData?.toothMovements.get(tooth.number)?.movement}
        />
      ))}
    </group>
  )
}

function ContactPoints() {
  const { currentStep, steps } = useDentalStore()
  const currentStepData = steps[currentStep - 1]

  // Define contact points between upper and lower teeth
  const contactPoints = [
    // Molar contacts
    { upper: '3', lower: '30', position: [0.2, 0.08, 0.8] as [number, number, number] },
    { upper: '14', lower: '19', position: [-0.2, 0.08, 0.8] as [number, number, number] },
    { upper: '2', lower: '31', position: [0.4, 0.08, 1.2] as [number, number, number] },
    { upper: '15', lower: '18', position: [-0.4, 0.08, 1.2] as [number, number, number] },
    // Premolar contacts
    { upper: '4', lower: '29', position: [0.6, 0.08, 1.6] as [number, number, number] },
    { upper: '13', lower: '20', position: [-0.6, 0.08, 1.6] as [number, number, number] },
    { upper: '5', lower: '28', position: [0.8, 0.08, 1.9] as [number, number, number] },
    { upper: '12', lower: '21', position: [-0.8, 0.08, 1.9] as [number, number, number] },
    // Canine contacts
    { upper: '6', lower: '27', position: [1.0, 0.08, 2.2] as [number, number, number] },
    { upper: '11', lower: '22', position: [-1.0, 0.08, 2.2] as [number, number, number] },
    // Incisor contacts
    { upper: '8', lower: '25', position: [0.15, 0.08, 2.8] as [number, number, number] },
    { upper: '9', lower: '24', position: [-0.15, 0.08, 2.8] as [number, number, number] },
  ]

  return (
    <group>
      {contactPoints.map((contact, index) => {
        const upperTooth = defaultUpperTeeth.find(t => t.number === contact.upper)
        const lowerTooth = defaultLowerTeeth.find(t => t.number === contact.lower)

        if (!upperTooth || !lowerTooth) return null

        // Apply movements if they exist
        const upperMovement = currentStepData?.toothMovements.get(contact.upper)?.movement
        const lowerMovement = currentStepData?.toothMovements.get(contact.lower)?.movement

        const upperPos: [number, number, number] = [
          upperTooth.position.x + (upperMovement?.translationX ?? 0),
          upperTooth.position.y + (upperMovement?.translationY ?? 0),
          upperTooth.position.z + (upperMovement?.translationZ ?? 0),
        ]

        const lowerPos: [number, number, number] = [
          lowerTooth.position.x + (lowerMovement?.translationX ?? 0),
          lowerTooth.position.y + (lowerMovement?.translationY ?? 0),
          lowerTooth.position.z + (lowerMovement?.translationZ ?? 0),
        ]

        // Calculate contact point position (midpoint between upper and lower tooth centers)
        const contactPos: [number, number, number] = [
          (upperPos[0] + lowerPos[0]) / 2,
          (upperPos[1] + lowerPos[1]) / 2,
          (upperPos[2] + lowerPos[2]) / 2,
        ]

        return (
          <mesh key={index} position={contactPos}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color="#00B8D4"
              emissive="#00B8D4"
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function CameraRig({ activeTool }: { activeTool: string | null }) {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const cameraTarget = useRef(new THREE.Vector3(0, 0.55, 12.5))
  const lookTarget = useRef(new THREE.Vector3(0, 0.08, 0.2))

  useEffect(() => {
    if (activeTool === 'occlusal' || activeTool === 'contacts') {
      cameraTarget.current.set(0, 9.5, 0.35)
      lookTarget.current.set(0, 0.08, 0.15)
      return
    }

    cameraTarget.current.set(0, 0.55, 12.5)
    lookTarget.current.set(0, 0.08, 0.2)
  }, [activeTool])

  useFrame(() => {
    camera.position.lerp(cameraTarget.current, 0.08)

    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookTarget.current, 0.08)
      controlsRef.current.update()
    } else {
      camera.lookAt(lookTarget.current)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={activeTool !== 'occlusal' && activeTool !== 'contacts'}
      enableRotate
      enableZoom
      minDistance={activeTool === 'occlusal' || activeTool === 'contacts' ? 6 : 7}
      maxDistance={activeTool === 'occlusal' || activeTool === 'contacts' ? 15 : 18}
      minPolarAngle={activeTool === 'occlusal' || activeTool === 'contacts' ? 0.05 : 0.55}
      maxPolarAngle={activeTool === 'occlusal' || activeTool === 'contacts' ? 1.2 : 2.3}
      dampingFactor={0.08}
      enableDamping
    />
  )
}

function MeasurementGrid() {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(10, 20, 0xBBCAC4, 0xE1E3E3)
    grid.position.z = 0.2
    return grid
  }, [])

  return <primitive object={gridHelper} />
}

export default function DentalViewer() {
  const activeTool = useDentalStore((state) => state.activeTool)

  return (
    <div className="h-full w-full bg-transparent">
      <Canvas camera={{ position: [0, 0.55, 12.5], fov: 30 }} shadows dpr={[1, 1.6]}>
        <color attach="background" args={['transparent']} />

        <ambientLight intensity={0.7} />
        <hemisphereLight args={['#efe7df', '#291d1d', 0.45]} />
        <spotLight
          position={[4, 10, 10]}
          angle={0.34}
          penumbra={0.65}
          intensity={80}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <spotLight position={[-7, 4, 6]} angle={0.48} penumbra={0.5} intensity={28} />
        <pointLight position={[0, 2.2, 5.5]} intensity={10} color="#f4ebe6" />

        <Environment preset="studio" />

        <group scale={1.55}>
          <TeethScene />
          {activeTool === 'grid' && <MeasurementGrid />}
          {(activeTool === 'occlusal' || activeTool === 'contacts') && <ContactPoints />}
        </group>

        <ContactShadows position={[0, -2.15, 0]} opacity={0.35} scale={14} blur={2.4} far={4.5} />
        <CameraRig activeTool={activeTool} />
      </Canvas>
    </div>
  )
}
