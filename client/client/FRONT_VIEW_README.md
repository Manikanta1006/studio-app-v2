# Front View System Documentation

## Overview

The Front View System provides multiple camera presets and occlusion configurations optimized for viewing dental cases from different angles. It's designed to mirror real clinical examination positions and provide accurate occlusion visualization.

## View Presets

### 1. **FRONT - Standard Front View** (Default)
- **Camera Position**: Centered (X=0), slightly above midline (Y=0.4), at distance (Z=8.2)
- **Best For**: Overall occlusion assessment, smile line evaluation, midline checking
- **Occlusion Settings**:
  - Overbite: 2.0mm
  - Overjet: 2.4mm
  - Upper Jaw Y: 0.9
  - Lower Jaw Y: -0.9
  - FOV: 40°

**Use Case**: 
- Initial case assessment
- Treatment progress evaluation
- Patient communication
- Smile aesthetics analysis

---

### 2. **FRONT_CLOSEUP - Detailed Front View**
- **Camera Position**: Centered (X=0), at Z=4.5 (closer zoom)
- **Best For**: Detailed analysis of anterior teeth, incisor alignment, diastema checking
- **Occlusion Settings**:
  - Overbite: 2.2mm (slightly increased for detail)
  - Overjet: 2.4mm
  - Upper Jaw Y: 0.95
  - Lower Jaw Y: -0.95
  - FOV: 35°

**Use Case**:
- Detailed incisor positioning check
- Interproximal contact analysis
- Fine-tuning anterior guidance
- Treatment plan refinement

---

### 3. **SIDE - Lateral View**
- **Camera Position**: From right side (X=6.5), height (Y=0.4), slight depth (Z=1.2)
- **Best For**: Sagittal plane assessment, overjet-overbite relationship, Class II/III evaluation
- **Occlusion Settings**:
  - Overbite: 2.0mm
  - Overjet: 2.4mm
  - FOV: 40°

**Use Case**:
- Anterior-posterior relationship check
- Class I, II, III classification
- Profile assessment
- Molar relationship evaluation

**Tips**:
- Rotate view 180° to see from left side
- Good for detecting crossbites
- Useful for asymmetry evaluation

---

### 4. **OCCLUSAL - Looking Up at Occlusal Surface**
- **Camera Position**: Below jaws (X=0, Y=-3.0), looking up at occlusal plane
- **Best For**: Cusp-fossa relationships, intercuspation, buccal-lingual relationships
- **Occlusion Settings**:
  - Overbite: 2.0mm
  - Overjet: 2.4mm
  - FOV: 35°

**Use Case**:
- Cusp positioning verification
- Posterior intercuspation assessment
- Arch form evaluation
- Transverse dimension checking

**Tips**:
- Can rotate around X axis to see different segments
- Useful for detecting rotations
- Good for buccal-lingual bucket analysis

---

## Occlusion Configuration Parameters

### Vertical Parameters
- **overbite**: Vertical overlap of upper front teeth (typical: 1.2-3.2mm)
- **occlusionHeight**: Y position of occlusion plane (reference: 0)

### Horizontal Parameters
- **overjet**: Horizontal distance front-to-back (typical: 2-3mm)
- **gapAtMolars**: Space at molars when front teeth meet (typical: 0.5-1mm)

### Jaw Positioning
- **upperJawY**: Vertical offset for upper jaw
- **lowerJawY**: Vertical offset for lower jaw
- Formula: `gap = upperJawY - (lowerJawY)` = total separation

### Plane Angles (in radians)
- **upperIncisialPlaneAngle**: Tilt of upper front teeth
- **upperOcclusalPlaneAngle**: Tilt of upper back teeth
- **lowerIncisialPlaneAngle**: Tilt of lower front teeth
- **lowerOcclusalPlaneAngle**: Tilt of lower back teeth

**Conversion**: 1 radian ≈ 57.3 degrees

---

## Using View Presets

### In React Components

```typescript
import { useDentalStore } from '@/store/dental-store'
import { VIEW_PRESETS } from '@/lib/frontView'

export default function MyComponent() {
  const { viewPreset, setViewPreset } = useDentalStore()
  
  // Get current view config
  const currentConfig = VIEW_PRESETS[viewPreset]
  
  // Switch view
  const handleSwitchView = () => {
    setViewPreset('FRONT_CLOSEUP')
  }
  
  return (
    <div>
      <button onClick={handleSwitchView}>
        Switch to Close-up View
      </button>
      <p>Current: {viewPreset}</p>
      <p>Overbite: {currentConfig.occlusion.overbite * 10}mm</p>
    </div>
  )
}
```

