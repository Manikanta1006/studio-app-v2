'use client'

import { useDentalStore } from '@/store/dental-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'

export default function OcclusionAnalysis() {
  const { occlusionMetrics } = useDentalStore()

  if (!occlusionMetrics) {
    return (
      <Card className="bg-surface-container-low border-outline-variant/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-on-surface">Occlusion Analysis</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-outline">
          <p>Loading occlusion data...</p>
        </CardContent>
      </Card>
    )
  }

  const qualityColor = occlusionMetrics.occlusionQuality >= 80 
    ? 'text-[#00BFA5]' 
    : occlusionMetrics.occlusionQuality >= 60 
    ? 'text-[#FFA726]' 
    : 'text-[#EF5350]'

  return (
    <Card className="bg-surface-container-low border-outline-variant/30">
      <CardHeader className="pb-3 border-b border-outline-variant/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-on-surface">Occlusion Analysis</CardTitle>
          <div className="flex items-center gap-2">
            {occlusionMetrics.isValid ? (
              <CheckCircle2 size={16} className="text-[#00BFA5]" />
            ) : (
              <AlertCircle size={16} className="text-[#FFA726]" />
            )}
            <span className={`text-xs font-bold ${qualityColor}`}>
              {occlusionMetrics.occlusionQuality.toFixed(0)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Overbite */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Overbite</span>
            <span className="text-xs font-bold text-on-surface">
              {occlusionMetrics.effectiveOverbite.toFixed(2)} mm
            </span>
          </div>
          <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                occlusionMetrics.effectiveOverbite >= 1.2 && occlusionMetrics.effectiveOverbite <= 3.2
                  ? 'bg-[#00BFA5]'
                  : 'bg-[#FFA726]'
              }`}
              style={{
                width: `${Math.min(100, (occlusionMetrics.effectiveOverbite / 5) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-outline">Ideal: 1.2 - 3.2 mm</p>
        </div>

        {/* Relationship */}
        <div className="space-y-2">
          <div>
            <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">
              Anteroposterior
            </span>
            <p className="text-xs font-bold text-on-surface mt-0.5">
              {occlusionMetrics.anteroposteriorRelationship}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">
              Vertical
            </span>
            <p className="text-xs font-bold text-on-surface mt-0.5">
              {occlusionMetrics.verticalRelationship}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {occlusionMetrics.recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-outline-variant/20">
            <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block">
              Status & Recommendations
            </span>
            <div className="space-y-1.5">
              {occlusionMetrics.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-2">
                  {rec.includes('✓') ? (
                    <span className="text-[#00BFA5] font-bold flex-shrink-0 mt-0.5">✓</span>
                  ) : rec.includes('too far') ? (
                    <span className="text-[#FFA726] font-bold flex-shrink-0 mt-0.5">⚠</span>
                  ) : (
                    <TrendingUp size={12} className="flex-shrink-0 text-primary mt-0.5" />
                  )}
                  <p className="text-[10px] text-outline leading-tight">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="pt-2">
          <Badge
            className={
              occlusionMetrics.isValid
                ? 'bg-[#00BFA5] text-on-surface'
                : 'bg-[#FFA726] text-on-surface'
            }
          >
            {occlusionMetrics.isValid ? 'Well-Aligned' : 'Needs Adjustment'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
