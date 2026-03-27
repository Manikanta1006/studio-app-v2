import * as THREE from 'three'

/**
 * Dental Occlusion System
 * Handles proper alignment of upper and lower jaws with realistic dental occlusion parameters
 */

export interface OcclusionConfig {
  // Vertical spacing
  overjet: number // Horizontal overlap (2-3mm typical)
  overbite: number // Vertical overlap (2-3mm typical)
  gapAtMolars: number // Gap between molars when front teeth meet
  occlusionHeight: number // Y position of occlusion plane
  
  // Jaw positioning
  upperJawY: number
  lowerJawY: number
  
  // Rotation
  upperIncisalPlaneAngle: number // Angle of upper front teeth plane
  upperOcclusalPlaneAngle: number // Angle of upper back teeth plane
  lowerIncisalPlaneAngle: number // Angle of lower front teeth plane
  lowerOcclusalPlaneAngle: number // Angle of lower back teeth plane
}

/**
 * Standard dental occlusion values
 */
export const DEFAULT_OCCLUSION_CONFIG: OcclusionConfig = {
  overjet: 0.25, // 2.4mm in model units
  overbite: 0.25, // 2.5mm in model units - proper overlap
  gapAtMolars: 0.08, // 0.8mm gap
  occlusionHeight: 0, // Occlusion plane at Y=0
  
  upperJawY: 0,      // No gap
  lowerJawY: 0,      // No gap
  
  upperIncisalPlaneAngle: 0.08, // ~4.5 degrees
  upperOcclusalPlaneAngle: 0.04,
  lowerIncisalPlaneAngle: 0.10, // ~5.7 degrees
  lowerOcclusalPlaneAngle: 0.05,
}

/**
 * Calculate proper Y positions for upper and lower jaw to achieve occlusion
 */
export function calculateOcclusionY(
  upperGeometry: THREE.BufferGeometry,
  lowerGeometry: THREE.BufferGeometry,
  config: OcclusionConfig = DEFAULT_OCCLUSION_CONFIG
): { upperY: number; lowerY: number } {
  // Compute bounding boxes
  if (!upperGeometry.boundingBox) upperGeometry.computeBoundingBox()
  if (!lowerGeometry.boundingBox) lowerGeometry.computeBoundingBox()
  
  const upperBB = upperGeometry.boundingBox!
  const lowerBB = lowerGeometry.boundingBox!
  
  // Calculate jaw heights (from bottom to top of each jaw)
  const upperHeight = upperBB.max.y - upperBB.min.y
  const lowerHeight = lowerBB.max.y - lowerBB.min.y
  
  // Position jaws so they meet with proper overbite overlap
  // Upper jaw sits at its configured Y position
  const upperY = config.upperJawY
  
  // Lower jaw sits at its configured Y position
  const lowerY = config.lowerJawY
  
  // The overbite is achieved by vertical overlap at the front teeth
  // Upper front teeth extend down by overbite amount to overlap lower front teeth
  
  console.log('Jaw Positioning:', {
    upperHeight: upperHeight.toFixed(3),
    lowerHeight: lowerHeight.toFixed(3),
    upperY: upperY.toFixed(3),
    lowerY: lowerY.toFixed(3),
    totalGap: (upperY - lowerY).toFixed(3),
    overbite: config.overbite.toFixed(3),
  })
  
  return { upperY, lowerY }
}

/**
 * Create occlusion plane mesh for visualization
 */
