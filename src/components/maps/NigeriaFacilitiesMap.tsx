'use client'

import * as React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Simplified Nigeria state positions mapped on an SVG viewBox (0,0 → 600,550)
// Positions are approximate centroids for a professional-looking grid map
interface StatePosition {
  name: string
  x: number
  y: number
  region: string
}

const nigeriaStates: StatePosition[] = [
  // North West
  { name: 'Sokoto', x: 80, y: 60, region: 'North West' },
  { name: 'Zamfara', x: 140, y: 80, region: 'North West' },
  { name: 'Kebbi', x: 60, y: 120, region: 'North West' },
  { name: 'Katsina', x: 190, y: 55, region: 'North West' },
  { name: 'Kano', x: 230, y: 90, region: 'North West' },
  { name: 'Jigawa', x: 280, y: 65, region: 'North West' },
  { name: 'Kaduna', x: 200, y: 140, region: 'North West' },
  // North East
  { name: 'Borno', x: 420, y: 75, region: 'North East' },
  { name: 'Yobe', x: 360, y: 70, region: 'North East' },
  { name: 'Bauchi', x: 320, y: 135, region: 'North East' },
  { name: 'Gombe', x: 370, y: 150, region: 'North East' },
  { name: 'Adamawa', x: 440, y: 165, region: 'North East' },
  { name: 'Taraba', x: 440, y: 220, region: 'North East' },
  // North Central
  { name: 'Niger', x: 140, y: 190, region: 'North Central' },
  { name: 'Kwara', x: 130, y: 260, region: 'North Central' },
  { name: 'Kogi', x: 230, y: 270, region: 'North Central' },
  { name: 'Benue', x: 330, y: 230, region: 'North Central' },
  { name: 'Plateau', x: 290, y: 185, region: 'North Central' },
  { name: 'FCT', x: 220, y: 215, region: 'North Central' },
  { name: 'Nasarawa', x: 300, y: 210, region: 'North Central' },
  // South West
  { name: 'Lagos', x: 100, y: 380, region: 'South West' },
  { name: 'Ogun', x: 130, y: 355, region: 'South West' },
  { name: 'Oyo', x: 120, y: 320, region: 'South West' },
  { name: 'Osun', x: 160, y: 330, region: 'South West' },
  { name: 'Ondo', x: 190, y: 355, region: 'South West' },
  { name: 'Ekiti', x: 200, y: 310, region: 'South West' },
  // South South
  { name: 'Edo', x: 230, y: 340, region: 'South South' },
  { name: 'Delta', x: 210, y: 380, region: 'South South' },
  { name: 'Bayelsa', x: 260, y: 410, region: 'South South' },
  { name: 'Rivers', x: 300, y: 400, region: 'South South' },
  { name: 'Akwa Ibom', x: 340, y: 380, region: 'South South' },
  { name: 'Cross River', x: 380, y: 340, region: 'South South' },
  // South East
  { name: 'Enugu', x: 270, y: 295, region: 'South East' },
  { name: 'Anambra', x: 270, y: 340, region: 'South East' },
  { name: 'Imo', x: 280, y: 370, region: 'South East' },
  { name: 'Abia', x: 320, y: 340, region: 'South East' },
  { name: 'Ebonyi', x: 310, y: 300, region: 'South East' },
]

const regionColors: Record<string, { fill: string; stroke: string; dot: string }> = {
  'North West': { fill: '#ecfdf5', stroke: '#6ee7b7', dot: '#10b981' },
  'North East': { fill: '#fef3c7', stroke: '#fcd34d', dot: '#f59e0b' },
  'North Central': { fill: '#eff6ff', stroke: '#93c5fd', dot: '#3b82f6' },
  'South West': { fill: '#fdf2f8', stroke: '#f9a8d4', dot: '#ec4899' },
  'South South': { fill: '#f0fdf4', stroke: '#86efac', dot: '#22c55e' },
  'South East': { fill: '#faf5ff', stroke: '#c4b5fd', dot: '#8b5cf6' },
}

interface FacilityMapData {
  state: string
  count: number
  types?: Record<string, number>
}

interface NigeriaFacilitiesMapProps {
  facilities: FacilityMapData[]
  totalFacilities?: number
}

export function NigeriaFacilitiesMap({ facilities, totalFacilities }: NigeriaFacilitiesMapProps) {
  // Build a lookup for facility counts per state
  const facilityLookup = React.useMemo(() => {
    const map = new Map<string, FacilityMapData>()
    facilities.forEach(f => map.set(f.state, f))
    return map
  }, [facilities])

  const maxCount = React.useMemo(() => {
    return Math.max(...facilities.map(f => f.count), 1)
  }, [facilities])

  const getDotSize = (count: number) => {
    if (count === 0) return 4
    return Math.max(6, Math.min(18, 6 + (count / maxCount) * 12))
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full h-full flex flex-col">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {Object.entries(regionColors).map(([region, colors]) => (
            <div key={region} className="flex items-center gap-1.5 text-[10px]">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: colors.dot }} />
              <span className="text-muted-foreground">{region}</span>
            </div>
          ))}
        </div>

        {/* SVG Map */}
        <svg viewBox="0 0 520 470" className="w-full flex-1" style={{ maxHeight: '300px' }}>
          {/* Nigeria outline (simplified) */}
          <path
            d="M40,30 L180,15 L280,10 L370,20 L460,35 L480,80 L470,140 L450,180 L460,220 L440,260 L420,290 L400,320 L380,360 L340,400 L300,430 L260,445 L220,440 L180,420 L150,390 L120,370 L90,340 L70,300 L50,260 L35,200 L30,140 L35,80 Z"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* State dots */}
          {nigeriaStates.map(state => {
            const facilityData = facilityLookup.get(state.name)
            const count = facilityData?.count || 0
            const regionStyle = regionColors[state.region] || regionColors['North Central']
            const dotSize = getDotSize(count)

            return (
              <g key={state.name}>
                {/* Background circle for state region */}
                <circle
                  cx={state.x * 0.85 + 20}
                  cy={state.y * 0.85 + 15}
                  r={dotSize + 3}
                  fill={regionStyle.fill}
                  stroke={regionStyle.stroke}
                  strokeWidth={1}
                  opacity={0.6}
                />
                {/* Facility count dot */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle
                      cx={state.x * 0.85 + 20}
                      cy={state.y * 0.85 + 15}
                      r={dotSize}
                      fill={count > 0 ? regionStyle.dot : '#cbd5e1'}
                      stroke="white"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all hover:stroke-2 hover:stroke-emerald-400"
                      style={{ opacity: count > 0 ? 1 : 0.4 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-semibold">{state.name}</div>
                    <div>{count} facilit{count === 1 ? 'y' : 'ies'}</div>
                    {facilityData?.types && Object.entries(facilityData.types).length > 0 && (
                      <div className="mt-1 border-t pt-1 space-y-0.5">
                        {Object.entries(facilityData.types).map(([type, tc]) => (
                          <div key={type} className="text-muted-foreground">
                            {type.replace(/_/g, ' ')}: {tc}
                          </div>
                        ))}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>

                {/* State label for states with facilities */}
                {count > 0 && (
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

          {/* Title */}
          <text x="260" y="465" textAnchor="middle" className="fill-slate-400" fontSize="10">
            {totalFacilities ?? facilities.reduce((sum, f) => sum + f.count, 0)} facilities across {facilities.filter(f => f.count > 0).length} states
          </text>
        </svg>
      </div>
    </TooltipProvider>
  )
}
