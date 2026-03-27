import { Suspense, useState, useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  ChevronRight,
  Eye,
  FastForward,
  Loader2,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react'
import ClinicalFeed from '@/components/dental/ClinicalFeed'
import ClinicalSidebar from '@/components/dental/ClinicalSidebar'
import DentalViewer from '@/components/dental/DentalViewer'
import UploadedFilesPanel from '@/components/dental/UploadedFilesPanel'
import UploadPanel from '@/components/dental/UploadPanel'
import { Toaster } from '@/components/ui/toaster'
import { useDentalStore } from '@/store/dental-store'

type ArchVisibility = {
  upper: boolean
  lower: boolean
}

type ViewerFocus = 'left' | 'center' | 'right'

function ArchIcon({ variant }: { variant: 'upper' | 'both' | 'lower' }) {
  if (variant === 'both') {
    return (
      <svg viewBox="0 0 64 64" className="h-9 w-9 sm:h-10 sm:w-10" aria-hidden="true">
        <path
          d="M16 26c0-12 7-20 16-20s16 8 16 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M16 38c0 12 7 20 16 20s16-8 16-20"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true">
      <path
        d={variant === 'upper' ? 'M16 42c0-14 7-24 16-24s16 10 16 24' : 'M16 22c0 14 7 24 16 24s16-10 16-24'}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StackIcon({ active = false }: { active?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5" aria-hidden="true">
      <span className={`block h-[5px] w-7 rounded-full sm:h-[6px] sm:w-8 ${active ? 'bg-primary' : 'bg-outline'}`} />
      <span className={`block h-[5px] w-7 rounded-full sm:h-[6px] sm:w-8 ${active ? 'bg-primary' : 'bg-outline'}`} />
    </div>
  )
}

function ToolButton({
  active = false,
  onClick,
  title,
  children,
  accent = false,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: ReactNode
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 sm:h-11 sm:w-11 sm:rounded-2xl ${
        active
          ? accent
            ? 'border-primary/35 bg-primary/15 text-primary shadow-[0_10px_24px_rgba(79,209,217,0.16)]'
            : 'border-outline-variant/50 bg-surface-container-lowest text-on-surface shadow-[0_8px_20px_rgba(0,0,0,0.12)]'
          : accent
            ? 'border-transparent bg-transparent text-primary hover:border-outline-variant hover:bg-primary/10'
            : 'border-transparent bg-transparent text-outline hover:border-outline-variant hover:bg-surface-container-lowest/70'
      }`}
    >
      {children}
    </button>
  )
}

function ViewerQuickTools({
  visibility,
  focus,
  onShowUpperOnly,
  onShowBoth,
  onShowLowerOnly,
  onToggleUpper,
  onToggleLower,
  onFocusChange,
}: {
  visibility: ArchVisibility
  focus: ViewerFocus
  onShowUpperOnly: () => void
  onShowBoth: () => void
  onShowLowerOnly: () => void
  onToggleUpper: () => void
  onToggleLower: () => void
  onFocusChange: (focus: ViewerFocus) => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [position, setPosition] = useState({ x: 12, y: 12 })
  const [dragging, setDragging] = useState(false)

  const clampPosition = (x: number, y: number) => {
    const panel = panelRef.current
    const parent = panel?.parentElement
    const margin = 12

    if (!panel || !parent) {
      return { x, y }
    }

    const maxX = Math.max(margin, parent.clientWidth - panel.offsetWidth - margin)
    const maxY = Math.max(margin, parent.clientHeight - panel.offsetHeight - margin)

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    }
  }

  useEffect(() => {
    if (!dragging) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragStart = dragStartRef.current

      if (!dragStart) {
        return
      }

      const nextX = dragStart.originX + (event.clientX - dragStart.startX)
      const nextY = dragStart.originY + (event.clientY - dragStart.startY)
      setPosition(clampPosition(nextX, nextY))
    }

    const stopDragging = () => {
      setDragging(false)
      dragStartRef.current = null
    }

    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)

    return () => {
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
    }
  }, [dragging])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) {
      return
    }

    dragStartRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
    setDragging(true)
  }

  return (
    <div
      ref={panelRef}
      onPointerDown={handlePointerDown}
      style={{ left: position.x, top: position.y }}
      className={`absolute z-20 rounded-[22px] border border-outline-variant/80 bg-card/82 p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl select-none sm:rounded-[26px] sm:p-3.5 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-1.5 gap-y-1.5 text-on-surface sm:gap-x-2 sm:gap-y-2">
        <ToolButton
          active={visibility.upper && !visibility.lower}
          onClick={onShowUpperOnly}
          title="Show upper arch only"
        >
          <ArchIcon variant="upper" />
        </ToolButton>

        <ToolButton
          active={visibility.upper && visibility.lower}
          onClick={onShowBoth}
          title="Show both arches"
        >
          <ArchIcon variant="both" />
        </ToolButton>

        <ToolButton
          active={visibility.upper}
          accent
          onClick={onToggleUpper}
          title="Toggle upper arch visibility"
        >
          <Eye size={20} strokeWidth={2.2} />
        </ToolButton>

        <ToolButton active={focus === 'left'} onClick={() => onFocusChange('left')} title="Rotate to left view">
          <StackIcon active={focus === 'left'} />
        </ToolButton>

        <ToolButton active={focus === 'center'} onClick={() => onFocusChange('center')} title="Show normal view">
          <StackIcon active={focus === 'center'} />
        </ToolButton>

        <ToolButton active={focus === 'right'} onClick={() => onFocusChange('right')} title="Rotate to right view">
          <StackIcon active={focus === 'right'} />
        </ToolButton>

        <span className="block h-10 w-10 sm:h-11 sm:w-11" aria-hidden="true" />

        <ToolButton
          active={!visibility.upper && visibility.lower}
          onClick={onShowLowerOnly}
          title="Show lower arch only"
        >
          <ArchIcon variant="lower" />
        </ToolButton>

        <ToolButton
          active={visibility.lower}
          accent
          onClick={onToggleLower}
          title="Toggle lower arch visibility"
        >
          <Eye size={20} strokeWidth={2.2} />
        </ToolButton>
      </div>
    </div>
  )
}

import GLTFExporterUtility from '@/components/dental/GLTFExporterUtility'

export default function App() {
  const [feedCollapsed, setFeedCollapsed] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [viewerFocus, setViewerFocus] = useState<ViewerFocus>('center')
  
  const { 
    currentStep, 
    setCurrentStep, 
    selectedTooth, 
    steps, 
    isPlaying, 
    setIsPlaying,
    startAutoPlay,
    stopAutoPlay,
    archVisibility,
    setArchVisibility
  } = useDentalStore()


  const currentTreatmentStep = steps[currentStep - 1]

  const showUpperOnly = () => {
    setArchVisibility({ upper: true, lower: false })
    setViewerFocus('center')
  }

  const showBothArches = () => {
    setArchVisibility({ upper: true, lower: true })
    setViewerFocus('center')
  }

  const showLowerOnly = () => {
    setArchVisibility({ upper: false, lower: true })
    setViewerFocus('center')
  }

  const toggleUpperArch = () => {
    setArchVisibility((current) => {
      if (current.upper && !current.lower) {
        return current
      }

      return { ...current, upper: !current.upper }
    })
  }

  const toggleLowerArch = () => {
    setArchVisibility((current) => {
      if (!current.upper && current.lower) {
        return current
      }

      return { ...current, lower: !current.lower }
    })
  }

  const handleFocusChange = (focus: ViewerFocus) => {
    setViewerFocus(focus)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && currentStep > 1) {
        setCurrentStep(currentStep - 1)
      }

      if (event.key === 'ArrowRight' && currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
      }

      if (event.key === ' ') {
        event.preventDefault()
        isPlaying ? stopAutoPlay() : startAutoPlay()
      }

      if (event.key === 'r') {
        setCurrentStep(1)
      }

      if (event.key === 'f') {
        setFeedCollapsed(!feedCollapsed)
      }

      if (event.key === '?') {
        setShowShortcuts(!showShortcuts)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, feedCollapsed, isPlaying, setCurrentStep, showShortcuts, steps.length])

  // Removed local playback effect, now handled by dental-store actions


  return (
    <>
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl border border-outline-variant/50 bg-card p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-on-surface">Keyboard Shortcuts</h2>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-outline hover:bg-surface-container"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'Space', action: 'Play/Pause animation' },
                { key: 'Left', action: 'Previous step' },
                { key: 'Right', action: 'Next step' },
                { key: 'R', action: 'Reset to start' },
                { key: 'F', action: 'Toggle patient panel' },
                { key: '?', action: 'Show shortcuts' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between rounded-lg bg-surface-container px-4 py-2">
                  <kbd className="rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs font-bold text-on-surface-variant shadow-sm">
                    {key}
                  </kbd>
                  <span className="text-xs text-on-surface-variant">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <GLTFExporterUtility />

      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <div className="relative flex flex-1 overflow-hidden">
          <ClinicalSidebar />

          <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(0,150,136,0.04)_0%,_transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(0,150,136,0.03)_0%,_transparent_50%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,191,165,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,191,165,0.03)_1px,transparent_1px)] bg-[length:32px_32px]" />
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 bg-gradient-to-b from-card/80 to-transparent" />
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="rounded-2xl border border-border/50 bg-card/60 p-8 text-center shadow-xl backdrop-blur-md">
                      <div className="relative">
                        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-teal-500" />
                        <div className="absolute inset-0 mx-auto mb-4 h-12 w-12 rounded-full border-2 border-teal-100 opacity-30 animate-ping" />
                      </div>
                      <p className="font-semibold text-on-surface">Loading 3D Viewer...</p>
                      <p className="mt-1 text-sm text-outline">Preparing dental model</p>
                    </div>
                  </div>
                }
              >
                <DentalViewer
                  focusArea={viewerFocus}
                />
              </Suspense>

              <ViewerQuickTools
                visibility={archVisibility}
                focus={viewerFocus}
                onShowUpperOnly={showUpperOnly}
                onShowBoth={showBothArches}
                onShowLowerOnly={showLowerOnly}
                onToggleUpper={toggleUpperArch}
                onToggleLower={toggleLowerArch}
                onFocusChange={handleFocusChange}
              />

              <UploadPanel />
              <UploadedFilesPanel />

              <div className="absolute bottom-4 left-4 z-20">
                {currentTreatmentStep?.modelUrl ? (
                  <div className="rounded-xl border border-primary/15 bg-card/90 px-5 py-3.5 shadow-lg shadow-primary/10 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/15 animate-in slide-in-from-bottom-3 fade-in">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Treatment Playback</p>
                    </div>
                    <p className="text-base font-black text-on-surface">{currentTreatmentStep.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-outline">{currentTreatmentStep.description}</p>
                  </div>
                ) : selectedTooth ? (
                  <div className="rounded-xl border border-primary/15 bg-card/90 px-5 py-3.5 shadow-lg shadow-primary/10 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/15 animate-in slide-in-from-bottom-3 fade-in">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Selected Tooth</p>
                    </div>
                    <p className="text-base font-black text-on-surface">TOOTH #{selectedTooth.number}</p>
                    <p className="mt-0.5 text-xs font-medium capitalize text-outline">{selectedTooth.name}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 bg-card/60 px-4 py-2.5 shadow-sm backdrop-blur-md">
                    <p className="text-xs font-medium text-outline">Click a tooth to select</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFeedCollapsed(!feedCollapsed)}
                className="absolute right-0 top-1/2 z-50 flex h-14 w-7 -translate-y-1/2 items-center justify-center rounded-l-xl border border-outline-variant/40 bg-gradient-to-r from-card to-surface-container-low text-outline shadow-md transition-all duration-200 ease-out hover:text-primary hover:shadow-lg group"
                title="Toggle patient panel"
              >
                <ChevronRight size={20} className={`transition-transform duration-300 group-hover:scale-110 ${feedCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="fixed bottom-4 left-1/2 z-40 flex w-[780px] max-w-[calc(100%-2rem)] -translate-x-1/2 items-center justify-between gap-5 rounded-2xl border border-outline-variant/80 bg-card/88 px-5 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl">
              <div className="absolute left-0 top-0 h-1 w-12 rounded-b bg-gradient-to-r from-teal-500 to-transparent" />
              <div className="absolute right-0 top-0 h-1 w-12 rounded-b bg-gradient-to-l from-teal-500 to-transparent" />

              <div className="flex items-center gap-2 border-r border-outline-variant/50 pr-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="group flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  title="Reset (R)"
                >
                  <RotateCcw size={16} className="transition-transform duration-500 group-hover:-rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  title="Previous (Left)"
                >
                  <SkipBack size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => isPlaying ? stopAutoPlay() : startAutoPlay()}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                    isPlaying
                      ? 'bg-primary/15 text-primary ring-2 ring-primary/20'
                      : 'bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90'
                  }`}
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? (
                    <div className="flex items-center gap-1">
                      <span className="h-4 w-1.5 animate-pulse rounded-full bg-current" />
                      <span className="delay-75 h-4 w-1.5 animate-pulse rounded-full bg-current" />
                    </div>
                  ) : (
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => currentStep < steps.length && setCurrentStep(currentStep + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  title="Next (Right)"
                >
                  <SkipForward size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(steps.length)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  title="Go to end"
                >
                  <FastForward size={16} />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Movement Timeline</span>
                    {isPlaying && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 animate-pulse">
                        Playing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-outline">Step {currentStep} of {steps.length}</span>
                    <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-600">{currentStep}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-outline-variant/80 bg-surface-container-low px-3 py-2">
                  <div
                    className="grid items-center gap-x-1 gap-y-1.5"
                    style={{ gridTemplateColumns: `18px repeat(${steps.length}, minmax(0, 1fr))` }}
                  >
                    <span className="text-center text-[11px] font-black text-outline">S</span>
                    {Array.from({ length: steps.length }, (_, index) => {
                      const step = index + 1
                      const isCurrent = step === currentStep
                      const isPast = step < currentStep

                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => {
                            setCurrentStep(step)
                            stopAutoPlay()
                          }}
                          title={`Step ${step}`}
                          className="flex flex-col items-center justify-center gap-1 transition-all duration-200"
                        >
                          <span
                            className={`text-[11px] font-bold leading-none ${
                              isCurrent ? 'text-primary' : isPast ? 'text-primary/80' : 'text-outline'
                            }`}
                          >
                            {step}
                          </span>
                          <span
                            className={`block rounded-[3px] transition-all duration-200 ${
                              isCurrent
                                ? 'h-[7px] w-4 bg-primary'
                                : isPast
                                  ? 'h-[6px] w-4 bg-primary/45'
                                  : 'h-[6px] w-4 bg-outline-variant hover:bg-outline/60'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <ClinicalFeed collapsed={feedCollapsed} onToggle={() => setFeedCollapsed(!feedCollapsed)} />
        </div>
      </div>
      <Toaster />
    </>
  )
}
