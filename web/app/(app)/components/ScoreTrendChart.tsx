'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface ScoreTrendChartProps {
  labels: string[]
  scores: number[]
  height?: number
}

export default function ScoreTrendChart({ labels, scores, height = 200 }: ScoreTrendChartProps) {
  const data = {
    labels,
    datasets: [
      {
        data: scores,
        borderColor: '#10C3B0',
        backgroundColor: 'rgba(16, 195, 176, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#10C3B0',
        pointBorderColor: '#10C3B0',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { color: 'rgba(255,255,255,0.4)', stepSize: 2 },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.4)' },
        grid: { display: false },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: '#0C1030',
        titleColor: '#E8EAF0',
        bodyColor: '#10C3B0',
        borderColor: 'rgba(16,195,176,0.3)',
        borderWidth: 1,
      },
    },
  }

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  )
}
