'use client'

import * as React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DiseaseAlert {
  disease: string
  region: string
  alertLevel: string
  cases: number
}

// Simplified Nigeria state positions mapped on an SVG viewBox
interface StatePosition {
  name: string
  x: number
  y: number
  region: string
}

const nigeriaStates: StatePosition[] = [
  { name: 'Sokoto', x: 80, y: 60, region: 'North West' },
  { name: 'Zamfara', x: 140, y: 80, region: 'North West' },
  { name: 'Kebbi', x: 60, y: 120, region: 'North West' },
  { name: 'Katsina', x: 190, y: 55, region: 'North West' },
  { name: 'Kano', x: 230, y: 90, region: 'North West' },
  { name: 'Jigawa', x: 280, y: 65, region: 'North West' },
  { name: 'Kaduna', x: 200, y: 140, region: 'North West' },
  { name: 'Borno', x: 420, y: 75, region: 'North East' },
  { name: 'Yobe', x: 360, y: 70, region: 'North East' },
  { name: 'Bauchi', x: 320, y: 135, region: 'North East' },
  { name: 'Gombe', x: 370, y: 150, region: 'North East' },
  { name: 'Adamawa', x: 440, y: 165, region: 'North East' },
  { name: 'Taraba', x: 440, y: 220, region: 'North East' },
  { name: 'Niger', x: 140, y: 190, region: 'North Central' },
  { name: 'Kwara', x: 130, y: 260, region: 'North Central' },
  { name: 'Kogi', x: 230, y: 270, region: 'North Central' },
  { name: 'Benue', x: 330, y: 230, region: 'North Central' },
  { name: 'Plateau', x: 290, y: 185, region: 'North Central' },
  { name: 'FCT', x: 220, y: 215, region: 'North Central' },
  { name: 'Nasarawa', x: 300, y: 210, region: 'North Central' },
  { name: 'Lagos', x: 100, y: 380, region: 'South West' },
  { name: 'Ogun', x: 130, y: 355, region: 'South West' },
  { name: 'Oyo', x: 120, y: 320, region: 'South West' },
  { name: 'Osun', x: 160, y: 330, region: 'South West' },
  { name: 'Ondo', x: 190, y: 355, region: 'South West' },
  { name: 'Ekiti', x: 200, y: 310, region: 'South West' },
  { name: 'Edo', x: 230, y: 340, region: 'South South' },
  { name: 'Delta', x: 210, y: 380, region: 'South South' },
  { name: 'Bayelsa', x: 260, y: 410, region: 'South South' },
  { name: 'Rivers', x: 300, y: 400, region: 'South South' },
  { name: 'Akwa Ibom', x: 340, y: 380, region: 'South South' },
  { name: 'Cross River', x: 380, y: 340, region: 'South South' },
  { name: 'Enugu', x: 270, y: 295, region: 'South East' },
  { name: 'Anambra', x: 270, y: 340, region: 'South East' },
  { name: 'Imo', x: 280, y: 370, region: 'South East' },
  { name: 'Abia', x: 320, y: 340, region: 'South East' },
  { name: 'Ebonyi', x: 310, y: 300, region: 'South East' },
]

const alertLevelColors: Record<string, { fill: string; stroke: string; ring: string; label: string }> = {
  Watch: { fill: '#3b82f6', stroke: '#93c5fd', ring: 'rgba(59,130,246,0.2)', label: 'Watch' },
  Warning: { fill: '#f59e0b', stroke: '#fcd34d', ring: 'rgba(245,158,11,0.2)', label: 'Warning' },
  Alert: { fill: '#f97316', stroke: '#fdba74', ring: 'rgba(249,115,22,0.25)', label: 'Alert' },
  Emergency: { fill: '#ef4444', stroke: '#fca5a5', ring: 'rgba(239,68,68,0.3)', label: 'Emergency' },
  Low: { fill: '#22c55e', stroke: '#86efac', ring: 'rgba(34,197,94,0.15)', label: 'Low' },
  Medium: { fill: '#f59e0b', stroke: '#fcd34d', ring: 'rgba(245,158,11,0.2)', label: 'Medium' },
  High: { fill: '#ef4444', stroke: '#fca5a5', ring: 'rgba(239,68,68,0.3)', label: 'High' },
}

const diseaseColors: Record<string, string> = {
  Malaria: '#10b981',
  Cholera: '#f59e0b',
  'Lassa Fever': '#ef4444',
  'COVID-19': '#6366f1',
  Typhoid: '#0d9488',
  Tuberculosis: '#059669',
}

interface NigeriaDiseaseMapProps {
  diseaseAlerts: DiseaseAlert[]
}

