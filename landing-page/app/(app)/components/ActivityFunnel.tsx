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
        backgroundColor: '#10C3B0',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Target',
        data: data.map((d) => d.target),
        backgroundColor: '#131a40',
        borderColor: '#10C3B0',
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
        backgroundColor: '#0C1030',
        titleColor: '#F2F4F8',
        bodyColor: '#F2F4F8',
        borderColor: '#10C3B0',
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
        grid: { color: 'rgba(16, 195, 176, 0.05)' },
        ticks: { color: '#cbd5e1', font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#F2F4F8', font: { size: 12, weight: 'bold' as const } },
      },
    },
  }

  return (
    <div className="w-full" style={{ height: data.length * 60 + 40 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
