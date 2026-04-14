'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

interface ScoreRadialProps {
  score: number
  maxScore?: number
  size?: number
  label?: string
  sublabel?: string
  showPercentage?: boolean
}

function getColor(score: number, max: number): string {
  const pct = (score / max) * 100
  if (pct >= 70) return '#10C3B0' // teal — strong
  if (pct >= 40) return '#F4B03A' // gold — needs work
  return '#E64563'                // pink — weak
}

export default function ScoreRadial({
  score,
  maxScore = 10,
  size = 140,
  label,
  sublabel,
  showPercentage = false,
}: ScoreRadialProps) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const color = getColor(score, maxScore)

  const data = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [color, 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        cutout: '78%',
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: false,
    plugins: {
      tooltip: { enabled: false },
    },
    animation: {
      animateRotate: true,
      duration: 1200,
    },
  }

  const displayValue = showPercentage
    ? `${Math.round(percentage)}%`
    : maxScore === 10 ? score.toFixed(1) : score.toString()

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <Doughnut data={data} options={options} width={size} height={size} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ color, fontSize: size * 0.22 }}>
            {displayValue}
          </span>
          {sublabel && (
            <span className="text-light-muted" style={{ fontSize: Math.max(size * 0.08, 10) }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-light-muted text-center leading-tight">{label}</span>
      )}
    </div>
  )
}
