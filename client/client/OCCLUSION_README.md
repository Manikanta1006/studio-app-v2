# Dental Occlusion System Documentation

## Overview

The Dental Occlusion System is a comprehensive set of utilities for calculating, analyzing, and visualizing proper teeth alignment between upper and lower jaws. It implements real dental biomechanics to ensure accurate orthodontic visualization and treatment planning.

## Core Concepts

### Occlusion Parameters

**Overjet**
- Horizontal distance between upper and lower front teeth
- Typical range: 2-3mm
- Measured anteroposteriorly (front-to-back)

**Overbite**
- Vertical overlap of upper front teeth over lower front teeth
- Typical range: 1.2-3.2mm
- Critical for proper bite closure

**Occlusion Plane**
- The imaginary plane where teeth meet during closure
- Reference point at Y=0 in 3D space
- Used for measuring other dental relationships

**Molar Relationship**
- How first molars occlude between arches
- Can indicate Class I, II, or III occlusion

## File Structure

```
├── lib/
│   └── occlusion.ts           # Core occlusion calculations
├── components/dental/
│   ├── DentalViewer.tsx        # Main 3D viewer with occlusion
│   ├── OcclusionAnalysis.tsx   # Display occlusion metrics
│   └── OcclusionSettings.tsx   # Customize occlusion parameters
└── store/
    └── dental-store.ts        # Zustand store with occlusion state
```

## Key Functions

### calculateOcclusionY()

Calculates proper Y positions for upper and lower jaw to achieve ideal occlusion.

```typescript
const { upperY, lowerY } = calculateOcclusionY(
  upperGeometry,
  lowerGeometry,
  DEFAULT_OCCLUSION_CONFIG
);
```

**Parameters:**
- `upperGeometry`: THREE.BufferGeometry for upper jaw
- `lowerGeometry`: THREE.BufferGeometry for lower jaw
- `config`: OcclusionConfig (optional, uses defaults)

**Returns:**
- `upperY`: Vertical position for upper jaw
- `lowerY`: Vertical position for lower jaw

### getOcclusionMetrics()

Analyzes the occlusion and returns detailed metrics.

```typescript
const metrics = getOcclusionMetrics(
  upperGeometry,
  lowerGeometry,
  upperY,
  lowerY
);
```

**Returns:**
```typescript
{
  effectiveOverbite: number        // Actual overbite measurement
  anteroposteriorRelationship: string  // "Class I", "Class II", etc.
  verticalRelationship: string    // "Normal", "Open Bite", etc.
  occlusionQuality: number        // 0-100 quality score
  recommendations: string[]       // Suggestions for improvement
}
```

### analyzeOcclusionContacts()

Estimates contact points between upper and lower teeth.

```typescript
const contacts = analyzeOcclusionContacts(
  upperGeometry,
  lowerGeometry,
  upperY,
  lowerY,
  contactTolerance  // Optional, default 0.15mm
);
```

**Returns:**
```typescript
{
  contactCountEstimate: number    // Estimated number of contacts
  prematureContacts: number       // Number of premature contacts
  contactAreas: THREE.Box3[]      // Bounding boxes of contact regions
}
```

### estimateContactPoints()

Creates a grid of contact points for visualization.

```typescript
const contactPoints = estimateContactPoints(
  upperGeometry,
  lowerGeometry,
  upperY,
  lowerY,
  numberOfSections  // Optional, default 8
);
```

**Returns:** Array of contact points with intensity values

### validateOcclusion()

Checks if occlusion is within acceptable ranges.

```typescript
const isValid = validateOcclusion(metrics);
```

**Returns:** Boolean - true if occlusion is valid, false if adjustments needed

## Configuration

### OcclusionConfig Interface

```typescript
interface OcclusionConfig {
  overjet: number              // 2-3mm typical
  overbite: number             // 1.2-3.2mm typical
  gapAtMolars: number          // 0.5-1mm
  occlusionHeight: number      // Reference plane Y position
  
  upperJawY: number            // Vertical offset
  lowerJawY: number            // Vertical offset
  
  // Rotation angles for tooth plane guidance
  upperIncisalPlaneAngle: number
  upperOcclusalPlaneAngle: number
  lowerIncisalPlaneAngle: number
  lowerOcclusalPlaneAngle: number
}
```

### Default Configuration

```typescript
export const DEFAULT_OCCLUSION_CONFIG: OcclusionConfig = {
  overjet: 0.24,           // 2.4mm
  overbite: 0.18,          // 1.8mm
  gapAtMolars: 0.08,       // 0.8mm
  occlusionHeight: 0,      // At Y=0
  
  upperJawY: 1.2,
  lowerJawY: -1.2,
  
  upperIncisalPlaneAngle: 0.08,
  upperOcclusalPlaneAngle: 0.04,
  lowerIncisalPlaneAngle: 0.10,
  lowerOcclusalPlaneAngle: 0.05,
}
```

