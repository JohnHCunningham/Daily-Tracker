'use client'

interface SandlerBreakdownProps {
  scores: Record<string, number>
}

export default function SandlerBreakdown({ scores }: SandlerBreakdownProps) {
  function getBarColor(score: number): string {
    if (score >= 7) return 'bg-teal'
    if (score >= 5) return 'bg-gold'
    return 'bg-pink'
  }

  function getTextColor(score: number): string {
    if (score >= 7) return 'text-teal'
    if (score >= 5) return 'text-gold'
    return 'text-pink'
  }

  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([component, score]) => (
        <div key={component}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-light-muted">{component}</span>
            <span className={`text-sm font-bold ${getTextColor(score as number)}`}>
              {score}/10
            </span>
          </div>
          <div className="w-full bg-navy rounded-full h-2">
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
