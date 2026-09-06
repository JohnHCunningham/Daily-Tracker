'use client'

import { useMemo } from 'react'
import type { CRMLead } from '../page'
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS } from '@/lib/crm/stages'

interface TodayMovementProps {
  leads: CRMLead[]
}

// Progress + encouragement: stacked bar of today's advances, a shrinking
// pending-backlog count, and a nudge to keep going.
export default function TodayMovement({ leads }: TodayMovementProps) {
  const { counts, total, pending, clearedPct } = useMemo(() => {
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

    const pending = leads.filter((l) => l.status === 'pending').length
    const cleared = leads.length - pending
    const clearedPct = leads.length > 0 ? Math.round((cleared / leads.length) * 100) : 0
    return { counts, total, pending, clearedPct }
  }, [leads])

  const encouragement =
    total === 0
      ? 'No moves yet today. One lead gets the board started. 💪'
      : total < 5
        ? 'Warming up — keep the momentum going. 🔥'
        : `On a roll. ${pending} pending left to work. 🚀`

  return (
    <div className="bg-white border border-bone-dark rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-espresso">Today's Movement</h3>
        <span className="text-sm font-medium text-espresso">{total} advanced</span>
      </div>

      <p className="text-sm text-stone-light mb-3">{encouragement}</p>

      {total > 0 && (
        <>
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
        </>
      )}

      {/* Pending backlog progress */}
      <div className="mt-3 pt-3 border-t border-bone-dark/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-stone-light">Pending backlog cleared</span>
          <span className="font-medium text-espresso">
            {clearedPct}% · {pending} to go
          </span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-bone-dark/40">
          <div
            className="h-full bg-terracotta transition-all"
            style={{ width: `${Math.max(clearedPct, 2)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
