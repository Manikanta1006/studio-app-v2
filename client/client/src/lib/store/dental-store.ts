import { create } from 'zustand';

export interface Tooth {
  id: string;
  toothNumber: number;
  jaw: 'upper' | 'lower';
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  status: string;
  notes?: string;
  movements?: string;
}

export interface TreatmentStep {
  id: string;
  stepNumber: number;
  jaw: 'upper' | 'lower';
  modelPath?: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scale?: number;
  description?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorRole: 'doctor' | 'technician';
  content: string;
  timestamp: string;
}

export interface DentalCase {
  id: string;
  caseNumber: string;
  patientName: string;
  status: string;
  version: number;
  totalSteps: number;
  upperJawSteps?: number;
  lowerJawSteps?: number;
  createdAt: string;
  updatedAt: string;
  steps: TreatmentStep[];
  comments: Comment[];
  teeth: Tooth[];
}

interface DentalState {
  // Current case
  currentCase: DentalCase | null;
  cases: DentalCase[];
  
  // Step navigation
  currentStep: number;
  isPlaying: boolean;
  playSpeed: number;
  
  // 3D viewer state
  selectedTooth: Tooth | null;
  highlightedTeeth: number[];
  cameraPosition: { x: number; y: number; z: number };
  showUpper: boolean;
  showLower: boolean;
  
  // Tools
  activeTool: string | null;
  showGrid: boolean;
  showIPDistance: boolean;
  
  // UI state
  isUploading: boolean;
  uploadProgress: number;
  activeTab: 'comments' | 'notes' | 'media';
  
  // Actions
  setCurrentCase: (c: DentalCase | null) => void;
  setCases: (cases: DentalCase[]) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaySpeed: (speed: number) => void;
  setSelectedTooth: (tooth: Tooth | null) => void;
  setHighlightedTeeth: (teeth: number[]) => void;
  toggleToothHighlight: (toothNumber: number) => void;
  setActiveTool: (tool: string | null) => void;
  setShowGrid: (show: boolean) => void;
  setShowIPDistance: (show: boolean) => void;
  setShowUpper: (show: boolean) => void;
  setShowLower: (show: boolean) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setActiveTab: (tab: 'comments' | 'notes' | 'media') => void;
  addComment: (comment: Comment) => void;
  resetViewer: () => void;
}

export const useDentalStore = create<DentalState>((set, get) => ({
  // Initial state
  currentCase: null,
  cases: [],
  currentStep: 1,
  isPlaying: false,
  playSpeed: 1,
  selectedTooth: null,
  highlightedTeeth: [],
  cameraPosition: { x: 0, y: 100, z: 200 },
  showUpper: true,
  showLower: true,
  activeTool: null,
  showGrid: false,
  showIPDistance: false,
  isUploading: false,
  uploadProgress: 0,
  activeTab: 'comments',
  
  // Actions
  setCurrentCase: (c) => set({ currentCase: c, currentStep: 1, selectedTooth: null }),
  setCases: (cases) => set({ cases }),
  
  setCurrentStep: (step) => {
    const { currentCase } = get();
    if (currentCase && step >= 1 && step <= currentCase.totalSteps) {
      set({ currentStep: step });
    }
  },
  
  nextStep: () => {
    const { currentCase, currentStep } = get();
    if (currentCase && currentStep < currentCase.totalSteps) {
      set({ currentStep: currentStep + 1 });
    }
  },
  
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaySpeed: (speed) => set({ playSpeed: speed }),
  setSelectedTooth: (tooth) => set({ selectedTooth: tooth }),
  setHighlightedTeeth: (teeth) => set({ highlightedTeeth: teeth }),
  
  toggleToothHighlight: (toothNumber) => {
    const { highlightedTeeth } = get();
    const exists = highlightedTeeth.includes(toothNumber);
    if (exists) {
      set({ highlightedTeeth: highlightedTeeth.filter(t => t !== toothNumber) });
    } else {
      set({ highlightedTeeth: [...highlightedTeeth, toothNumber] });
    }
  },
  
  setActiveTool: (tool) => set({ activeTool: tool }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowIPDistance: (show) => set({ showIPDistance: show }),
  setShowUpper: (show) => set({ showUpper: show }),
  setShowLower: (show) => set({ showLower: show }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  addComment: (comment) => {
    const { currentCase } = get();
    if (currentCase) {
      set({
        currentCase: {
          ...currentCase,
          comments: [comment, ...currentCase.comments]
        }
      });
    }
  },
  
  resetViewer: () => set({
    currentStep: 1,
    selectedTooth: null,
    highlightedTeeth: [],
    activeTool: null,
    showGrid: false,
    showIPDistance: false,
    isPlaying: false,
    cameraPosition: { x: 0, y: 100, z: 200 }
  })
}));
