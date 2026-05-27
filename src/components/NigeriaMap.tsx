'use client'

import * as React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ---------- Nigeria Geopolitical Zones ----------

interface ZoneConfig {
  name: string
  shortName: string
  states: string[]
  // SVG polygon points for approximate zone shape on a 560x520 viewBox
  path: string
  // centroid for label placement
  cx: number
  cy: number
}

const geoPoliticalZones: ZoneConfig[] = [
  {
    name: 'North West',
    shortName: 'NW',
    states: ['Sokoto', 'Zamfara', 'Kebbi', 'Katsina', 'Kano', 'Jigawa', 'Kaduna'],
    path: 'M30,30 L200,15 L260,25 L310,20 L310,80 L280,100 L250,120 L220,140 L200,160 L170,170 L130,160 L80,140 L50,110 L30,80 Z',
    cx: 170,
    cy: 95,
  },
  {
    name: 'North East',
    shortName: 'NE',
    states: ['Borno', 'Yobe', 'Bauchi', 'Gombe', 'Adamawa', 'Taraba'],
    path: 'M310,20 L420,25 L500,40 L510,90 L500,140 L490,180 L460,210 L430,240 L380,230 L340,200 L310,170 L280,155 L250,120 L280,100 L310,80 Z',
    cx: 390,
    cy: 120,
  },
  {
    name: 'North Central',
    shortName: 'NC',
    states: ['Niger', 'Kwara', 'Kogi', 'Benue', 'Plateau', 'FCT', 'Nasarawa'],
    path: 'M130,160 L170,170 L200,160 L220,140 L250,120 L280,155 L310,170 L340,200 L380,230 L370,270 L340,290 L300,280 L260,270 L220,280 L180,270 L140,250 L110,220 L100,190 Z',
    cx: 240,
    cy: 215,
  },
  {
    name: 'South West',
    shortName: 'SW',
    states: ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
    path: 'M60,280 L100,260 L140,250 L180,270 L190,300 L180,340 L160,360 L130,370 L100,360 L70,340 L50,310 L40,290 Z',
    cx: 120,
    cy: 315,
  },
  {
    name: 'South East',
    shortName: 'SE',
    states: ['Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi'],
    path: 'M220,280 L260,270 L300,280 L310,310 L300,350 L270,370 L240,360 L220,340 L210,310 Z',
    cx: 260,
    cy: 325,
  },
  {
    name: 'South South',
    shortName: 'SS',
    states: ['Edo', 'Delta', 'Bayelsa', 'Rivers', 'Akwa Ibom', 'Cross River'],
    path: 'M180,270 L220,280 L210,310 L220,340 L240,360 L270,370 L300,350 L330,340 L360,320 L380,290 L370,270 L340,290 L300,280 L260,270 L220,280 L190,300 Z',
    cx: 300,
    cy: 330,
  },
]

// Zone base colors (light fill)
const zoneBaseColors: Record<string, { fill: string; stroke: string; label: string }> = {
  'North West': { fill: '#ecfdf5', stroke: '#6ee7b7', label: '#047857' },
  'North East': { fill: '#fef3c7', stroke: '#fcd34d', label: '#b45309' },
  'North Central': { fill: '#eff6ff', stroke: '#93c5fd', label: '#1d4ed8' },
  'South West': { fill: '#fdf2f8', stroke: '#f9a8d4', label: '#be185d' },
  'South East': { fill: '#faf5ff', stroke: '#c4b5fd', label: '#7c3aed' },
  'South South': { fill: '#f0fdf4', stroke: '#86efac', label: '#15803d' },
}

// Intensity scale for facility count / disease severity
function getIntensityColor(count: number, maxCount: number, baseHue: string): string {
  if (count === 0 || maxCount === 0) return baseHue
  const intensity = Math.min(count / maxCount, 1)
  // Return progressively darker/more saturated colors
  const alpha = 0.15 + intensity * 0.65
  return baseHue.replace(')', `, ${alpha})`).replace('rgb', 'rgba')
}

