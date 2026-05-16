'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Bed, Users } from 'lucide-react'

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
  /** Grid position: [row, col] in a 3-row x 4-col grid */
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

export interface FacilityZoneData {
  zone: string
  facilityCount: number
  bedCapacity: number
  types?: Record<string, number>
}

interface NigeriaZoneMapProps {
  data: FacilityZoneData[]
  totalFacilities?: number
}

// ---------- Color helpers ----------

/** Returns a teal/green intensity class based on facility count relative to max */
function getZoneColorClass(count: number, maxCount: number): { bg: string; border: string; text: string; badge: string } {
  if (count === 0) {
    return {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-400',
      badge: 'bg-slate-100 text-slate-500',
    }
  }
  const intensity = maxCount > 0 ? count / maxCount : 0

  if (intensity > 0.75) {
    return {
      bg: 'bg-emerald-100',
      border: 'border-emerald-400',
      text: 'text-emerald-800',
      badge: 'bg-emerald-200 text-emerald-800',
    }
  }
  if (intensity > 0.5) {
    return {
      bg: 'bg-teal-50',
      border: 'border-teal-300',
      text: 'text-teal-800',
      badge: 'bg-teal-100 text-teal-800',
    }
  }
  if (intensity > 0.25) {
    return {
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700',
    }
  }
  return {
    bg: 'bg-emerald-50/30',
    border: 'border-emerald-100',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50/50 text-emerald-600',
  }
}

// ---------- Component ----------

export function NigeriaZoneMap({ data, totalFacilities }: NigeriaZoneMapProps) {
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
    <div className="w-full space-y-3">
      {/* Zone Grid - arranged in approximate geographic layout */}
      <div className="grid grid-cols-4 grid-rows-3 gap-2">
        {zoneLayouts.map(zone => {
          const zoneData = zoneLookup.get(zone.name)
          const count = zoneData?.facilityCount || 0
          const beds = zoneData?.bedCapacity || 0
          const types = zoneData?.types || {}
          const colors = getZoneColorClass(count, maxCount)

          return (
            <div key={zone.name} className={zone.gridPos}>
              <Card className={`h-full border ${colors.border} ${colors.bg} transition-all hover:shadow-md`}>
                <CardContent className="p-3 space-y-2">
                  {/* Zone header */}
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${colors.text}`}>{zone.name}</h3>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.badge}`}>
                      {zone.shortName}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Building2 className="size-3 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{count}</span>
                      <span className="text-muted-foreground">facilit{count === 1 ? 'y' : 'ies'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Bed className="size-3 text-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{beds.toLocaleString()}</span>
                      <span className="text-muted-foreground">beds</span>
                    </div>
                    {Object.keys(types).length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="size-3 text-slate-500 shrink-0" />
                        <span className="text-muted-foreground truncate" title={Object.entries(types).map(([t, c]) => `${t.replace(/_/g, ' ')}: ${c}`).join(', ')}>
                          {Object.entries(types).slice(0, 2).map(([t, c]) => `${t.replace(/_/g, ' ')}: ${c}`).join(', ')}
                          {Object.keys(types).length > 2 && ` +${Object.keys(types).length - 2}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* States */}
                  <div className="flex flex-wrap gap-0.5">
                    {zone.states.slice(0, 4).map(s => (
                      <span key={s} className="text-[9px] text-muted-foreground bg-white/60 px-1 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                    {zone.states.length > 4 && (
                      <span className="text-[9px] text-muted-foreground px-1">+{zone.states.length - 4}</span>
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
        {total} facilit{total === 1 ? 'y' : 'ies'} across {data.filter(d => d.facilityCount > 0).length} of 6 geopolitical zones
      </div>
    </div>
  )
}