### Available Views
```typescript
{
  FRONT,           // Standard front view
  FRONT_CLOSEUP,   // Detailed zoom
  SIDE,            // Lateral view
  OCCLUSAL,        // From below
}
```

---

## Front View Camera Component

The `FrontViewCamera` component handles smooth transitions between views.

### Props
```typescript
interface FrontViewCameraProps {
  config: FrontViewConfig      // View configuration
  enableControls?: boolean     // Allow user interaction (default: true)
  transitionDuration?: number  // Animation time in ms (default: 800)
}
```

### Usage
```typescript
import FrontViewCamera from '@/components/dental/FrontViewCamera'
import { FRONT_VIEW_CONFIG } from '@/lib/frontView'

<Canvas>
  {/* ... scene content ... */}
  <FrontViewCamera 
    config={FRONT_VIEW_CONFIG}
    enableControls={true}
    transitionDuration={600}
  />
</Canvas>
```

---

## View Selector UI Component

The `ViewSelector` component provides an interactive UI for switching between views.

### Features
- Visual preview of each view
- Current view indicator
- Occlusion metrics display
- Quick access to all presets

### Integration
```typescript
import ViewSelector from '@/components/dental/ViewSelector'

export default function ControlPanel() {
  return (
    <div className="sidebar">
      <ViewSelector />
    </div>
  )
}
```

---

## Clinical Guidelines

### Front View Assessment
✓ Check midline alignment
✓ Evaluate smile arc
✓ Assess buccal corridors
✓ Check incisor show at rest
✓ Verify molar buccal cusps alignment

### Side View Assessment
✓ Confirm overjet (2-3mm ideal)
✓ Check overbite (1.2-3.2mm ideal)
✓ Evaluate Class I/II/III relationship
✓ Assess concavity/convexity
✓ Check lower incisor exposure

### Occlusal View Assessment
✓ Verify cusp-fossa relationships
✓ Check arch form symmetry
✓ Evaluate intercuspation
✓ Assess buccal-lingual dimensions
✓ Check for rotations

---

## Customizing Views

### Create Custom View Preset

```typescript
import { FrontViewConfig } from '@/lib/frontView'

const CUSTOM_VIEW: FrontViewConfig = {
  cameraPosition: {
    x: 2.0,      // Offset to right
    y: 0.5,      // Higher position
    z: 6.0,      // Closer zoom
  },
  cameraLookAt: {
    x: 0,
    y: 0.25,
    z: 0,
  },
  
  occlusion: {
    overjet: 0.28,           // 2.8mm
    overbite: 0.25,          // 2.5mm
    gapAtMolars: 0.12,       // 1.2mm
    occlusionHeight: 0.3,
    
    upperJawY: 1.0,
    lowerJawY: -1.0,
    
    upperIncisialPlaneAngle: 0.07,
    upperOcclusalPlaneAngle: 0.035,
    lowerIncisialPlaneAngle: 0.09,
    lowerOcclusalPlaneAngle: 0.045,
  },
  
  verticalCenter: 0.25,
  horizontalShift: 2.0,
  zoomDistance: 6.0,
}

// Use it
const { setViewPreset } = useDentalStore()
// Note: Would need to extend store to support custom presets
```

---

## Troubleshooting

### View Not Updating
**Problem**: Camera doesn't move when changing views

**Solution**:
```typescript
// Ensure viewPreset state is updating
const { viewPreset, setViewPreset } = useDentalStore()

console.log('Current preset:', viewPreset)
setViewPreset('FRONT_CLOSEUP')  // Verify this works
```

### Teeth Not Visible
**Problem**: Geometry not showing in selected view

**Solution**:
- Check that geometries are loaded
- Verify archVisibility settings
- Ensure camera z-position is not too close to geometry

### Occlusion Looks Wrong
**Problem**: Teeth don't appear to meet properly

**Solution**:
1. Check overbite value (typical: 1.2-3.2mm)
2. Verify jaw Y positions
3. Review geometry bounding boxes
4. Check for geometry rotation issues

---

## Performance Tips

- View transitions use smooth easing function (quadratic in-out)
- Camera updates only when view preset changes
- Geometry culling prevents unnecessary rendering
- Transition time: 800ms default (customizable)

---

## Future Enhancements

- [ ] Custom view preset saving
- [ ] Animate between multiple views
- [ ] Measurement tools per view
- [ ] Screenshot/export for each view
- [ ] Preset positioning with landmarks
- [ ] Multi-angle analysis reports
