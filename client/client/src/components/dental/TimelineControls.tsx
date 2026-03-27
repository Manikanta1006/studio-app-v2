'use client'

import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { useDentalStore } from '@/store/dental-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'

export default function TimelineControls() {
  const {
    steps,
    currentStep,
    setCurrentStep,
    isPlaying,
    startAutoPlay,
    stopAutoPlay
  } = useDentalStore()

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAutoPlay()
    } else {
      startAutoPlay()
    }
  }

  const handleReset = () => {
    stopAutoPlay()
    setCurrentStep(1)
  }

  const handleStepClick = (stepId: number) => {
    stopAutoPlay()
    setCurrentStep(stepId)
  }

  const currentStepData = steps[currentStep - 1]
  const progress = (currentStep / steps.length) * 100

  return (
    <div className="bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/95 to-transparent p-4">
      {/* Status indicators */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Badge variant="outline" className="border-[#444] text-[#888]">
          DR.
        </Badge>
        <Badge variant="outline" className="border-[#444] text-[#888]">
          Initial
        </Badge>
        <Badge className="bg-[#00B8D420] text-[#00B8D4] border-[#00B8D440]">
          Technician Final
        </Badge>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-1 mb-3 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
              currentStep === step.id
                ? 'bg-[#00B8D4] text-[#1a1a1a]'
                : currentStep > step.id
                ? 'bg-[#00B8D440] text-[#00B8D4]'
                : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
            }`}
            title={step.description}
          >
            {step.id}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="max-w-xl mx-auto mb-3">
        <Slider
          value={[currentStep]}
          min={1}
          max={steps.length}
          step={1}
          onValueChange={(value) => setCurrentStep(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-[#666] mt-1">
          <span>Step {currentStep} of {steps.length}</span>
          <span>{progress.toFixed(0)}% Complete</span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="text-[#888] hover:text-[#fff] hover:bg-[#2a2a2a]"
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="bg-[#2a2a2a] hover:bg-[#333] text-[#888] hover:text-[#fff] disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          size="icon"
          onClick={handlePlayPause}
          className={`w-12 h-12 rounded-full ${
            isPlaying
              ? 'bg-[#FF6B6B] hover:bg-[#FF5252]'
              : 'bg-[#00B8D4] hover:bg-[#00A5C0]'
          } text-[#1a1a1a]`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={handleNext}
          disabled={currentStep === steps.length}
          className="bg-[#2a2a2a] hover:bg-[#333] text-[#888] hover:text-[#fff] disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentStep(steps.length)}
          className="text-[#888] hover:text-[#fff] hover:bg-[#2a2a2a]"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Current step description */}
      <div className="text-center mt-3">
        <p className="text-sm text-[#00B8D4] font-medium">{currentStepData?.name}</p>
        <p className="text-xs text-[#888]">{currentStepData?.description}</p>
      </div>
    </div>
  )
}