// Severity colors for disease map
function getSeverityColor(severity: string): { fill: string; border: string } {
  switch (severity?.toLowerCase()) {
    case 'emergency':
    case 'high':
    case 'alert':
      return { fill: 'rgba(239, 68, 68, 0.35)', border: '#ef4444' }
    case 'warning':
    case 'medium':
      return { fill: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b' }
    case 'watch':
    case 'low':
      return { fill: 'rgba(34, 197, 94, 0.2)', border: '#22c55e' }
    default:
      return { fill: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8' }
  }
}

// ---------- Facility Map Props ----------

export interface FacilityZoneData {
  zone: string
  facilityCount: number
  bedCapacity: number
  types?: Record<string, number>
}

interface NigeriaMapFacilitiesProps {
  data: FacilityZoneData[]
  totalFacilities?: number
}

export function NigeriaMapFacilities({ data, totalFacilities }: NigeriaMapFacilitiesProps) {
  const zoneLookup = React.useMemo(() => {
    const map = new Map<string, FacilityZoneData>()
    data.forEach(d => map.set(d.zone, d))
    return map
  }, [data])

  const maxCount = React.useMemo(
    () => Math.max(...data.map(d => d.facilityCount), 1),
    [data]
  )

  const total = totalFacilities ?? data.reduce((s, d) => s + d.facilityCount, 0)

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full flex flex-col">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-2">
          {geoPoliticalZones.map(zone => {
            const colors = zoneBaseColors[zone.name]
            return (
              <div key={zone.name} className="flex items-center gap-1.5 text-[10px]">
                <div
                  className="size-2.5 rounded-sm border"
                  style={{ backgroundColor: colors.fill, borderColor: colors.stroke }}
                />
                <span className="text-muted-foreground">{zone.shortName}</span>
              </div>
            )
          })}
        </div>

        {/* SVG Map */}
        <svg viewBox="0 0 560 420" className="w-full" style={{ maxHeight: '320px' }}>
          {/* Nigeria outline */}
          <path
            d="M30,30 L200,15 L310,20 L420,25 L500,40 L510,90 L500,140 L490,180 L460,210 L430,240 L380,290 L360,320 L330,340 L300,350 L270,370 L240,360 L220,340 L190,300 L180,340 L160,360 L130,370 L100,360 L70,340 L50,310 L40,290 L60,280 L100,260 L130,160 L80,140 L50,110 L30,80 Z"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Zone regions */}
          {geoPoliticalZones.map(zone => {
            const zoneData = zoneLookup.get(zone.name)
            const count = zoneData?.facilityCount || 0
            const beds = zoneData?.bedCapacity || 0
            const colors = zoneBaseColors[zone.name]

            // Calculate fill intensity based on facility count
            const intensity = maxCount > 0 ? Math.min(count / maxCount, 1) : 0
            const fillOpacity = count > 0 ? 0.3 + intensity * 0.6 : 0.15

            return (
              <g key={zone.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <path
                      d={zone.path}
                      fill={colors.fill}
                      fillOpacity={fillOpacity}
                      stroke={colors.stroke}
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all hover:stroke-2 hover:stroke-emerald-500 hover:fill-opacity-90"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[220px]">
                    <div className="font-semibold text-sm" style={{ color: colors.label }}>{zone.name}</div>
                    <div className="mt-1 space-y-0.5">
                      <div>States: {zone.states.join(', ')}</div>
                      <div className="font-medium">
                        {count} facilit{count === 1 ? 'y' : 'ies'}
                      </div>
                      {beds > 0 && <div>{beds.toLocaleString()} bed capacity</div>}
                      {zoneData?.types && Object.keys(zoneData.types).length > 0 && (
                        <div className="mt-1 border-t pt-1 space-y-0.5">
                          {Object.entries(zoneData.types).map(([type, tc]) => (
                            <div key={type} className="text-muted-foreground">
                              {type.replace(/_/g, ' ')}: {tc}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Zone label */}
                <text
                  x={zone.cx}
                  y={zone.cy - 6}
                  textAnchor="middle"
                  className="fill-slate-700 font-semibold"
                  fontSize="10"
                  style={{ pointerEvents: 'none' }}
                >
                  {zone.shortName}
                </text>
                {count > 0 && (
                  <text
                    x={zone.cx}
                    y={zone.cy + 8}
                    textAnchor="middle"
                    className="fill-slate-500"
                    fontSize="8"
                    style={{ pointerEvents: 'none' }}
                  >
                    {count} facilit{count === 1 ? 'y' : 'ies'}
                  </text>
                )}
              </g>
            )
          })}

          {/* Summary */}
          <text x="280" y="410" textAnchor="middle" className="fill-slate-400" fontSize="10">
            {total} facilities across {data.filter(d => d.facilityCount > 0).length} zones
          </text>
        </svg>
      </div>
    </TooltipProvider>
  )
}

// ---------- Disease Map Props ----------

export interface DiseaseZoneData {
  zone: string
  totalCases: number
  maxSeverity: string
  diseases: { name: string; cases: number; alertLevel: string }[]
}

interface NigeriaMapDiseaseProps {
  data: DiseaseZoneData[]
  totalAlerts?: number
}

const diseaseDotColors: Record<string, string> = {
  Malaria: '#10b981',
  Cholera: '#f59e0b',
  'Lassa Fever': '#ef4444',
  'COVID-19': '#6366f1',
  Typhoid: '#0d9488',
  Tuberculosis: '#059669',
}

export function NigeriaMapDisease({ data, totalAlerts }: NigeriaMapDiseaseProps) {
  const zoneLookup = React.useMemo(() => {
    const map = new Map<string, DiseaseZoneData>()
    data.forEach(d => map.set(d.zone, d))
    return map
  }, [data])

  const maxCases = React.useMemo(
    () => Math.max(...data.map(d => d.totalCases), 1),
    [data]
  )

  const total = totalAlerts ?? data.reduce((s, d) => s + d.totalCases, 0)

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full flex flex-col">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-2">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-muted-foreground font-medium">Severity:</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="size-2.5 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)', border: '1px solid #22c55e' }} />
            <span className="text-muted-foreground">Low/Watch</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="size-2.5 rounded-sm" style={{ backgroundColor: 'rgba(245, 158, 11, 0.5)', border: '1px solid #f59e0b' }} />
            <span className="text-muted-foreground">Warning/Med</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="size-2.5 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)', border: '1px solid #ef4444' }} />
            <span className="text-muted-foreground">Alert/Emergency</span>
          </div>
        </div>

        {/* SVG Map */}
        <svg viewBox="0 0 560 420" className="w-full" style={{ maxHeight: '280px' }}>
          {/* Nigeria outline */}
          <path
            d="M30,30 L200,15 L310,20 L420,25 L500,40 L510,90 L500,140 L490,180 L460,210 L430,240 L380,290 L360,320 L330,340 L300,350 L270,370 L240,360 L220,340 L190,300 L180,340 L160,360 L130,370 L100,360 L70,340 L50,310 L40,290 L60,280 L100,260 L130,160 L80,140 L50,110 L30,80 Z"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* Zone regions */}
          {geoPoliticalZones.map(zone => {
            const zoneData = zoneLookup.get(zone.name)
            const cases = zoneData?.totalCases || 0
            const severity = zoneData?.maxSeverity || 'Low'
            const colors = zoneBaseColors[zone.name]

            // Severity-based fill
            const severityStyle = getSeverityColor(severity)
            const fill = cases > 0 ? severityStyle.fill : colors.fill
            const stroke = cases > 0 ? severityStyle.border : colors.stroke
            const fillOpacity = cases > 0 ? 0.4 + (Math.min(cases / maxCases, 1) * 0.45) : 0.15

            // Pulsing indicator for high severity
            const isHighSeverity = ['emergency', 'high', 'alert'].includes(severity?.toLowerCase())

            return (
              <g key={zone.name}>
                {/* Pulsing ring for high severity */}
                {cases > 0 && isHighSeverity && (
                  <path
                    d={zone.path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    className="animate-pulse"
                    opacity={0.5}
                  />
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <path
                      d={zone.path}
                      fill={fill}
                      fillOpacity={fillOpacity}
                      stroke={stroke}
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all hover:stroke-2 hover:stroke-amber-500"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[220px]">
                    <div className="font-semibold text-sm">{zone.name}</div>
                    <div className="text-muted-foreground mt-0.5">{zone.states.join(', ')}</div>
                    {cases > 0 ? (
                      <div className="mt-1 space-y-1">
                        <div className="font-medium" style={{ color: stroke }}>
                          {cases.toLocaleString()} total cases — {severity}
                        </div>
                        <div className="border-t pt-1 space-y-0.5">
                          {zoneData?.diseases.map((d, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div
                                className="size-1.5 rounded-full"
                                style={{ backgroundColor: diseaseDotColors[d.name] || '#14b8a6' }}
                              />
                              <span>{d.name}: {d.cases.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground mt-1">No active outbreaks</div>
                    )}
                  </TooltipContent>
                </Tooltip>

                {/* Zone label */}
                <text
                  x={zone.cx}
                  y={zone.cy - 6}
                  textAnchor="middle"
                  className="fill-slate-700 font-semibold"
                  fontSize="10"
                  style={{ pointerEvents: 'none' }}
                >
                  {zone.shortName}
                </text>
                {cases > 0 && (
                  <text
                    x={zone.cx}
                    y={zone.cy + 8}
                    textAnchor="middle"
                    className={isHighSeverity ? 'fill-red-600' : 'fill-slate-500'}
                    fontSize="8"
                    fontWeight={isHighSeverity ? '600' : '400'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {cases.toLocaleString()} cases
                  </text>
                )}
              </g>
            )
          })}

          {/* Summary */}
          <text x="280" y="410" textAnchor="middle" className="fill-slate-400" fontSize="10">
            {total > 0
              ? `${total.toLocaleString()} cases across ${data.filter(d => d.totalCases > 0).length} zones`
              : 'No disease outbreak data available'
            }
          </text>
        </svg>
      </div>
    </TooltipProvider>
  )
}