export function createOcclusionPlaneMesh(planeWidth = 30, planeLength = 30): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(planeWidth, planeLength, 100, 100)
  const material = new THREE.MeshStandardMaterial({
    color: '#0c3f52',
    transparent: true,
    opacity: 0.08,
    roughness: 1,
    side: THREE.DoubleSide,
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2 // Rotate to horizontal
  mesh.position.y = DEFAULT_OCCLUSION_CONFIG.occlusionHeight
  
  return mesh
}

/**
 * Analyze occlusion contact points between upper and lower jaws
 */
export function analyzeOcclusionContacts(
  upperGeometry: THREE.BufferGeometry,
  lowerGeometry: THREE.BufferGeometry,
  upperY: number,
  lowerY: number,
  contactTolerance = 0.15
): {
  contactCountEstimate: number
  prematureContacts: number
  contactAreas: THREE.Box3[]
} {
  if (!upperGeometry.boundingBox) upperGeometry.computeBoundingBox()
  if (!lowerGeometry.boundingBox) lowerGeometry.computeBoundingBox()
  
  const upperBB = upperGeometry.boundingBox!
  const lowerBB = lowerGeometry.boundingBox!
  
  // Offset by Y positions
  const upperMax = upperBB.max.y + upperY
  const lowerMin = lowerBB.min.y + lowerY
  
  const gap = upperMax - lowerMin
  const contactCountEstimate = gap <= contactTolerance ? 32 : 0 // Estimate contacts
  const prematureContacts = gap < 0 ? Math.floor(Math.abs(gap) * 100) : 0
  
  return {
    contactCountEstimate,
    prematureContacts,
    contactAreas: []
  }
}

/**
 * Get detailed occlusion metrics
 */
export function getOcclusionMetrics(
  upperGeometry: THREE.BufferGeometry,
  lowerGeometry: THREE.BufferGeometry,
  upperY: number,
  lowerY: number
): {
  effectiveOverbite: number
  anteroposteriorRelationship: string
  verticalRelationship: string
  occlusionQuality: number // 0-100
  recommendations: string[]
} {
  if (!upperGeometry.boundingBox) upperGeometry.computeBoundingBox()
  if (!lowerGeometry.boundingBox) lowerGeometry.computeBoundingBox()
  
  const upperBB = upperGeometry.boundingBox!
  const lowerBB = lowerGeometry.boundingBox!
  
  // Calculate positions of tooth surfaces
  const upperMin = upperBB.min.y + upperY  // Top of lower jaw (from upper jaw perspective)
  const upperMax = upperBB.max.y + upperY  // Bottom of upper jaw
  const lowerMin = lowerBB.min.y + lowerY  // Top of lower jaw
  const lowerMax = lowerBB.max.y + lowerY  // Bottom of lower jaw
  
  // Overbite is how much upper teeth overlap lower teeth vertically
  const effectiveOverbite = upperMax - lowerMax
  
  // Gap between jaws (should be near zero for good contact)
  const jawGap = lowerMin - upperMax
  
  const verticalOverlap = lowerMax - lowerMin
  
  const recommendations: string[] = []
  let occlusionQuality = 100
  
  // Check jaw contact
  if (Math.abs(jawGap) < 0.05) {
    recommendations.push('✓ Good tooth contact - jaws properly aligned')
  } else if (jawGap > 0.1) {
    recommendations.push('Jaws too far apart - increase overlap for better contact')
    occlusionQuality -= 25
  } else if (jawGap < -0.1) {
    recommendations.push('Jaws overlapping too much - slight adjustment needed')
    occlusionQuality -= 15
  }
  
  // Check overbite
  if (effectiveOverbite < 1.2) {
    recommendations.push('Increase overbite - currently under 1.2mm')
    occlusionQuality -= 15
  } else if (effectiveOverbite > 3.5) {
    recommendations.push('Reduce overbite - currently over 3.5mm')
    occlusionQuality -= 15
  } else if (effectiveOverbite >= 1.5 && effectiveOverbite <= 3.0) {
    recommendations.push('✓ Overbite within ideal range (1.5-3.0mm)')
  }
  
  // Check vertical relationship
  const verticalDifference = Math.abs(upperBB.max.y - Math.abs(lowerBB.min.y))
  if (verticalDifference > 0.5) {
    recommendations.push('Adjust vertical jaw relationship')
    occlusionQuality -= 10
  }
  
  // No additional recommendations if all good
  if (recommendations.length === 0) {
    recommendations.push('Occlusion is well-aligned')
  }
  
  return {
    effectiveOverbite: Math.max(0, effectiveOverbite),
    anteroposteriorRelationship: effectiveOverbite > 0 ? 'Class I - Normal' : effectiveOverbite < -0.2 ? 'Anterior Open Bite' : 'Edge-to-Edge',
    verticalRelationship: verticalOverlap > 2 ? 'Normal' : verticalOverlap > 1 ? 'Reduced' : 'Open Bite',
    occlusionQuality: Math.max(0, occlusionQuality),
    recommendations
  }
}

/**
 * Apply occlusion rotation to geometries for proper tooth guidance
 */
export function applyOcclusalPlaneRotation(
  geometry: THREE.BufferGeometry,
  isUpper: boolean,
  angleRadians: number
): THREE.BufferGeometry {
  const cloneGeometry = geometry.clone()
  
  // Rotate around X axis to tilt occlusal plane
  // Upper jaw rotates backward, lower jaw rotates forward
  const rotationAngle = isUpper ? -angleRadians : angleRadians
  cloneGeometry.rotateX(rotationAngle)
  cloneGeometry.computeVertexNormals()
  
  return cloneGeometry
}

/**
 * Calculate contact points (simplified - uses geometry bounds as estimate)
 */
export function estimateContactPoints(
  upperGeometry: THREE.BufferGeometry,
  lowerGeometry: THREE.BufferGeometry,
  upperY: number,
  lowerY: number,
  numberOfSections = 8
): Array<{ x: number; y: number; z: number; intensity: number }> {
  if (!upperGeometry.boundingBox) upperGeometry.computeBoundingBox()
  if (!lowerGeometry.boundingBox) lowerGeometry.computeBoundingBox()
  
  const upperBB = upperGeometry.boundingBox!
  const lowerBB = lowerGeometry.boundingBox!
  
  const contactPoints: Array<{ x: number; y: number; z: number; intensity: number }> = []
  
  // Sample contact points along the Z axis (front to back)
  const zMin = Math.max(upperBB.min.z, lowerBB.min.z)
  const zMax = Math.min(upperBB.max.z, lowerBB.max.z)
  const zRange = zMax - zMin
  
  const xMin = Math.max(upperBB.min.x, lowerBB.min.x)
  const xMax = Math.min(upperBB.max.x, lowerBB.max.x)
  
  // Create grid of contact points
  for (let i = 0; i <= numberOfSections; i++) {
    const z = zMin + (zRange / numberOfSections) * i
    
    const upperCenterZ = (upperBB.max.y + upperY + upperBB.min.y + upperY) / 2
    const lowerCenterZ = (lowerBB.max.y + lowerY + lowerBB.min.y + lowerY) / 2
    
    // Contact midpoint between jaws
    const contactY = (upperBB.max.y + upperY + lowerBB.min.y + lowerY) / 2
    
    // Estimate intensity based on proximity
    const gap = Math.abs((upperBB.max.y + upperY) - (lowerBB.min.y + lowerY))
    const intensity = Math.max(0, 1 - gap / 0.5) // Higher intensity when close
    
    contactPoints.push({
      x: 0,
      y: contactY,
      z,
      intensity
    })
  }
  
  return contactPoints.filter(p => p.intensity > 0.2)
}

/**
 * Validate if occlusion is within acceptable ranges
 */
export function validateOcclusion(
  metrics: ReturnType<typeof getOcclusionMetrics>
): boolean {
  // Check if overbite is within normal range (1.2-3.5mm)
  const overbiteValid = metrics.effectiveOverbite >= 1.2 && metrics.effectiveOverbite <= 3.5
  
  // Check quality score
  const qualityValid = metrics.occlusionQuality >= 70
  
  // Check for severe issues in recommendations
  const hasSevereIssues = metrics.recommendations.some(r =>
    r.toLowerCase().includes('severe') || r.toLowerCase().includes('critical')
  )
  
  // Check for good contact indicators
  const hasGoodContact = metrics.recommendations.some(r =>
    r.includes('✓') || r.includes('Good')
  )
  
  return overbiteValid && qualityValid && !hasSevereIssues && (hasGoodContact || metrics.occlusionQuality > 80)
}
