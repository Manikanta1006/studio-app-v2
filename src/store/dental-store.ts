import { create } from 'zustand'

export interface ToothData {
  number: string
  name: string
  position: { x: number; y: number; z: number }
  rotation: number
  movement?: {
    rotation: number
    translationX: number
    translationY: number
    translationZ: number
  }
}

export interface TreatmentStep {
  id: number
  name: string
  description: string
  status: 'pending' | 'completed'
  toothMovements: Map<string, ToothData>
  modelUrl?: string
  fallbackModelUrl?: string
}

function createRemoteModelProxyUrl(url: string) {
  return `/api/remote-model?url=${encodeURIComponent(url)}`
}

function createRemoteModelSource(url: string) {
  return {
    modelUrl: url,
    fallbackModelUrl: createRemoteModelProxyUrl(url),
  }
}

export interface CaseData {
  id: string
  caseNumber: string
  patientName: string
  status: string
  versions: Array<{
    id: string
    versionNumber: string
    createdAt: string
  }>
}

interface DentalStore {
  currentCase: CaseData | null
  setCase: (caseData: CaseData | null) => void

  steps: TreatmentStep[]
  currentStep: number
  setSteps: (steps: TreatmentStep[]) => void
  setCurrentStep: (step: number) => void

  sequenceGlbUrl: string | null
  setSequenceGlbUrl: (url: string | null) => void

  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  playInterval: ReturnType<typeof setInterval> | null
  startAutoPlay: () => void
  stopAutoPlay: () => void

  selectedTooth: ToothData | null
  setSelectedTooth: (tooth: ToothData | null) => void

  activeTool: string | null
  setActiveTool: (tool: string | null) => void

  viewState: {
    rotation: { x: number; y: number }
    zoom: number
  }
  setViewState: (state: { rotation: { x: number; y: number }; zoom: number }) => void

  upperJawFile: File | null
  lowerJawFile: File | null
  setUpperJawFile: (file: File | null) => void
  setLowerJawFile: (file: File | null) => void

  isUploading: boolean
  uploadProgress: number
  setIsUploading: (uploading: boolean) => void
  setUploadProgress: (progress: number) => void

  activeTab: 'comments' | 'notes' | 'media' | 'occlusion'
  setActiveTab: (tab: 'comments' | 'notes' | 'media') => void
}

type Jaw = 'upper' | 'lower'
type ToothKind = 'molar' | 'premolar' | 'canine' | 'incisor'

interface ArchOptions {
  jaw: Jaw
  centerY: number
  frontDepth: number
  backDepth: number
  halfWidth: number
  verticalLift: number
  centerGap: number
}

const upperToothNames = [
  'Upper Right Third Molar (Wisdom)',
  'Upper Right Second Molar',
  'Upper Right First Molar',
  'Upper Right Second Premolar',
  'Upper Right First Premolar',
  'Upper Right Canine',
  'Upper Right Lateral Incisor',
  'Upper Right Central Incisor',
  'Upper Left Central Incisor',
  'Upper Left Lateral Incisor',
  'Upper Left Canine',
  'Upper Left First Premolar',
  'Upper Left Second Premolar',
  'Upper Left First Molar',
  'Upper Left Second Molar',
  'Upper Left Third Molar (Wisdom)',
]

const lowerToothNames = [
  'Lower Right Third Molar (Wisdom)',
  'Lower Right Second Molar',
  'Lower Right First Molar',
  'Lower Right Second Premolar',
  'Lower Right First Premolar',
  'Lower Right Canine',
  'Lower Right Lateral Incisor',
  'Lower Right Central Incisor',
  'Lower Left Central Incisor',
  'Lower Left Lateral Incisor',
  'Lower Left Canine',
  'Lower Left First Premolar',
  'Lower Left Second Premolar',
  'Lower Left First Molar',
  'Lower Left Second Molar',
  'Lower Left Third Molar (Wisdom)',
]

const upperNumbers = Array.from({ length: 16 }, (_, index) => `${index + 1}`)
const lowerNumbers = Array.from({ length: 16 }, (_, index) => `${32 - index}`)

