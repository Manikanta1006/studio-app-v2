import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ViewPresetKey, VIEW_PRESETS } from '@/lib/frontView'

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

export interface UploadedModel {
  id: string
  name: string
  type: 'upper' | 'lower' | 'step'
  url: string
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

  uploadedModels: UploadedModel[]
  setUploadedModels: (models: UploadedModel[]) => void

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

  gridPosition: 'front' | 'back'
  setGridPosition: (position: 'front' | 'back') => void

  viewState: {
    rotation: { x: number; y: number }
    zoom: number
  }
  setViewState: (state: { rotation: { x: number; y: number }; zoom: number }) => void

  activeTab: 'comments' | 'notes' | 'media'
  setActiveTab: (tab: 'comments' | 'notes' | 'media') => void

  archVisibility: { upper: boolean; lower: boolean }
  setArchVisibility: (visibility: { upper: boolean; lower: boolean } | ((prev: { upper: boolean; lower: boolean }) => { upper: boolean; lower: boolean })) => void

  // Occlusion metrics
  occlusionMetrics: {
    effectiveOverbite: number
    anteroposteriorRelationship: string
    verticalRelationship: string
    occlusionQuality: number
    recommendations: string[]
    isValid: boolean
  } | null
  setOcclusionMetrics: (metrics: DentalStore['occlusionMetrics']) => void

  // View preset for camera positioning
  viewPreset: ViewPresetKey
  setViewPreset: (preset: ViewPresetKey) => void
}


const sowmyaTreatmentSequence = [
  {
    name: 'Lower Model 01',
    description: 'Lower jaw treatment model 01',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Lower%20jaw%20-%2001%20-%20Model.stl'
    ),
  },
  {
    name: 'Lower Model 02',
    description: 'Lower jaw treatment model 02',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Lower%20jaw%20-%2002%20-%20Model.stl'
    ),
  },
  {
    name: 'Lower Model 03',
    description: 'Lower jaw treatment model 03',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Lower%20jaw%20-%2003%20-%20Model.stl'
    ),
  },
  {
    name: 'Lower Model 04',
    description: 'Lower jaw treatment model 04',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Lower%20jaw%20-%2004%20-%20Model.stl'
    ),
  },
  {
    name: 'Upper Model 01',
    description: 'Upper jaw treatment model 01',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Upper%20jaw%20-%2001%20-%20Model.stl'
    ),
  },
  {
    name: 'Upper Model 02',
    description: 'Upper jaw treatment model 02',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Upper%20jaw%20-%2002%20-%20Model.stl'
    ),
  },
  {
    name: 'Upper Model 03',
    description: 'Upper jaw treatment model 03',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Upper%20jaw%20-%2003%20-%20Model.stl'
    ),
  },
  {
    name: 'Upper Model 04',
    description: 'Upper jaw treatment model 04',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Upper%20jaw%20-%2004%20-%20Model.stl'
    ),
  },
  {
    name: 'Upper Model 05',
    description: 'Upper jaw treatment model 05',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Upper%20jaw%20-%2005%20-%20Model.stl'
    ),
  },
  {
    name: 'Upper Model 06',
    description: 'Upper jaw treatment model 06',
    ...createRemoteModelSource(
      'https://smileguide-r2-browser.smileguide-95e.workers.dev/files/Sowmya%20Upper%20jaw%20-%2006%20-%20Model.stl'
    ),
  },
] as const

export function generateRemoteSequenceSteps(): TreatmentStep[] {
  return sowmyaTreatmentSequence.map((step, index) => ({
    id: index + 1,
    name: step.name,
    description: step.description,
    status: index === 0 ? 'completed' : 'pending',
    toothMovements: new Map<string, ToothData>(),
    modelUrl: step.modelUrl,
    fallbackModelUrl: step.fallbackModelUrl,
  }))
}

function buildUploadedSequenceSteps(models: UploadedModel[]): TreatmentStep[] {
  const counters = {
    upper: 0,
    lower: 0,
    step: 0,
  }

  return models.map((model, index) => {
    counters[model.type] += 1
    const order = counters[model.type]
    const stepLabel = String(order).padStart(2, '0')

    const name =
      model.type === 'upper'
        ? `Upper Upload ${stepLabel}`
        : model.type === 'lower'
          ? `Lower Upload ${stepLabel}`
          : `Treatment Step ${stepLabel}`

    const description =
      model.type === 'step'
        ? `Uploaded treatment file: ${model.name}`
        : `Uploaded ${model.type} arch: ${model.name}`

    return {
      id: index + 1,
      name,
      description,
      status: index === 0 ? 'completed' : 'pending',
      toothMovements: new Map<string, ToothData>(),
      modelUrl: model.url,
    }
  })
}

export const useDentalStore = create<DentalStore>()(
  persist((set, get) => ({
  currentCase: null,
  setCase: (caseData) => set({ currentCase: caseData }),

  steps: generateRemoteSequenceSteps(),
  currentStep: 1,
  setSteps: (steps) => set({ steps }),
  setCurrentStep: (step) => set({ currentStep: step }),

  uploadedModels: [],
  setUploadedModels: (models) =>
    set((state) => {
      const nextSteps = models.length > 0 ? buildUploadedSequenceSteps(models) : generateRemoteSequenceSteps()
      const nextCurrentStep = nextSteps.length === 0 ? 1 : Math.min(state.currentStep, nextSteps.length)

      if (state.playInterval) {
        clearInterval(state.playInterval)
      }

      return {
        uploadedModels: models,
        steps: nextSteps,
        currentStep: nextCurrentStep,
        isPlaying: false,
        playInterval: null,
        sequenceGlbUrl: null,
      }
    }),

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

  gridPosition: 'back',
  setGridPosition: (position) => set({ gridPosition: position }),

  viewState: {
    rotation: { x: 0, y: 0 },
    zoom: 1,
  },
  setViewState: (state) => set({ viewState: state }),

  activeTab: 'comments',
  setActiveTab: (tab) => set({ activeTab: tab }),

  archVisibility: { upper: true, lower: true },
  setArchVisibility: (visibility) => set((state) => ({ 
    archVisibility: typeof visibility === 'function' ? visibility(state.archVisibility) : visibility 
  })),

  occlusionMetrics: null,
  setOcclusionMetrics: (metrics) => set({ occlusionMetrics: metrics }),

  viewPreset: 'FRONT' as ViewPresetKey,
  setViewPreset: (preset) => set({ viewPreset: preset }),
}),
{
  name: 'dental-studio-uploaded-models',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    uploadedModels: state.uploadedModels,
    currentStep: state.currentStep,
    archVisibility: state.archVisibility,
    viewPreset: state.viewPreset,
  }),
  merge: (persistedState, currentState) => {
    const persisted = persistedState as Partial<DentalStore>
    const uploadedModels = persisted.uploadedModels ?? currentState.uploadedModels
    const steps = uploadedModels.length > 0 ? buildUploadedSequenceSteps(uploadedModels) : currentState.steps
    const currentStep = steps.length === 0 ? 1 : Math.min(persisted.currentStep ?? currentState.currentStep, steps.length)

    return {
      ...currentState,
      ...persisted,
      uploadedModels,
      steps,
      currentStep,
      sequenceGlbUrl: null,
      isPlaying: false,
      playInterval: null,
    }
  },
})
)
