'use client'

import React, { Component, type ErrorInfo, type ReactNode, useState, useEffect, useMemo, useRef, memo, Suspense, useCallback } from 'react'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Edges, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as THREE from 'three'
import {
  ToothData,
  TreatmentStep,
  useDentalStore,
} from '@/store/dental-store'
import {
  calculateOcclusionY,
  analyzeOcclusionContacts,
  getOcclusionMetrics,
  DEFAULT_OCCLUSION_CONFIG,
  estimateContactPoints,
  validateOcclusion,
  OcclusionConfig,
} from '@/lib/occlusion'
import { VIEW_PRESETS, FrontViewConfig } from '@/lib/frontView'
import FrontViewCamera from './FrontViewCamera'
type FocusArea = 'left' | 'center' | 'right'

type ViewerErrorBoundaryState = {
  hasError: boolean
  message: string
}

interface RemoteModelSource {
  url: string
  fallbackUrl?: string
}

function parseStlGeometry(arrayBuffer: ArrayBuffer) {
  if (arrayBuffer.byteLength < 84) {
    throw new Error('STL file is too small to be valid')
  }

  const faceCount = new DataView(arrayBuffer).getUint32(80, true)
  const expectedBinaryLength = 84 + faceCount * 50
  const looksBinary = expectedBinaryLength === arrayBuffer.byteLength

  if (!looksBinary) {
    throw new Error('Invalid STL structure detected')
  }

  const loader = new STLLoader()
  return loader.parse(arrayBuffer)
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

// No global cache to avoid memory leaks

function getFileExtension(modelUrl: string) {
  const sanitizedUrl = modelUrl.split('?')[0]
  return sanitizedUrl.slice(sanitizedUrl.lastIndexOf('.')).toLowerCase()
}

function mergeSceneGeometries(root: THREE.Object3D) {
  const geometries: THREE.BufferGeometry[] = []

  root.updateMatrixWorld(true)
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return
    }

    const geometry = child.geometry.clone()
    geometry.applyMatrix4(child.matrixWorld)
    geometries.push(geometry.index ? geometry.toNonIndexed() : geometry)
  })

  if (geometries.length === 0) {
    throw new Error('No mesh geometry found in uploaded model')
  }

  if (geometries.length === 1) {
    return geometries[0]
  }

  const mergedGeometry = mergeGeometries(geometries, false)

  if (!mergedGeometry) {
    throw new Error('Failed to merge uploaded model geometry')
  }

  return mergedGeometry
}

async function fetchGeometryFromSource(source: RemoteModelSource): Promise<THREE.BufferGeometry> {
  // Always try proxy first for remote URLs, skip direct fetch to avoid CORS
  const candidateUrls = source.fallbackUrl ? [source.fallbackUrl] : [source.url]

  let lastError: Error | null = null

  for (const url of candidateUrls) {
    try {
      console.log(`[STL Loader] Attempting to fetch from: ${url}`)
      const response = await fetch(url, {
        headers: { Accept: 'application/octet-stream,*/*' },
      })
      if (!response.ok) throw new Error(`Request failed with ${response.status} ${response.statusText}`)
      const extension = getFileExtension(url)
      let geometry: THREE.BufferGeometry

      if (extension === '.obj') {
        const loader = new OBJLoader()
        const content = await response.text()
        geometry = mergeSceneGeometries(loader.parse(content))
      } else if (extension === '.glb' || extension === '.gltf') {
        const loader = new GLTFLoader()
        const arrayBuffer = await response.arrayBuffer()
        const gltf = await new Promise<{ scene: THREE.Object3D }>((resolve, reject) => {
          loader.parse(arrayBuffer, new URL(url, window.location.href).href, resolve, reject)
        })
        geometry = mergeSceneGeometries(gltf.scene)
      } else {
        const arrayBuffer = await response.arrayBuffer()
        geometry = parseStlGeometry(arrayBuffer)
      }

      console.log(`[STL Loader] Successfully loaded geometry from: ${url}`)
      return geometry
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`Failed to fetch STL from ${url}:`, error)
    }
  }

  throw lastError || new Error(`Failed to load STL from all candidate URLs for ${source.url}`)
}

