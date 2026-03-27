'use client'

import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import {
  ToothData,
  TreatmentStep,
  defaultLowerTeeth,
  defaultUpperTeeth,
  useDentalStore,
} from '@/store/dental-store'

type ToothKind = 'molar' | 'premolar' | 'canine' | 'incisor'
type Jaw = 'upper' | 'lower'
type FocusArea = 'left' | 'center' | 'right'

type ViewerErrorBoundaryState = {
  hasError: boolean
  message: string
}

interface ToothDimensions {
  width: number
  height: number
  depth: number
  rootLength: number
  rootRadius: number
}

interface RemoteModelSource {
  url: string
  fallbackUrl?: string
}

class ViewerErrorBoundary extends Component<{ children: ReactNode }, ViewerErrorBoundaryState> {
  state: ViewerErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ViewerErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Failed to load 3D model',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dental viewer crashed:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex h-full w-full items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-destructive/20 bg-card/90 p-6 text-center shadow-lg backdrop-blur-md">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-destructive">3D Viewer Error</p>
          <p className="mt-3 text-base font-semibold text-on-surface">
            The model could not be loaded.
          </p>
          <p className="mt-2 text-sm text-outline">
            {this.state.message}
          </p>
          <p className="mt-4 text-xs text-outline">
            Restart `npm run dev` and refresh the page. If it still fails, check that the API is running on the same port configured in `.env`.
          </p>
        </div>
      </div>
    )
  }
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

function TeethScene({
  upperVisible,
  lowerVisible,
}: {
  upperVisible: boolean
  lowerVisible: boolean
}) {
  const { currentStep, selectedTooth, setSelectedTooth, steps } = useDentalStore()
  const currentStepData = steps[currentStep - 1]

  const handleToothClick = (tooth: ToothData) => {
    setSelectedTooth(selectedTooth?.number === tooth.number ? null : tooth)
  }

  return (
    <group position={[0, 0.08, 0]}>
      {upperVisible && (
        <>
          <GumMesh teeth={defaultUpperTeeth} jaw="upper" />
          {defaultUpperTeeth.map((tooth) => (
            <ToothMesh
              key={tooth.number}
              tooth={tooth}
              isSelected={selectedTooth?.number === tooth.number}
              onClick={() => handleToothClick(tooth)}
              movement={currentStepData?.toothMovements.get(tooth.number)?.movement}
            />
          ))}
        </>
      )}

      {lowerVisible && (
        <>
          <GumMesh teeth={defaultLowerTeeth} jaw="lower" />
          {defaultLowerTeeth.map((tooth) => (
            <ToothMesh
              key={tooth.number}
              tooth={tooth}
              isSelected={selectedTooth?.number === tooth.number}
              onClick={() => handleToothClick(tooth)}
              movement={currentStepData?.toothMovements.get(tooth.number)?.movement}
            />
          ))}
        </>
      )}
    </group>
  )
}

function prepareSequenceGeometries(geometries: THREE.BufferGeometry[]) {
  if (geometries.length === 0) return geometries;

  const unionBounds = new THREE.Box3()

  geometries.forEach((geometry) => {
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
      unionBounds.union(geometry.boundingBox)
    }
  })

  let center = new THREE.Vector3()
  let scale = 1

  if (!unionBounds.isEmpty()) {
    center = unionBounds.getCenter(new THREE.Vector3())
    const size = unionBounds.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    scale = 4.8 / maxDimension
  }

  console.log('DentalViewer Debug:', { isEmpty: unionBounds.isEmpty(), scale, center })

  geometries.forEach((geometry) => {
    geometry.translate(-center.x, -center.y, -center.z)
    geometry.scale(scale, scale, scale)
    geometry.computeBoundingBox()
    geometry.computeVertexNormals()
  })

  return geometries
}

const geometryCache = new Map<string, THREE.BufferGeometry>()

