'use client'

import { FileStack, Layers3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useDentalStore } from '@/store/dental-store'

function getTypeBadgeClass(type: 'upper' | 'lower' | 'step') {
  if (type === 'upper') {
    return 'border-sky-400/40 bg-sky-500/10 text-sky-200'
  }

  if (type === 'lower') {
    return 'border-rose-400/40 bg-rose-500/10 text-rose-200'
  }

  return 'border-amber-400/40 bg-amber-500/10 text-amber-200'
}

export default function UploadedFilesPanel() {
  const { uploadedModels, currentStep, setCurrentStep } = useDentalStore()

  if (uploadedModels.length === 0) {
    return null
  }

  return (
    <div className="absolute right-4 top-20 z-20 w-[320px] max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-slate-950/78 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Uploaded Files</p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            {uploadedModels.length} file{uploadedModels.length === 1 ? '' : 's'} ready
          </h3>
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
          <Layers3 size={18} />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {uploadedModels.map((model, index) => {
          const stepNumber = index + 1
          const active = currentStep === stepNumber

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => setCurrentStep(stepNumber)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                active
                  ? 'border-cyan-400/40 bg-cyan-400/12 shadow-[0_12px_30px_rgba(34,211,238,0.12)]'
                  : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]'
              }`}
            >
              <div className={`rounded-lg p-2 ${active ? 'bg-cyan-400/15 text-cyan-200' : 'bg-white/5 text-slate-300'}`}>
                <FileStack size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{model.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Step {stepNumber}</p>
              </div>

              <Badge variant="outline" className={getTypeBadgeClass(model.type)}>
                {model.type}
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}