export function NigeriaDiseaseMap({ diseaseAlerts }: NigeriaDiseaseMapProps) {
  // Aggregate disease data by state
  const stateAlerts = React.useMemo(() => {
    const map = new Map<string, { totalCases: number; maxSeverity: string; diseases: { name: string; cases: number; alertLevel: string }[] }>()

    diseaseAlerts.forEach(alert => {
      const stateName = alert.region
      const existing = map.get(stateName) || { totalCases: 0, maxSeverity: 'Watch', diseases: [] }

      existing.totalCases += alert.cases
      existing.diseases.push({ name: alert.disease, cases: alert.cases, alertLevel: alert.alertLevel })

      // Determine max severity
      const severityOrder = ['Low', 'Watch', 'Warning', 'Medium', 'Alert', 'High', 'Emergency']
      const currentIdx = severityOrder.indexOf(existing.maxSeverity)
      const newIdx = severityOrder.indexOf(alert.alertLevel)
      if (newIdx > currentIdx) existing.maxSeverity = alert.alertLevel

      map.set(stateName, existing)
    })

    return map
  }, [diseaseAlerts])

  const maxCases = React.useMemo(() => {
    return Math.max(...Array.from(stateAlerts.values()).map(s => s.totalCases), 1)
  }, [stateAlerts])

  const getDotSize = (cases: number) => {
    if (cases === 0) return 4
    return Math.max(7, Math.min(20, 7 + (cases / maxCases) * 13))
  }

  const hasData = diseaseAlerts.length > 0

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full h-full flex flex-col">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-muted-foreground font-medium">Alert Level:</span>
          </div>
          {Object.entries(alertLevelColors).slice(0, 4).map(([level, colors]) => (
            <div key={level} className="flex items-center gap-1.5 text-[10px]">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: colors.fill }} />
              <span className="text-muted-foreground">{colors.label}</span>
            </div>
          ))}
        </div>

        {/* SVG Map */}
        <svg viewBox="0 0 520 470" className="w-full flex-1" style={{ maxHeight: '260px' }}>
          {/* Nigeria outline */}
          <path
            d="M40,30 L180,15 L280,10 L370,20 L460,35 L480,80 L470,140 L450,180 L460,220 L440,260 L420,290 L400,320 L380,360 L340,400 L300,430 L260,445 L220,440 L180,420 L150,390 L120,370 L90,340 L70,300 L50,260 L35,200 L30,140 L35,80 Z"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* State outbreak indicators */}
          {nigeriaStates.map(state => {
            const alert = stateAlerts.get(state.name)
            const cases = alert?.totalCases || 0
            const severity = alert?.maxSeverity || 'Watch'
            const colors = alertLevelColors[severity] || alertLevelColors.Watch
            const dotSize = getDotSize(cases)

            return (
              <g key={state.name}>
                {/* Pulsing ring for active outbreaks */}
                {cases > 0 && (severity === 'Emergency' || severity === 'High' || severity === 'Alert') && (
                  <circle
                    cx={state.x * 0.85 + 20}
                    cy={state.y * 0.85 + 15}
                    r={dotSize + 6}
                    fill={colors.ring}
                    stroke={colors.stroke}
                    strokeWidth={1}
                    className="animate-pulse"
                  />
                )}

                {/* State dot */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle
                      cx={state.x * 0.85 + 20}
                      cy={state.y * 0.85 + 15}
                      r={dotSize}
                      fill={cases > 0 ? colors.fill : '#cbd5e1'}
                      stroke="white"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all hover:stroke-2 hover:stroke-amber-400"
                      style={{ opacity: cases > 0 ? 0.9 : 0.3 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    <div className="font-semibold">{state.name}</div>
                    {cases > 0 ? (
                      <>
                        <div className="text-red-600 font-medium">{cases} total cases</div>
                        <div className="mt-1 border-t pt-1 space-y-0.5">
                          {alert?.diseases.map((d, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className="size-1.5 rounded-full" style={{ backgroundColor: diseaseColors[d.name] || '#14b8a6' }} />
                              <span>{d.name}: {d.cases}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">No active outbreaks</div>
                    )}
                  </TooltipContent>
                </Tooltip>

                {/* State label for affected states */}
                {cases > 0 && (
                  <text
                    x={state.x * 0.85 + 20}
                    y={state.y * 0.85 + 15 + dotSize + 10}
                    textAnchor="middle"
                    className="fill-slate-500"
                    fontSize="7"
                    fontWeight="500"
                  >
                    {state.name}
                  </text>
                )}
              </g>
            )
          })}

          {/* Summary text */}
          <text x="260" y="465" textAnchor="middle" className="fill-slate-400" fontSize="10">
            {hasData
              ? `${diseaseAlerts.length} alerts across ${stateAlerts.size} states`
              : 'No disease outbreak data available'
            }
          </text>
        </svg>
      </div>
    </TooltipProvider>
  )
}
