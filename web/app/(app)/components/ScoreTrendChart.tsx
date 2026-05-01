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
        borderColor: '#B5583E',
        backgroundColor: 'rgba(16, 195, 176, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#B5583E',
        pointBorderColor: '#B5583E',
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
        ticks: { color: '#6E6358', stepSize: 2 },
        grid: { color: 'rgba(42, 34, 28, 0.08)' },
      },
      x: {
        ticks: { color: '#6E6358' },
        grid: { display: false },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: '#F4EFE8',
        titleColor: '#2A221C',
        bodyColor: '#B5583E',
        borderColor: 'rgba(212, 99, 62, 0.3)',
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