export function useTreatmentSequenceModels(
  sources: { url: string; fallbackUrl?: string }[],
  currentStep: number,
  steps: TreatmentStep[]
) {
  const [loadedGeometries, setLoadedGeometries] = useState<(THREE.BufferGeometry | null)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false
    setError(null)

    if (sources.length === 0) {
      setLoadedGeometries(current => {
        current.forEach(g => g?.dispose())
        return []
      })
      setIsLoading(false)
      return
    }

    const loadNeededModels = async () => {
      // Find indices we actually need right now: currentStep and its partner
      const currentStepIdx = currentStep - 1

      const currentStepData = steps[currentStepIdx]
      if (!currentStepData) return

      const isCurrentUpper = currentStepData.name.toLowerCase().includes('upper')
      const stepNumberMatch = currentStepData.name.match(/\d+/)
      const stepNumber = stepNumberMatch ? stepNumberMatch[0] : ''

      const partnerStep = steps.find(s =>
        s.name.toLowerCase().includes(isCurrentUpper ? 'lower' : 'upper') &&
        (stepNumber && s.name.includes(stepNumber))
      )
      const partnerIdx = partnerStep ? steps.indexOf(partnerStep) : -1

      const neededIndices = [currentStepIdx]
      if (partnerIdx !== -1) neededIndices.push(partnerIdx)

      setIsLoading(true)

      try {
        // Create a copy of current geometries to update
        const nextGeometries = [...loadedGeometries]
        // If the array size changed, re-initialize
        if (nextGeometries.length !== steps.length) {
          nextGeometries.length = 0
          for (let i = 0; i < steps.length; i++) nextGeometries.push(null)
        }

        // Dispose of models we NO LONGER need (Keep them if we're playing to avoid flicker?)
        // Actually, to save memory, we MUST dispose of those outside a small window
        nextGeometries.forEach((g, idx) => {
          if (g && !neededIndices.includes(idx)) {
            g.dispose()
            nextGeometries[idx] = null
          }
        })

        // Fetch needed models that aren't loaded yet
        for (const idx of neededIndices) {
          if (disposed) return
          if (!nextGeometries[idx] && sources[idx]) {
            try {
              const geometry = await fetchGeometryFromSource(sources[idx])
              const isUpper = sources[idx].url.includes('Upper') || (sources[idx].fallbackUrl && sources[idx].fallbackUrl.includes('Upper'))

              geometry.center()
              if (isUpper) {
                geometry.rotateY(Math.PI)
              }

              // Fit scale if not set (using the first one as reference)
              if (!geometry.boundingBox) geometry.computeBoundingBox()
              const size = geometry.boundingBox!.getSize(new THREE.Vector3())
              const maxDim = Math.max(size.x, size.y, size.z) || 1
              const localScale = 4.8 / (maxDim * 1.5)
              geometry.scale(localScale, localScale, localScale)

              nextGeometries[idx] = geometry
              if (!disposed) setLoadedGeometries([...nextGeometries])
            } catch (err) {
              console.error(`Failed to load needed model at ${idx}:`, err)
              if (!disposed) {
                setError('One or more uploaded files could not be displayed. Broken files were skipped.')
              }
            }
          }
        }
      } catch (err) {
        console.error('Lazy loading failed:', err)
        if (!disposed) setError('Failed to prepare treatment view')
      } finally {

        if (!disposed) setIsLoading(false)
      }
    }

    loadNeededModels()

    return () => {
      disposed = true
    }
  }, [sources, currentStep, steps])


  // Disposal is handled in the main useEffect cleanup above to avoid premature disposal


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

