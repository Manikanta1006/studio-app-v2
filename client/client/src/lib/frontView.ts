import * as THREE from 'three'
import { OcclusionConfig } from './occlusion'

/**
 * Front View Camera Presets and Utilities
 * Optimized for viewing teeth occlusion from frontal perspective
 */

export interface FrontViewConfig {
  // Camera position for front view
  cameraPosition: { x: number; y: number; z: number }
  cameraLookAt: { x: number; y: number; z: number }
  
  // Occlusion settings for front view
  occlusion: OcclusionConfig
  
  // View parameters
  verticalCenter: number  // Y position to center teeth vertically
  horizontalShift: number // X position to offset left/right
  zoomDistance: number    // Distance from camera to subject
}

/**
 * Default front view configuration optimized for proper occlusion visualization
 */
export const FRONT_VIEW_CONFIG: FrontViewConfig = {
  cameraPosition: {
    x: 0,      // Centered on X axis
    y: 0.4,    // Slightly above midline
    z: 8.2,    // Distance from teeth
  },
  cameraLookAt: {
    x: 0,      // Look at center
    y: 0.2,    // Look slightly above center
    z: 0,      // At origin depth
  },
  
  occlusion: {
    overjet: 0.25,         // 3.0mm horizontal overlap - REDUCED
    overbite: 0.28,        // 2.8mm vertical overlap - proper contact
    gapAtMolars: 0.08,     // 0.8mm gap at molars
    occlusionHeight: 0,    // Occlusal plane at Y=0
    
    upperJawY: 0,          // NO gap - teeth touching
    lowerJawY: 0,          // NO gap - teeth touching
    
    upperIncisalPlaneAngle: 0.06,    // ~3.4 degrees - less rotation for front view
    upperOcclusalPlaneAngle: 0.03,
    lowerIncisalPlaneAngle: 0.08,    // ~4.6 degrees
    lowerOcclusalPlaneAngle: 0.04,
  },
  
  verticalCenter: 0.2,
  horizontalShift: 0,
  zoomDistance: 8.2,
}

/**
 * Alternative preset: Close-up front view for detailed analysis
 */
export const FRONT_VIEW_CLOSEUP: FrontViewConfig = {
  cameraPosition: {
    x: 0,
    y: 0.3,
    z: 4.5,  // Closer zoom
  },
  cameraLookAt: {
    x: 0,
    y: 0.2,
    z: 0,
  },
  
  occlusion: {
    overjet: 0.25,
    overbite: 0.28,      // Proper contact
    gapAtMolars: 0.08,
    occlusionHeight: 0,
    
    upperJawY: 0,        // NO gap - teeth touching
    lowerJawY: 0,        // NO gap - teeth touching
    
    upperIncisalPlaneAngle: 0.05,
    upperOcclusalPlaneAngle: 0.02,
    lowerIncisalPlaneAngle: 0.07,
    lowerOcclusalPlaneAngle: 0.03,
  },
  
  verticalCenter: 0.2,
  horizontalShift: 0,
  zoomDistance: 4.5,
}

/**
 * View from the side (lateral view)
 */
export const SIDE_VIEW_CONFIG: FrontViewConfig = {
  cameraPosition: {
    x: 6.5,
    y: 0.4,
    z: 1.2,
  },
  cameraLookAt: {
    x: 0,
    y: 0.2,
    z: 0,
  },
  
  occlusion: {
    overjet: 0.25,
    overbite: 0.28,        // Proper contact
    gapAtMolars: 0.08,
    occlusionHeight: 0,
    
    upperJawY: 0,          // NO gap - teeth touching
    lowerJawY: 0,          // NO gap - teeth touching
    
    upperIncisalPlaneAngle: 0.06,
    upperOcclusalPlaneAngle: 0.03,
    lowerIncisalPlaneAngle: 0.08,
    lowerOcclusalPlaneAngle: 0.04,
  },
  
  verticalCenter: 0.2,
  horizontalShift: 0,
  zoomDistance: 6.5,
}

/**
 * View from below (looking up at occlusal surface)
 */
export const OCCLUSAL_VIEW_CONFIG: FrontViewConfig = {
  cameraPosition: {
    x: 0,
    y: -3.0,  // Below teeth
    z: 1.5,
  },
  cameraLookAt: {
    x: 0,
    y: 0,     // Look at center Y=0 where teeth meet
    z: 0,
  },
  
  occlusion: {
    overjet: 0.25,
    overbite: 0.28,        // Proper contact
    gapAtMolars: 0.08,
    occlusionHeight: 0,
    
    upperJawY: 0,          // NO gap - teeth touching
    lowerJawY: 0,          // NO gap - teeth touching
    
    upperIncisalPlaneAngle: 0.06,
    upperOcclusalPlaneAngle: 0.03,
    lowerIncisalPlaneAngle: 0.08,
    lowerOcclusalPlaneAngle: 0.04,
  },
  
  verticalCenter: 0.2,
  horizontalShift: 0,
  zoomDistance: 3.0,
}

/**
 * Adjust camera to front view with proper occlusion
 */
export function getJawPositionsForView(config: FrontViewConfig): { upperY: number; lowerY: number } {
  return {
    upperY: config.occlusion.upperJawY,
    lowerY: config.occlusion.lowerJawY,
  }
}

/**
 * Get camera configuration for a specific view
 */
export function getCameraConfig(config: FrontViewConfig) {
  return {
    position: new THREE.Vector3(config.cameraPosition.x, config.cameraPosition.y, config.cameraPosition.z),
    lookAt: new THREE.Vector3(config.cameraLookAt.x, config.cameraLookAt.y, config.cameraLookAt.z),
    fov: config.zoomDistance > 6 ? 40 : 35,
  }
}

/**
 * List all available view presets
 */
export const VIEW_PRESETS = {
  FRONT: FRONT_VIEW_CONFIG,
  FRONT_CLOSEUP: FRONT_VIEW_CLOSEUP,
  SIDE: SIDE_VIEW_CONFIG,
  OCCLUSAL: OCCLUSAL_VIEW_CONFIG,
} as const

export type ViewPresetKey = keyof typeof VIEW_PRESETS
