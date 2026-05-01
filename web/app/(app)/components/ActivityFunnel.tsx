'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface FunnelStage {
  stage: string
  actual: number
  target: number
}

interface ActivityFunnelProps {
  data: FunnelStage[]
}

export default function ActivityFunnel({ data }: ActivityFunnelProps) {
  const labels = data.map((d) => d.stage)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Actual',
        data: data.map((d) => d.actual),
        backgroundColor: '#B5583E',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Target',
        data: data.map((d) => d.target),
        backgroundColor: '#EAE3D8',
        borderColor: '#B5583E',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#F4EFE8',
        titleColor: '#2A221C',
        bodyColor: '#2A221C',
        borderColor: '#B5583E',
        borderWidth: 1,
        callbacks: {
          label: (ctx: unknown) => {
            const item = ctx as { dataset: { label?: string }; parsed: { x: number } }
            return `${item.dataset.label || ''}: ${item.parsed.x}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(42, 34, 28, 0.08)' },
        ticks: { color: '#6E6358', font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#2A221C', font: { size: 12, weight: 'bold' as const } },
      },
    },
  }

  return (
    <div className="w-full" style={{ height: data.length * 60 + 40 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