const TreatmentSequenceScene = memo(({
  preparedGeometries,
  activeTool,
  occlusionConfig,
}: {
  preparedGeometries: (THREE.BufferGeometry | null)[]
  activeTool: string | null
  occlusionConfig?: OcclusionConfig
}) => {

  const { currentStep, steps, selectedTooth, archVisibility } = useDentalStore()

  const currentStepData = steps[currentStep - 1]
  if (!currentStepData) return null

  const isCurrentUpper = currentStepData.name.toLowerCase().includes('upper')
  const stepNumberMatch = currentStepData.name.match(/\d+/)
  const stepNumber = stepNumberMatch ? stepNumberMatch[0] : ''

  // Primary geometry for current step
  const primaryGeometry = preparedGeometries[currentStep - 1]

  // Find partner (e.g. if current is Lower 01, find Upper 01)
  const partnerStep = steps.find(s =>
    s.name.toLowerCase().includes(isCurrentUpper ? 'lower' : 'upper') &&
    (stepNumber && s.name.includes(stepNumber))
  )
  const partnerIndex = partnerStep ? steps.indexOf(partnerStep) : -1
  const partnerGeometry = partnerIndex !== -1 ? preparedGeometries[partnerIndex] : null

  const lowerGeometry = isCurrentUpper ? partnerGeometry : primaryGeometry
  const upperGeometry = isCurrentUpper ? primaryGeometry : partnerGeometry

  // Use provided config or default
  const config = occlusionConfig || DEFAULT_OCCLUSION_CONFIG

  // Calculate proper occlusion positioning
  const occlusionPositions = useMemo(() => {
    if (!upperGeometry || !lowerGeometry) return null
    
    try {
      const { upperY, lowerY } = calculateOcclusionY(upperGeometry, lowerGeometry, config)
      const metrics = getOcclusionMetrics(upperGeometry, lowerGeometry, upperY, lowerY)
      const contacts = analyzeOcclusionContacts(upperGeometry, lowerGeometry, upperY, lowerY)
      const contactPoints = estimateContactPoints(upperGeometry, lowerGeometry, upperY, lowerY)
      
      console.log('🦷 OCCLUSION ANALYSIS:', {
        upperY: upperY.toFixed(3),
        lowerY: lowerY.toFixed(3),
        overbite: metrics.effectiveOverbite.toFixed(3),
        quality: `${metrics.occlusionQuality.toFixed(1)}%`,
        relationship: metrics.anteroposteriorRelationship,
        estimatedContacts: contacts.contactCountEstimate,
        isValid: validateOcclusion(metrics),
      })
      
      return { upperY, lowerY, metrics, contactPoints }
    } catch (error) {
      console.error('Occlusion calculation failed:', error)
      return null
    }
  }, [upperGeometry, lowerGeometry, config])

  const { upperY = 0, lowerY = 0 } = occlusionPositions || {}

  console.log('TreatmentSequenceScene Debug:', {
    currentStep,
    isCurrentUpper,
    stepNumber,
    hasLower: !!lowerGeometry,
    hasUpper: !!upperGeometry,
    partnerIndex,
    occlusionReady: !!occlusionPositions
  })

  return (
    <group
      position={activeTool === 'occlusal' ? [0, -0.3, 0] : [0, 0, 0]}
      rotation={[0, 0, 0]}
    >
      {archVisibility.lower && lowerGeometry && (
        <mesh geometry={lowerGeometry} position={[0, lowerY, 0]}>
          <meshPhongMaterial
            color="#f8fafc"
            emissive="#1e293b"
            emissiveIntensity={0.15}
            shininess={40}
            specular="#ffffff"
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {archVisibility.upper && upperGeometry && (
        <mesh geometry={upperGeometry} position={[0, upperY, 0]}>
          <meshPhongMaterial
            color="#fcfaf8"
            emissive="#2d1e1e"
            emissiveIntensity={0.12}
            shininess={35}
            specular="#ffffff"
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Occlusal plane indicator */}
      {activeTool === 'occlusal' && occlusionPositions && (
        <mesh position={[0, config.occlusionHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20, 80, 80]} />
          <meshStandardMaterial 
            color="#0c3f52" 
            transparent 
            opacity={0.15} 
            roughness={1}
            emissive="#0ec6d3"
            emissiveIntensity={0.1}
          />
        </mesh>
      )}
    </group>

  )
})

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

function MeasurementGrid({ gridPosition }: { gridPosition: 'front' | 'back' }) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    const depthTest = gridPosition === 'back'
    const renderOrder = gridPosition === 'front' ? 999 : 0

    groupRef.current.traverse((child) => {
      if (child.type === 'GridHelper' || (child as any).isLine) {
        child.renderOrder = renderOrder
        const mat = (child as any).material
        if (mat) {
          mat.depthTest = depthTest
          mat.depthWrite = depthTest
          mat.transparent = true
          mat.opacity = 0.5
          mat.needsUpdate = true
        }
      }
    })
  }, [gridPosition])

  return (
    <group ref={groupRef}>
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
    const treatmentDistance = Math.max(8.0, treatmentFitRadius * 3.2)

    if ('fov' in camera) {
      camera.fov = activeTool === 'occlusal' ? 38 : hasTreatmentSequence ? 36 : 28
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
      // Default view matching user's preferred angle
      desiredCameraPosition.current.set(0, -11.82, 1.52)
      desiredLookTarget.current.set(0, 0, 0)
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
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      zoomSpeed={activeTool === 'occlusal' ? 0.8 : 1.1}
      rotateSpeed={activeTool === 'occlusal' ? 0.85 : 1}
      panSpeed={activeTool === 'occlusal' ? 0.7 : 1}
      zoomToCursor
      dampingFactor={0.08}
      enableDamping
      onStart={() => {
        // User started interacting — stop CameraRig from fighting
        isTransitioning.current = false
      }}
      onChange={() => {
        if (!controlsRef.current) return
        const cam = controlsRef.current.object
        const pos = cam.position
        const spherical = new THREE.Spherical().setFromVector3(
          pos.clone().sub(controlsRef.current.target)
        )
        console.log(
          `📷 Camera pos: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`,
          `| Zoom (distance): ${spherical.radius.toFixed(2)}`,
          `| Azimuth (L/R): ${THREE.MathUtils.radToDeg(spherical.theta).toFixed(1)}°`,
          `| Polar (Up/Down): ${THREE.MathUtils.radToDeg(spherical.phi).toFixed(1)}°`
        )
      }}
    />
  )
}

export default function DentalViewer(props: {
  focusArea?: FocusArea
}) {
  const { currentStep, steps, selectedTooth, activeTool, gridPosition, sequenceGlbUrl, viewPreset } = useDentalStore()
  const focusArea = props.focusArea ?? 'center'

  const viewConfig = VIEW_PRESETS[viewPreset]
  const occlusionConfig = viewConfig.occlusion


  const sequenceSteps = useMemo(
    () =>
      steps.filter(
        (step): step is TreatmentStep & { modelUrl: string } => Boolean(step.modelUrl)
      ),
    [steps]
  )
  const hasTreatmentSequence = sequenceSteps.length > 0

  // Use all steps as sources to load the entire sequence once
  const allSequenceSources = useMemo(() => {
    if (!hasTreatmentSequence) return []
    return sequenceSteps.map(step => ({
      url: step.modelUrl!,
      fallbackUrl: step.fallbackModelUrl
    }))
  }, [hasTreatmentSequence, sequenceSteps])

  const { loadedGeometries, isLoading, error } = useTreatmentSequenceModels(allSequenceSources, currentStep, sequenceSteps)


  // Filter nulls for functions that need a clean array
  const validGeometries = useMemo(
    () => loadedGeometries.filter((g): g is THREE.BufferGeometry => g !== null),
    [loadedGeometries]
  )
  const loadedGeometryCount = useMemo(() => validGeometries.length, [validGeometries])

  const treatmentFitRadius = useMemo(() => getSequenceFitRadius(validGeometries), [validGeometries])
  const sceneScale = (sequenceGlbUrl || hasTreatmentSequence) ? 1 : activeTool === 'occlusal' ? 0.78 : 1.55

  // DEBUG HOOK: We capture camera position in useFrame
  const [debugCam, setDebugCam] = useState('0,0,0')

  return (
    <div className="relative h-full w-full bg-transparent">
      {hasTreatmentSequence && isLoading && (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center px-4">
          <div className="rounded-full border border-outline-variant/60 bg-card/88 px-4 py-2 text-xs font-semibold text-on-surface shadow-lg backdrop-blur-xl flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
            <span className="tracking-wide">Loading Treatment Models... ({loadedGeometryCount}/{sequenceSteps.length})</span>
          </div>
        </div>
      ) /* Changed this condition to only show if sequenceSteps.length > 0 */}
      {hasTreatmentSequence && error && (
        <div className="pointer-events-none absolute right-4 top-20 z-30 max-w-md">
          <div className="rounded-2xl border border-amber-400/30 bg-slate-950/88 px-4 py-3 text-sm text-amber-100 shadow-xl backdrop-blur-xl">
            {error}
          </div>
        </div>
      )}
      <ViewerErrorBoundary>
        <Canvas
          camera={{ position: [0, -11.82, 1.52], fov: 42 }}
          dpr={1}
          gl={{
            powerPreference: "high-performance",
            antialias: false,
            preserveDrawingBuffer: true,
            alpha: true
          }}
          onCreated={({ gl, scene }) => {
            console.log('WebGL Renderer Activity: Created successfully')
            scene.background = new THREE.Color('#0a1114') // Explicit dark background
          }}
        >

          <color attach="background" args={['#1e293b']} />
          <ambientLight intensity={1.2} />
          <hemisphereLight args={['#efe7df', '#291d1d', 0.8]} />
          <spotLight
            position={[4, 10, 10]}
            angle={0.34}
            penumbra={0.65}
            intensity={80}
          />
          <spotLight position={[-7, 4, 6]} angle={0.48} penumbra={0.5} intensity={28} />
          <pointLight position={[0, 2.2, 5.5]} intensity={10} color="#f4ebe6" />

          <group scale={sceneScale}>
            {sequenceGlbUrl ? (
              <GlbSequenceScene url={sequenceGlbUrl} currentStep={currentStep} />
            ) : (
              hasTreatmentSequence && (
                <TreatmentSequenceScene
                  preparedGeometries={loadedGeometries}
                  activeTool={activeTool}
                  occlusionConfig={occlusionConfig}
                />
              )
            )}
            {(activeTool === 'grid' || activeTool === 'occlusal') && <MeasurementGrid gridPosition={activeTool === 'grid' ? gridPosition : 'back'} />}
            {activeTool === 'grid' && <OcclusalPlane />}
          </group>

          {/* <ContactShadows position={[0, -2.15, 0]} opacity={0.35} scale={14} blur={2.4} far={4.5} /> */}
          <FrontViewCamera config={viewConfig} enableControls={true} />
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