async function fetchGeometryFromSource(source: RemoteModelSource): Promise<THREE.BufferGeometry> {
  const cacheKey = source.url
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!.clone()
  }

  const loader = new STLLoader()
  const candidateUrls = source.fallbackUrl && source.fallbackUrl !== source.url
    ? [source.fallbackUrl, source.url]
    : [source.url]

  let lastError: Error | null = null

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/octet-stream,*/*' },
      })
      if (!response.ok) throw new Error(`Request failed with ${response.status} ${response.statusText}`)
      const arrayBuffer = await response.arrayBuffer()
      const geometry = loader.parse(arrayBuffer)
      geometryCache.set(cacheKey, geometry.clone())
      return geometry
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`Failed to fetch STL from ${url}:`, error)
    }
  }

  throw lastError || new Error(`Failed to load STL from all candidate URLs for ${source.url}`)
}

export function useTreatmentSequenceModels(sources: RemoteModelSource[]) {
  const [loadedGeometries, setLoadedGeometries] = useState<THREE.BufferGeometry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false

    if (sources.length === 0) {
      setLoadedGeometries((current) => {
        current.forEach((geometry) => geometry.dispose())
        return []
      })
      setIsLoading(false)
      setError(null)
      return
    }

    const loadSequenceModels = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const nextGeometries = await Promise.all(sources.map((source) => fetchGeometryFromSource(source)))
        prepareSequenceGeometries(nextGeometries)

        if (disposed) {
          nextGeometries.forEach((geometry) => geometry.dispose())
          return
        }

        setLoadedGeometries((current) => {
          current.forEach((geometry) => geometry.dispose())
          return nextGeometries
        })
      } catch (loadError) {
        if (disposed) {
          return
        }

        setLoadedGeometries((current) => {
          current.forEach((geometry) => geometry.dispose())
          return []
        })
        setError(loadError instanceof Error ? loadError.message : 'Failed to load treatment sequence')
      } finally {
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    loadSequenceModels()

    return () => {
      disposed = true
    }
  }, [sources])

  useEffect(() => {
    return () => {
      loadedGeometries.forEach((geometry) => geometry.dispose())
    }
  }, [loadedGeometries])

  return {
    loadedGeometries,
    isLoading,
    error,
  }
}

function GlbSequenceScene({ url, currentStep }: { url: string; currentStep: number }) {
  const { scene } = useGLTF(url)

  // Fast animation toggle: just hide/show the meshes in the baked GLTF group
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const stepIndex = child.userData.stepIndex
        const isBase = child.userData.isBase
        const isActive = stepIndex === currentStep - 1
        
        child.visible = isBase || isActive
      }
    })
  }, [scene, currentStep])

  return <primitive object={scene} position={[0, 0, 0]} />
}

function TreatmentSequenceScene({
  preparedGeometries,
  activeTool,
}: {
  preparedGeometries: THREE.BufferGeometry[]
  activeTool: string | null
}) {
  const previousGeometry = preparedGeometries.length > 1 ? preparedGeometries[0] : null
  const currentGeometry = preparedGeometries[preparedGeometries.length - 1]

  if (!currentGeometry) {
    return null
  }

  return (
    <group
      position={activeTool === 'occlusal' ? [0, -0.3, 0] : [0, -0.1, 0]}
      rotation={[0, 0, 0]}
    >
      {previousGeometry && (
        <mesh geometry={previousGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#4fd1d9"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <mesh geometry={currentGeometry} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#dde7eb"
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function getSequenceFitRadius(geometries: THREE.BufferGeometry[]) {
  if (geometries.length === 0) {
    return 0
  }

  const unionBounds = new THREE.Box3()

  geometries.forEach((geometry) => {
    geometry.computeBoundingBox()

    if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
      unionBounds.union(geometry.boundingBox)
    }
  })

  if (unionBounds.isEmpty()) {
    return 5
  }

  const size = unionBounds.getSize(new THREE.Vector3())
  return size.length() * 0.5
}

function MeasurementGrid() {
  return (
    <group>
      <gridHelper args={[26, 52, '#0ec6d3', '#1f3940']} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <gridHelper args={[26, 52, '#0ec6d3', '#1f3940']} position={[0, 0.11, 0]} />
    </group>
  )
}

function OcclusalPlane() {
  return (
    <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20, 80, 80]} />
      <meshStandardMaterial color="#0c3f52" transparent opacity={0.12} roughness={1} />
    </mesh>
  )
}

function CameraRig({
  activeTool,
  focusArea,
  hasTreatmentSequence,
  treatmentFitRadius,
}: {
  activeTool: string | null
  focusArea: FocusArea
  hasTreatmentSequence: boolean
  treatmentFitRadius: number
}) {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const defaultCenterPosition = useRef(new THREE.Vector3(0, 0.72, 9.4))
  const desiredCameraPosition = useRef(defaultCenterPosition.current.clone())
  const desiredLookTarget = useRef(new THREE.Vector3(0, 0.2, 0.12))
  const isTransitioning = useRef(true)

  useEffect(() => {
    const treatmentDistance = Math.max(12, treatmentFitRadius * 4.2)

    if ('fov' in camera) {
      camera.fov = activeTool === 'occlusal' ? 34 : hasTreatmentSequence ? 28 : 24
      camera.updateProjectionMatrix()
    }

    if (activeTool === 'occlusal') {
      desiredCameraPosition.current.set(
        0,
        hasTreatmentSequence ? 0.6 : 0.95,
        hasTreatmentSequence ? treatmentDistance : 21.5
      )
      desiredLookTarget.current.set(0, hasTreatmentSequence ? -0.2 : 0.16, 0.08)
      isTransitioning.current = true
      return
    }

    if (focusArea === 'left') {
      if (hasTreatmentSequence) {
        desiredCameraPosition.current.set(-treatmentDistance * 0.42, 1.1, treatmentDistance * 0.82)
        desiredLookTarget.current.set(-0.4, -0.05, 0)
      } else {
        desiredCameraPosition.current.set(-12.2, 0.9, 3.1)
        desiredLookTarget.current.set(-0.8, 0.08, 0.1)
      }
      isTransitioning.current = true
      return
    }

    if (focusArea === 'right') {
      if (hasTreatmentSequence) {
        desiredCameraPosition.current.set(treatmentDistance * 0.42, 1.1, treatmentDistance * 0.82)
        desiredLookTarget.current.set(0.4, -0.05, 0)
      } else {
        desiredCameraPosition.current.set(12.2, 0.9, 3.1)
        desiredLookTarget.current.set(0.8, 0.08, 0.1)
      }
      isTransitioning.current = true
      return
    }

    if (hasTreatmentSequence) {
      desiredCameraPosition.current.set(0, 0.95, treatmentDistance)
      desiredLookTarget.current.set(0, -0.05, 0)
    } else {
      desiredCameraPosition.current.copy(defaultCenterPosition.current)
      desiredLookTarget.current.set(0, 0.2, 0.12)
    }
    isTransitioning.current = true
  }, [activeTool, camera, focusArea, hasTreatmentSequence, treatmentFitRadius])

  useFrame(() => {
    if (controlsRef.current) {
      if (isTransitioning.current) {
        camera.position.lerp(desiredCameraPosition.current, 0.08)
        controlsRef.current.target.lerp(desiredLookTarget.current, 0.08)

        const cameraSettled = camera.position.distanceTo(desiredCameraPosition.current) < 0.05
        const targetSettled = controlsRef.current.target.distanceTo(desiredLookTarget.current) < 0.05

        if (cameraSettled && targetSettled) {
          camera.position.copy(desiredCameraPosition.current)
          controlsRef.current.target.copy(desiredLookTarget.current)
          isTransitioning.current = false
        }
      }

      controlsRef.current.update()
    } else {
      if (isTransitioning.current) {
        camera.position.lerp(desiredCameraPosition.current, 0.08)
        camera.lookAt(desiredLookTarget.current)

        if (camera.position.distanceTo(desiredCameraPosition.current) < 0.05) {
          camera.position.copy(desiredCameraPosition.current)
          isTransitioning.current = false
        }
      }
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={activeTool !== 'occlusal'}
      enableRotate
      enableZoom
      minDistance={activeTool === 'occlusal' ? 6 : 4}
      maxDistance={activeTool === 'occlusal' ? 90 : 320}
      minPolarAngle={activeTool === 'occlusal' ? 1.15 : 0.55}
      maxPolarAngle={activeTool === 'occlusal' ? 2.05 : 2.3}
      zoomSpeed={activeTool === 'occlusal' ? 0.8 : 1.1}
      rotateSpeed={activeTool === 'occlusal' ? 0.85 : 1}
      panSpeed={activeTool === 'occlusal' ? 0.7 : 1}
      zoomToCursor
      dampingFactor={0.08}
      enableDamping
    />
  )
}

export default function DentalViewer(props: {
  upperVisible: boolean
  lowerVisible: boolean
  focusArea?: FocusArea
}) {
  const { currentStep, steps, selectedTooth, activeTool, sequenceGlbUrl } = useDentalStore()
  const focusArea = props.focusArea ?? 'center'

  const { upperVisible, lowerVisible } = props

  const sequenceSteps = useMemo(
    () =>
      steps.filter(
        (step): step is TreatmentStep & { modelUrl: string } => Boolean(step.modelUrl)
      ),
    [steps]
  )
  const hasTreatmentSequence = sequenceSteps.length > 0 && sequenceSteps.length === steps.length
  const activeSources = useMemo(() => {
    if (sequenceGlbUrl || !hasTreatmentSequence || sequenceSteps.length === 0) {
      return []
    }

    const currentIndex = Math.min(Math.max(currentStep - 1, 0), sequenceSteps.length - 1)
    const baseSource = sequenceSteps[0]
    const currentStepSource = sequenceSteps[currentIndex]

    const sourcesToLoad: RemoteModelSource[] = [
      { url: baseSource.modelUrl, fallbackUrl: baseSource.fallbackModelUrl },
    ]

    if (currentIndex > 0) {
      sourcesToLoad.push({
        url: currentStepSource.modelUrl,
        fallbackUrl: currentStepSource.fallbackModelUrl,
      })
    }

    return sourcesToLoad
  }, [currentStep, hasTreatmentSequence, sequenceSteps])
  const { loadedGeometries, isLoading, error } = useTreatmentSequenceModels(activeSources)

  const treatmentFitRadius = useMemo(
    () => sequenceGlbUrl ? 5 : getSequenceFitRadius(loadedGeometries),
    [loadedGeometries, sequenceGlbUrl]
  )
  const sceneScale = (sequenceGlbUrl || hasTreatmentSequence) ? 1 : activeTool === 'occlusal' ? 0.78 : 1.55

  // DEBUG HOOK: We capture camera position in useFrame
  const [debugCam, setDebugCam] = useState('0,0,0')

  return (
    <div className="relative h-full w-full bg-transparent">
      {/* AGENT DEBUG OVERLAY */}
      <div className="absolute top-0 right-0 z-50 p-4 bg-black/80 text-white font-mono text-xs whitespace-pre">
        [DEBUG SYSTEM]<br/>
        hasTreatmentSeq: {String(hasTreatmentSequence)}<br/>
        activeSources len: {activeSources.length}<br/>
        sequenceGlbUrl: {sequenceGlbUrl ? 'Active' : 'Missing'}<br/>
        loadedGeometries len: {loadedGeometries.length}<br/>
        treatmentFitRadius: {treatmentFitRadius}<br/>
        sceneScale: {sceneScale}<br/>
        error: {String(error)}<br/>
        isLoading: {String(isLoading)}<br/>
      </div>

      {hasTreatmentSequence && isLoading && (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center px-4">
          <div className="rounded-full border border-outline-variant/60 bg-card/88 px-4 py-2 text-xs font-semibold text-on-surface shadow-lg backdrop-blur-xl">
            Loading treatment step {currentStep}...
          </div>
        </div>
      )}
      {hasTreatmentSequence && error && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
          <div className="max-w-xl rounded-2xl border border-destructive/25 bg-card/92 p-5 text-center shadow-xl backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-destructive">Model Load Failed</p>
            <p className="mt-3 text-sm font-medium text-on-surface">
              The treatment sequence could not be loaded from Cloudflare R2 or the local proxy.
            </p>
            <p className="mt-2 text-xs leading-5 text-outline">{error}</p>
          </div>
        </div>
      )}
      <ViewerErrorBoundary>
        <Canvas camera={{ position: [0, 0.72, 9.4], fov: 24 }} dpr={[1, 1.6]}>
          <color attach="background" args={['#1e293b']} />
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

          <group scale={sceneScale}>
            {sequenceGlbUrl ? (
              <GlbSequenceScene url={sequenceGlbUrl} currentStep={currentStep} />
            ) : hasTreatmentSequence ? (
              <TreatmentSequenceScene
                preparedGeometries={loadedGeometries}
                activeTool={activeTool}
              />
            ) : (
              <TeethScene upperVisible={upperVisible} lowerVisible={lowerVisible} />
            )}
            {(activeTool === 'grid' || activeTool === 'occlusal') && <MeasurementGrid />}
            {activeTool === 'grid' && <OcclusalPlane />}
          </group>

          {/* <ContactShadows position={[0, -2.15, 0]} opacity={0.35} scale={14} blur={2.4} far={4.5} /> */}
          <CameraRig
            activeTool={activeTool}
            focusArea={focusArea}
            hasTreatmentSequence={hasTreatmentSequence}
            treatmentFitRadius={treatmentFitRadius}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  )
}
