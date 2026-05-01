'use client'

import { motion } from 'framer-motion'

const stages = [
  { name: 'Bonding & Rapport', repScore: 78, repGoal: 85, teamAvg: 72 },
  { name: 'Upfront Contract', repScore: 64, repGoal: 80, teamAvg: 58 },
  { name: 'Pain Funnel', repScore: 52, repGoal: 75, teamAvg: 61 },
  { name: 'Budget', repScore: 45, repGoal: 70, teamAvg: 50 },
  { name: 'Decision Process', repScore: 71, repGoal: 80, teamAvg: 65 },
  { name: 'Fulfillment', repScore: 83, repGoal: 85, teamAvg: 76 },
  { name: 'Post-Sell', repScore: 38, repGoal: 70, teamAvg: 44 },
]

function RadialGauge({
  repScore,
  repGoal,
  teamAvg,
}: {
  repScore: number
  repGoal: number
  teamAvg: number
}) {
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 6

  // Three rings: outer = goal, middle = team avg, inner = rep score
  const rings = [
    { value: repGoal, radius: 52, color: '#F4B03A', opacity: 0.35, label: 'Goal' },
    { value: teamAvg, radius: 42, color: '#cbd5e1', opacity: 0.5, label: 'Team' },
    { value: repScore, radius: 32, color: '#10C3B0', opacity: 1, label: 'Rep' },
  ]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring) => {
        const circumference = 2 * Math.PI * ring.radius
        const filled = (ring.value / 100) * circumference
        const gap = circumference - filled
        return (
          <g key={ring.label}>
            {/* Background track */}
            <circle
              cx={cx}
              cy={cy}
              r={ring.radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
            />
            {/* Filled arc */}
            <circle
              cx={cx}
              cy={cy}
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${gap}`}
              strokeDashoffset={circumference * 0.25}
              opacity={ring.opacity}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </g>
        )
      })}
      {/* Center score */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#10C3B0"
        fontSize="20"
        fontWeight="bold"
      >
        {repScore}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#cbd5e1"
        fontSize="9"
        opacity={0.7}
      >
        / 100
      </text>
    </svg>
  )
}

const SandlerRadialScores = () => {
  return (
    <section className="section-padding bg-navy-dark border-t border-teal/10">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The Submarine at a Glance.{' '}
            <span className="text-teal">Every Stage. Every Rep.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            See exactly where each rep stands — their score, their goal, and how the team compares. No guessing. No waiting for the quarterly review.
          </p>
        </motion.div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal inline-block" />
            <span className="text-sm text-light-muted">Rep&apos;s Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-light-muted inline-block" />
            <span className="text-sm text-light-muted">Team Average</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gold inline-block" />
            <span className="text-sm text-light-muted">Rep&apos;s Goal</span>
          </div>
        </div>

        {/* Radial cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className="card flex flex-col items-center text-center py-6 px-3"
            >
              <RadialGauge
                repScore={stage.repScore}
                repGoal={stage.repGoal}
                teamAvg={stage.teamAvg}
              />
              <h3 className="text-sm font-bold text-light mt-4 mb-3 leading-tight">
                {stage.name}
              </h3>
              <div className="w-full space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-teal">Score</span>
                  <span className="text-teal font-bold">{stage.repScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gold opacity-60">Goal</span>
                  <span className="text-gold opacity-60 font-bold">{stage.repGoal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light-muted opacity-60">Team</span>
                  <span className="text-light-muted opacity-60 font-bold">{stage.teamAvg}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Insight callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="bg-navy-light/60 border border-teal/20 rounded-2xl p-8 text-center">
            <p className="text-teal font-bold text-sm uppercase tracking-widest mb-2">
              Sample Data
            </p>
            <p className="text-lg text-light leading-relaxed">
              This is what your dashboard looks like after one week. Every rep. Every stage. Every call scored automatically against Sandler methodology.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SandlerRadialScores
