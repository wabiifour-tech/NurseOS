'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Activity,
} from 'lucide-react'

// ---------- Nigeria Geopolitical Zones ----------

export const stateToZone: Record<string, string> = {
  // North West
  Sokoto: 'North West', Zamfara: 'North West', Kebbi: 'North West',
  Katsina: 'North West', Kano: 'North West', Jigawa: 'North West', Kaduna: 'North West',
  // North East
  Borno: 'North East', Yobe: 'North East', Bauchi: 'North East',
  Gombe: 'North East', Adamawa: 'North East', Taraba: 'North East',
  // North Central
  Niger: 'North Central', Kwara: 'North Central', Kogi: 'North Central',
  Benue: 'North Central', Plateau: 'North Central', FCT: 'North Central', Nasarawa: 'North Central',
  // South West
  Lagos: 'South West', Ogun: 'South West', Oyo: 'South West',
  Osun: 'South West', Ondo: 'South West', Ekiti: 'South West',
  // South East
  Enugu: 'South East', Anambra: 'South East', Imo: 'South East',
  Abia: 'South East', Ebonyi: 'South East',
  // South South
  Edo: 'South South', Delta: 'South South', Bayelsa: 'South South',
  Rivers: 'South South', 'Akwa Ibom': 'South South', 'Cross River': 'South South',
}

interface ZoneLayout {
  name: string
  shortName: string
  states: string[]
  gridPos: string
}

const zoneLayouts: ZoneLayout[] = [
  {
    name: 'North West',
    shortName: 'NW',
    states: ['Sokoto', 'Zamfara', 'Kebbi', 'Katsina', 'Kano', 'Jigawa', 'Kaduna'],
    gridPos: 'row-start-1 col-start-1 col-span-2',
  },
  {
    name: 'North East',
    shortName: 'NE',
    states: ['Borno', 'Yobe', 'Bauchi', 'Gombe', 'Adamawa', 'Taraba'],
    gridPos: 'row-start-1 col-start-3 col-span-2',
  },
  {
    name: 'North Central',
    shortName: 'NC',
    states: ['Niger', 'Kwara', 'Kogi', 'Benue', 'Plateau', 'FCT', 'Nasarawa'],
    gridPos: 'row-start-2 col-start-1 col-span-2',
  },
  {
    name: 'South West',
    shortName: 'SW',
    states: ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
    gridPos: 'row-start-3 col-start-1',
  },
  {
    name: 'South East',
    shortName: 'SE',
    states: ['Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi'],
    gridPos: 'row-start-3 col-start-2',
  },
  {
    name: 'South South',
    shortName: 'SS',
    states: ['Edo', 'Delta', 'Bayelsa', 'Rivers', 'Akwa Ibom', 'Cross River'],
    gridPos: 'row-start-2 col-start-3 col-span-2',
  },
]

// ---------- Props ----------

export interface DiseaseZoneData {
  zone: string
  totalCases: number
  maxSeverity: string
  diseases: { name: string; cases: number; alertLevel: string }[]
}

interface SurveillanceMapProps {
  data: DiseaseZoneData[]
  totalAlerts?: number
}

// ---------- Severity helpers ----------

type Severity = 'low' | 'moderate' | 'high'

function classifySeverity(severity: string): Severity {
  const level = (severity || '').toLowerCase()
  if (['emergency', 'high', 'alert'].includes(level)) return 'high'
  if (['warning', 'medium'].includes(level)) return 'moderate'
  return 'low'
}

function getSeverityStyle(severity: Severity): { bg: string; border: string; headerText: string; icon: React.ComponentType<{ className?: string }> } {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        headerText: 'text-red-800',
        icon: AlertTriangle,
      }
    case 'moderate':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        headerText: 'text-amber-800',
        icon: Shield,
      }
    case 'low':
    default:
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        headerText: 'text-emerald-800',
        icon: Activity,
      }
  }
}

function getSeverityBadge(severity: Severity): string {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-800 border-red-300'
    case 'moderate': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
}

