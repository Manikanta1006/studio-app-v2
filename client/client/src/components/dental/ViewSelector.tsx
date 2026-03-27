'use client'

import { useDentalStore } from '@/store/dental-store'
import { VIEW_PRESETS, ViewPresetKey } from '@/lib/frontView'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'

export default function ViewSelector() {
  const { viewPreset, setViewPreset } = useDentalStore()

  const viewOptions: Array<{
    key: ViewPresetKey
    label: string
    icon: string
    description: string
  }> = [
    {
      key: 'FRONT',
      label: 'Front View',
      icon: '👁️',
      description: 'Full frontal view of teeth occlusion'
    },
    {
      key: 'FRONT_CLOSEUP',
      label: 'Front Close-up',
      icon: '🔍',
      description: 'Detailed front view with zoom'
    },
    {
      key: 'SIDE',
      label: 'Side View',
      icon: '↔️',
      description: 'Lateral view of tooth alignment'
    },
    {
      key: 'OCCLUSAL',
      label: 'Occlusal View',
      icon: '⬇️',
      description: 'View from below (occlusal surface)'
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">View Presets</h3>
        <span className="text-[10px] text-outline">
          {viewPreset}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {viewOptions.map(({ key, label, icon, description }) => (
          <button
            key={key}
            onClick={() => setViewPreset(key)}
            className={`
              relative px-3 py-2.5 rounded-lg border transition-all duration-300 text-left
              ${
                viewPreset === key
                  ? 'bg-primary/20 border-primary text-primary shadow-md'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-high'
              }
            `}
            title={description}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight">{label}</p>
                <p className="text-[9px] text-outline opacity-75 line-clamp-1">{description}</p>
              </div>
            </div>
            {viewPreset === key && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* View Info */}
      <div className="mt-4 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20 space-y-2">
        <div>
          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">Current View</p>
          <p className="text-xs font-semibold text-on-surface mt-1">
            {viewOptions.find(v => v.key === viewPreset)?.label}
          </p>
        </div>
        
        <p className="text-[10px] text-outline leading-tight">
          {viewOptions.find(v => v.key === viewPreset)?.description}
        </p>

        {/* Quick Info */}
        <div className="pt-2 border-t border-outline-variant/20 space-y-1 text-[9px]">
          <div className="flex justify-between">
            <span className="text-outline">Camera Distance:</span>
            <span className="text-primary font-bold">
              {VIEW_PRESETS[viewPreset].zoomDistance.toFixed(1)} units
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Overbite:</span>
            <span className="text-primary font-bold">
              {(VIEW_PRESETS[viewPreset].occlusion.overbite * 10).toFixed(1)} mm
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Overjet:</span>
            <span className="text-primary font-bold">
              {(VIEW_PRESETS[viewPreset].occlusion.overjet * 10).toFixed(1)} mm
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