function getToothKind(number: string): ToothKind {
  const molars = new Set(['1', '2', '3', '14', '15', '16', '17', '18', '19', '30', '31', '32'])
  const premolars = new Set(['4', '5', '12', '13', '20', '21', '28', '29'])
  const canines = new Set(['6', '11', '22', '27'])

  if (molars.has(number)) {
    return 'molar'
  }

  if (premolars.has(number)) {
    return 'premolar'
  }

  if (canines.has(number)) {
    return 'canine'
  }

  return 'incisor'
}

function buildArchTeeth(
  numbers: string[],
  names: string[],
  options: ArchOptions
): ToothData[] {
  return numbers.map((number, index) => {
    const isRightSide = index < 8
    const sideDirection = isRightSide ? -1 : 1
    const sideIndex = isRightSide ? 7 - index : index - 8
    const archProgress = sideIndex / 7
    const x = sideDirection * (options.centerGap + Math.pow(archProgress, 0.92) * options.halfWidth)
    const z =
      options.frontDepth -
      Math.pow(archProgress, 1.4) * (options.frontDepth + options.backDepth)
    const y =
      options.centerY +
      (options.jaw === 'upper' ? 1 : -1) *
        (0.06 + Math.pow(archProgress, 1.3) * options.verticalLift)
    const rotation = sideDirection * -(4 + archProgress * 50)

    return {
      number,
      name: names[index],
      position: {
        x,
        y,
        z,
      },
      rotation,
    }
  })
}

function getMovementPattern(tooth: ToothData, index: number, jaw: Jaw) {
  const kind = getToothKind(tooth.number)
  const isRightSide = index < 8
  const sideDirection = isRightSide ? -1 : 1

  const kindProfiles: Record<
    ToothKind,
    { expansion: number; vertical: number; rotation: number; sagittal: number }
  > = {
    molar: { expansion: 0.03, vertical: 0.01, rotation: 0.8, sagittal: 0.01 },
    premolar: { expansion: 0.05, vertical: 0.015, rotation: 1.6, sagittal: 0.015 },
    canine: { expansion: 0.07, vertical: 0.02, rotation: 2.8, sagittal: 0.035 },
    incisor: { expansion: 0.045, vertical: 0.018, rotation: 2.2, sagittal: 0.045 },
  }

  const profile = kindProfiles[kind]
  const crowdingFactor =
    kind === 'incisor' ? 1 : kind === 'canine' ? 0.82 : kind === 'premolar' ? 0.55 : 0.35

  return {
    rotation: profile.rotation * sideDirection * crowdingFactor,
    translationX: profile.expansion * sideDirection,
    translationY: profile.vertical * (jaw === 'upper' ? 1 : -1),
    translationZ:
      profile.sagittal * (jaw === 'upper' ? 1 : -1) * (kind === 'molar' ? 0.4 : 1),
  }
}

export const defaultUpperTeeth = buildArchTeeth(upperNumbers, upperToothNames, {
  jaw: 'upper',
  centerY: 1.08,
  frontDepth: 2.25,
  backDepth: 1.9,
  halfWidth: 4.7,
  verticalLift: 0.34,
  centerGap: 0.42,
})

export const defaultLowerTeeth = buildArchTeeth(lowerNumbers, lowerToothNames, {
  jaw: 'lower',
  centerY: -0.62,
  frontDepth: 1.9,
  backDepth: 1.7,
  halfWidth: 4.15,
  verticalLift: 0.28,
  centerGap: 0.32,
})

export function generateDefaultSteps(): TreatmentStep[] {
  return Array.from({ length: 17 }, (_, index) => {
    const stepId = index + 1
    const progress = index / 16
    const eased = Math.sin(progress * Math.PI * 0.5)
    const toothMovements = new Map<string, ToothData>()

    defaultUpperTeeth.forEach((tooth, toothIndex) => {
      const pattern = getMovementPattern(tooth, toothIndex, 'upper')
      toothMovements.set(tooth.number, {
        ...tooth,
        movement: {
          rotation: pattern.rotation * eased,
          translationX: pattern.translationX * eased,
          translationY: pattern.translationY * eased,
          translationZ: pattern.translationZ * eased,
        },
      })
    })

    defaultLowerTeeth.forEach((tooth, toothIndex) => {
      const pattern = getMovementPattern(tooth, toothIndex, 'lower')
      toothMovements.set(tooth.number, {
        ...tooth,
        movement: {
          rotation: pattern.rotation * eased,
          translationX: pattern.translationX * eased,
          translationY: pattern.translationY * eased,
          translationZ: pattern.translationZ * eased,
        },
      })
    })

    return {
      id: stepId,
      name: `Step ${stepId}`,
      description:
        stepId === 1
          ? 'Initial bite setup'
          : stepId === 17
            ? 'Final occlusion and alignment'
            : `Treatment progression - aligner ${stepId}`,
      status: stepId <= 5 ? 'completed' : 'pending',
      toothMovements,
    }
  })
}