function getTrend(alertLevel: string): 'increasing' | 'decreasing' | 'stable' {
  const level = (alertLevel || '').toLowerCase()
  if (['emergency', 'high', 'alert'].includes(level)) return 'increasing'
  if (['watch', 'low'].includes(level)) return 'decreasing'
  return 'stable'
}

function TrendIcon({ trend }: { trend: 'increasing' | 'decreasing' | 'stable' }) {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="size-3 text-red-500" />
    case 'decreasing':
      return <TrendingDown className="size-3 text-emerald-500" />
    case 'stable':
      return <Minus className="size-3 text-slate-400" />
  }
}

// ---------- Component ----------

export function SurveillanceMap({ data, totalAlerts }: SurveillanceMapProps) {
  const zoneLookup = React.useMemo(() => {
    const map = new Map<string, DiseaseZoneData>()
    data.forEach(d => map.set(d.zone, d))
    return map
  }, [data])

  const totalCases = data.reduce((s, d) => s + d.totalCases, 0)
  const total = totalAlerts ?? totalCases

  return (
    <div className="w-full space-y-3">
      {/* Severity Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px]">
        <span className="text-muted-foreground font-medium">Severity:</span>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-emerald-400 border border-emerald-500" />
          <span className="text-muted-foreground">Low / Watch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-amber-400 border border-amber-500" />
          <span className="text-muted-foreground">Moderate / Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-red-400 border border-red-500" />
          <span className="text-muted-foreground">High / Emergency</span>
        </div>
      </div>

      {/* Zone Grid */}
      <div className="grid grid-cols-4 grid-rows-3 gap-2">
        {zoneLayouts.map(zone => {
          const zoneData = zoneLookup.get(zone.name)
          const cases = zoneData?.totalCases || 0
          const severity = classifySeverity(zoneData?.maxSeverity || 'Low')
          const diseases = zoneData?.diseases || []
          const style = getSeverityStyle(severity)
          const SeverityIcon = style.icon

          return (
            <div key={zone.name} className={zone.gridPos}>
              <Card className={`h-full border ${style.border} ${cases > 0 ? style.bg : 'bg-slate-50'} transition-all hover:shadow-md`}>
                <CardContent className="p-3 space-y-2">
                  {/* Zone header */}
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${cases > 0 ? style.headerText : 'text-slate-400'}`}>
                      {zone.name}
                    </h3>
                    <Badge className={`text-[10px] border ${cases > 0 ? getSeverityBadge(severity) : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {zone.shortName}
                    </Badge>
                  </div>

                  {/* Case count */}
                  {cases > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <SeverityIcon className="size-3.5 shrink-0" />
                      <span className="font-bold text-slate-900">{cases.toLocaleString()}</span>
                      <span className="text-muted-foreground">cases</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="size-3" />
                      <span>No outbreaks</span>
                    </div>
                  )}

                  {/* Disease breakdown */}
                  {diseases.length > 0 && (
                    <div className="space-y-1">
                      {diseases.slice(0, 3).map((d, i) => {
                        const trend = getTrend(d.alertLevel)
                        return (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-700 font-medium truncate flex items-center gap-1">
                              <TrendIcon trend={trend} />
                              {d.name}
                            </span>
                            <span className="text-muted-foreground ml-1 shrink-0">{d.cases.toLocaleString()}</span>
                          </div>
                        )
                      })}
                      {diseases.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{diseases.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* States */}
                  <div className="flex flex-wrap gap-0.5">
                    {zone.states.slice(0, 3).map(s => (
                      <span key={s} className="text-[9px] text-muted-foreground bg-white/60 px-1 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                    {zone.states.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1">+{zone.states.length - 3}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="text-center text-xs text-muted-foreground">
        {total > 0
          ? `${total.toLocaleString()} cases across ${data.filter(d => d.totalCases > 0).length} of 6 geopolitical zones`
          : 'No disease outbreak data available'
        }
      </div>
    </div>
  )
}
