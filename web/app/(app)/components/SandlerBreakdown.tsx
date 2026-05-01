'use client'

interface SandlerBreakdownProps {
  scores: Record<string, number>
}

export default function SandlerBreakdown({ scores }: SandlerBreakdownProps) {
  function getBarColor(score: number): string {
    if (score >= 7) return 'bg-terracotta'
    if (score >= 5) return 'bg-clay'
    return 'bg-terracotta-dark'
  }

  function getTextColor(score: number): string {
    if (score >= 7) return 'text-terracotta'
    if (score >= 5) return 'text-clay'
    return 'text-terracotta-dark'
  }

  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([component, score]) => (
        <div key={component}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-stone">{component}</span>
            <span className={`text-sm font-bold ${getTextColor(score as number)}`}>
              {score}/10
            </span>
          </div>
          <div className="w-full bg-bone rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getBarColor(score as number)} transition-all`}
              style={{ width: `${((score as number) / 10) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