const lahariTreatmentSequence = [
  {
    name: 'Occlusion Scan',
    description: 'Initial occlusion scan',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/21-03-2025-sai%20lahari/21-03-2025-sai%20lahari-occlusionfirst.stl'
    ),
  },
  {
    name: 'Print Model 01',
    description: 'Lower jaw treatment model 01',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/print%20files/Lahari%20Lower%20jaw%20-%2001%20-%20Model.stl'
    ),
  },
  {
    name: 'Print Model 02',
    description: 'Lower jaw treatment model 02',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/print%20files/Lahari%20Lower%20jaw%20-%2002%20-%20Model.stl'
    ),
  },
  {
    name: 'Print Model 03',
    description: 'Lower jaw treatment model 03',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/print%20files/Lahari%20Lower%20jaw%20-%2003%20-%20Model.stl'
    ),
  },
  {
    name: 'Print Model 04',
    description: 'Lower jaw treatment model 04',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/print%20files/Lahari%20Lower%20jaw%20-%2004%20-%20Model.stl'
    ),
  },
  {
    name: 'Print Model 05',
    description: 'Lower jaw treatment model 05',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/print%20files/Lahari%20Lower%20jaw%20-%2005%20-%20Model.stl'
    ),
  },
  {
    name: 'Print Model 06',
    description: 'Lower jaw treatment model 06',
    ...createRemoteModelSource(
      'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/print%20files/Lahari%20Lower%20jaw%20-%2006%20-%20Model.stl'
    ),
  },
] as const

export function generateRemoteSequenceSteps(): TreatmentStep[] {
  return lahariTreatmentSequence.map((step, index) => ({
    id: index + 1,
    name: step.name,
    description: step.description,
    status: index === 0 ? 'completed' : 'pending',
    toothMovements: new Map<string, ToothData>(),
    modelUrl: step.modelUrl,
    fallbackModelUrl: step.fallbackModelUrl,
  }))
}

export const useDentalStore = create<DentalStore>((set, get) => ({
  currentCase: null,
  setCase: (caseData) => set({ currentCase: caseData }),

  steps: generateRemoteSequenceSteps(),
  currentStep: 1,
  setSteps: (steps) => set({ steps }),
  setCurrentStep: (step) => set({ currentStep: step }),

  sequenceGlbUrl: null,
  setSequenceGlbUrl: (url) => set({ sequenceGlbUrl: url }),

  isPlaying: false,
  playInterval: null,
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  startAutoPlay: () => {
    const { playInterval } = get()

    if (playInterval) {
      clearInterval(playInterval)
    }

    const interval = setInterval(() => {
      const { currentStep, steps } = get()

      if (currentStep >= steps.length) {
        clearInterval(interval)
        set({ isPlaying: false, playInterval: null })
        return
      }

      set({ currentStep: currentStep + 1 })
    }, 1500)

    set({ isPlaying: true, playInterval: interval })
  },

  stopAutoPlay: () => {
    const { playInterval } = get()

    if (playInterval) {
      clearInterval(playInterval)
    }

    set({ isPlaying: false, playInterval: null })
  },

  selectedTooth: null,
  setSelectedTooth: (tooth) => set({ selectedTooth: tooth }),

  activeTool: null,
  setActiveTool: (tool) => set({ activeTool: tool }),

  viewState: {
    rotation: { x: 0, y: 0 },
    zoom: 1,
  },
  setViewState: (state) => set({ viewState: state }),

  upperJawFile: null,
  lowerJawFile: null,
  setUpperJawFile: (file) => set({ upperJawFile: file }),
  setLowerJawFile: (file) => set({ lowerJawFile: file }),

  isUploading: false,
  uploadProgress: 0,
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  activeTab: 'comments',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
