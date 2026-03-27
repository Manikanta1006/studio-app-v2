'use client'

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { FrontViewConfig, getCameraConfig } from '@/lib/frontView'

interface FrontViewCameraProps {
  config: FrontViewConfig
  enableControls?: boolean
  transitionDuration?: number
}

export function FrontViewCamera({
  config,
  enableControls = true,
  transitionDuration = 800,
}: FrontViewCameraProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const transitionStartTime = useRef<number | null>(null)
  const startPosition = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3())
  const targetTarget = useRef(new THREE.Vector3())

  const cameraConfig = getCameraConfig(config)

  useEffect(() => {
    // Store starting position
    startPosition.current.copy(camera.position)
    if (controlsRef.current) {
      startTarget.current.copy(controlsRef.current.target)
    }

    // Set target position
    targetPosition.current.copy(cameraConfig.position)
    targetTarget.current.copy(cameraConfig.lookAt)

    // Start transition
    transitionStartTime.current = Date.now()

    // Set initial camera FOV
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = cameraConfig.fov
      camera.updateProjectionMatrix()
    }
  }, [config, camera, cameraConfig])

  useFrame(() => {
    if (transitionStartTime.current === null) return

    const elapsed = Date.now() - transitionStartTime.current
    const progress = Math.min(elapsed / transitionDuration, 1)

    // Easing function for smooth transition
    const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress

    // Interpolate camera position
    camera.position.lerpVectors(startPosition.current, targetPosition.current, easeProgress)

    // Interpolate orbit controls target
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(startTarget.current, targetTarget.current, easeProgress)
      controlsRef.current.update()
    }

    // Complete transition
    if (progress >= 1) {
      camera.position.copy(targetPosition.current)
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetTarget.current)
      }
      transitionStartTime.current = null
    }
  })

  if (!enableControls) {
    return null
  }

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableRotate={true}
      enableZoom={true}
      minDistance={2}
      maxDistance={20}
      zoomSpeed={1.0}
      rotateSpeed={1.0}
      dampingFactor={0.05}
      enableDamping={true}
    />
  )
}

export default FrontViewCamera