## Usage Examples

### Basic Occlusion Setup

```typescript
import { calculateOcclusionY, getOcclusionMetrics } from '@/lib/occlusion'

// In your React component
const { upperY, lowerY } = calculateOcclusionY(
  upperGeometry,
  lowerGeometry
);

const metrics = getOcclusionMetrics(
  upperGeometry,
  lowerGeometry,
  upperY,
  lowerY
);

// Position meshes
<mesh geometry={upperGeometry} position={[0, upperY, 0]} />
<mesh geometry={lowerGeometry} position={[0, lowerY, 0]} />
```

### Custom Occlusion Configuration

```typescript
const customConfig: OcclusionConfig = {
  ...DEFAULT_OCCLUSION_CONFIG,
  overbite: 0.25,      // 2.5mm
  overjet: 0.30,       // 3.0mm
}

const { upperY, lowerY } = calculateOcclusionY(
  upperGeometry,
  lowerGeometry,
  customConfig
)
```

### Display Occlusion Analysis

```typescript
import OcclusionAnalysis from '@/components/dental/OcclusionAnalysis'

export default function MyComponent() {
  return <OcclusionAnalysis />
}
```

### Customize Occlusion Settings

```typescript
import OcclusionSettings from '@/components/dental/OcclusionSettings'

export default function SettingsPanel() {
  return (
    <OcclusionSettings
      config={DEFAULT_OCCLUSION_CONFIG}
      onConfigChange={(newConfig) => {
        // Update your view with new config
      }}
    />
  )
}
```

## Dental Terminology

**Class I Occlusion**
- Ideal molar relationship
- Upper first molar occludes in groove between lower first and second molars

**Class II Occlusion**
- Upper molars positioned anteriorly (forward)
- Often associated with overbite issues

**Class III Occlusion**
- Upper molars positioned posteriorly (back)
- Often called underbite

**Overjet (Horizontal Overlap)**
- Distance between upper and lower incisors measured horizontally
- Normal: 2-3mm
- Increased: >3mm (overjet)
- Decreased: <2mm (edge-to-edge or reversed)

**Overbite (Vertical Overlap)**
- Distance between upper and lower incisors measured vertically
- Normal: 1-3mm
- Increased: >3mm (deep bite)
- Decreased/Negative: (open bite) - front teeth don't overlap

**Occlusion Plane**
- Imaginary plane defined by the biting surfaces of posterior teeth
- In natural dentition, typically slopes upward from front to back ~1.5°

## Occlusion Quality Scoring

The system provides a 0-100 quality score:

- **90-100**: Excellent occlusion, minimal adjustments needed
- **70-89**: Good occlusion, minor refinements recommended
- **50-69**: Fair occlusion, notable adjustments needed
- **Below 50**: Poor occlusion, significant modifications required

## Troubleshooting

### Teeth Not Meeting Properly

**Problem**: Large gap between upper and lower jaw

**Solution**:
```typescript
// Reduce gap by adjusting overbite
const config = {
  ...DEFAULT_OCCLUSION_CONFIG,
  overbite: 0.25  // Increase overbite
}
```

### Teeth Overlapping Too Much

**Problem**: Lower jaw appearing above upper jaw

**Solution**:
```typescript
// Check bounding box calculations
if (!geometry.boundingBox) {
  geometry.computeBoundingBox()
}

// Verify jaw Y positions
console.log({ upperY, lowerY })
```

### Occlusion Analysis Missing

**Problem**: No occlusion metrics showing in UI

**Solution**:
1. Ensure both upper and lower geometries are loaded
2. Check that geometries have valid bounding boxes
3. Use console logs to debug: `console.log('Occlusion Analysis:', metrics)`

## Performance Considerations

- Occlusion calculations run once when geometries load
- Metrics update only when step changes
- Contact point estimation uses simplified algorithm for real-time performance
- High-precision contact analysis available but more computationally expensive

## Future Enhancements

- [ ] Three-point contact analysis
- [ ] Pressure distribution visualization
- [ ] Dynamic occlusion simulation during jaw movement
- [ ] Export occlusion analysis report
- [ ] Bilateral symmetry checking
- [ ] Canine guidance visualization
- [ ] Group function analysis

## References

- American Board of Orthodontics - Occlusion Standards
- Proffit WR, Fields HW, Sarver DM - Contemporary Orthodontics (6th Edition)
- Dental Occlusion: A Practical Guide (various)
