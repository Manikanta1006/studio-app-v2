'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { DEFAULT_OCCLUSION_CONFIG, OcclusionConfig } from '@/lib/occlusion'

export interface OcclusionSettingsProps {
  config?: OcclusionConfig
  onConfigChange?: (config: OcclusionConfig) => void
}

export default function OcclusionSettings({ 
  config = DEFAULT_OCCLUSION_CONFIG,
  onConfigChange 
}: OcclusionSettingsProps) {
  const [localConfig, setLocalConfig] = useState<OcclusionConfig>(config)

  const handleReset = () => {
    setLocalConfig(DEFAULT_OCCLUSION_CONFIG)
    onConfigChange?.(DEFAULT_OCCLUSION_CONFIG)
  }

  const handleConfigChange = (key: keyof OcclusionConfig, value: number) => {
    const updated = { ...localConfig, [key]: value }
    setLocalConfig(updated)
    onConfigChange?.(updated)
  }

  const settings = [
    {
      key: 'overjet' as const,
      label: 'Overjet (Horizontal)',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'mm',
      help: 'Horizontal distance between upper and lower front teeth'
    },
    {
      key: 'overbite' as const,
      label: 'Overbite (Vertical)',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'mm',
      help: 'Vertical overlap of upper front teeth over lower'
    },
    {
      key: 'gapAtMolars' as const,
      label: 'Gap at Molars',
      min: 0,
      max: 2,
      step: 0.05,
      unit: 'mm',
      help: 'Space between molars when front teeth meet'
    },
    {
      key: 'occlusionHeight' as const,
      label: 'Occlusion Plane Height',
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'mm',
      help: 'Vertical position of the occlusion plane'
    },
    {
      key: 'upperJawY' as const,
      label: 'Upper Jaw Y Position',
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'mm',
      help: 'Vertical offset for upper jaw'
    },
    {
      key: 'lowerJawY' as const,
      label: 'Lower Jaw Y Position',
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'mm',
      help: 'Vertical offset for lower jaw'
    },
  ]

  return (
    <Card className="bg-surface-container-low border-outline-variant/30">
      <CardHeader className="pb-3 border-b border-outline-variant/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-on-surface">
            Occlusion Settings
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-8"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {settings.map(({ key, label, min, max, step, unit, help }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant">
                {label}
              </label>
              <span className="text-xs font-bold text-primary">
                {localConfig[key].toFixed(2)} {unit}
              </span>
            </div>
            
            <Slider
              value={[localConfig[key]]}
              min={min}
              max={max}
              step={step}
              onValueChange={(value) => handleConfigChange(key, value[0])}
              className="w-full"
            />
            
            <p className="text-[10px] text-outline leading-tight">{help}</p>
          </div>
        ))}

        {/* Angle Settings */}
        <div className="pt-3 border-t border-outline-variant/20 space-y-3">
          <h4 className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">
            Plane Angles
          </h4>

          {[
            {
              key: 'upperIncisalPlaneAngle' as const,
              label: 'Upper Incisial Angle',
              min: -0.2,
              max: 0.2,
              step: 0.01,
            },
            {
              key: 'upperOcclusalPlaneAngle' as const,
              label: 'Upper Occlusal Angle',
              min: -0.1,
              max: 0.1,
              step: 0.01,
            },
            {
              key: 'lowerIncisalPlaneAngle' as const,
              label: 'Lower Incisial Angle',
              min: -0.2,
              max: 0.2,
              step: 0.01,
            },
            {
              key: 'lowerOcclusalPlaneAngle' as const,
              label: 'Lower Occlusal Angle',
              min: -0.1,
              max: 0.1,
              step: 0.01,
            },
          ].map(({ key, label, min, max, step }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface-variant">
                  {label}
                </label>
                <span className="text-xs font-bold text-primary">
                  {(localConfig[key] * 180 / Math.PI).toFixed(1)}°
                </span>
              </div>
              
              <Slider
                value={[localConfig[key]]}
                min={min}
                max={max}
                step={step}
                onValueChange={(value) => handleConfigChange(key, value[0])}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
