'use client'

import { useMemo } from 'react'
import type { CRMLead } from '../page'
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS } from '@/lib/crm/stages'

interface TodayMovementProps {
  leads: CRMLead[]
}

// Stacked progress bar showing how many leads were advanced into each stage today.
export default function TodayMovement({ leads }: TodayMovementProps) {
  const { counts, total } = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const counts: Record<string, number> = {}
    let total = 0

    for (const stage of STAGE_ORDER) {
      const n = leads.filter(
        (l) =>
          l.status === stage &&
          l.stage_changed_at != null &&
          new Date(l.stage_changed_at) >= startOfToday
      ).length
      counts[stage] = n
      total += n
    }

    return { counts, total }
  }, [leads])

  if (total === 0) {
    return (
      <div className="bg-white border border-bone-dark rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-espresso mb-1">Today's Movement</h3>
        <p className="text-sm text-stone-light">No leads moved yet today.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-bone-dark rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-espresso">Today's Movement</h3>
        <span className="text-sm font-medium text-espresso">{total} advanced</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-bone-dark/40 mb-3">
        {STAGE_ORDER.map((stage) => {
          const n = counts[stage]
          if (!n) return null
          return (
            <div
              key={stage}
              title={`${STAGE_LABELS[stage]}: ${n}`}
              style={{
                width: `${(n / total) * 100}%`,
                backgroundColor: STAGE_COLORS[stage],
              }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {STAGE_ORDER.map((stage) => {
          const n = counts[stage]
          if (!n) return null
          return (
            <div key={stage} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[stage] }}
              />
              <span className="text-stone">{STAGE_LABELS[stage]}</span>
              <span className="font-medium text-espresso">{n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
