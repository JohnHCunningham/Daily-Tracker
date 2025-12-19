'use client'

import { motion } from 'framer-motion'

const solutions = [
  {
    title: 'Track Behavior (Not Just Results)',
    description: 'Most tools show you what went wrong. We show you WHY. Track methodology execution in real-time: upfront contracts set, pain identified, budget discussed—the behaviors that actually drive revenue.',
    icon: '🎯'
  },
  {
    title: 'Manager Visibility Into Execution',
    description: 'Dashboards that show which reps follow your framework and which cut corners. See team-wide patterns, rep-by-rep execution, and exactly where discipline breaks down.',
    icon: '👁️'
  },
  {
    title: 'Coach Before Deals Are Lost',
    description: 'Real-time insights mean real-time coaching. Give feedback on specific behaviors—not vague "do better" advice—while the deal is still live.',
    icon: '💬'
  }
]

const Solution = () => {
  return (
    <section className="section-padding bg-gradient-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            SalesAI.Coach Is the{' '}
            <span className="bg-gradient-to-r from-teal to-aqua bg-clip-text text-transparent">
              Execution Layer
            </span>
            {' '}Beneath Your Sales Framework
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Instead of replacing your methodology, we operationalize it—making your framework visible, measurable, coachable, and enforceable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="card hover:shadow-glow-teal"
            >
              <div className="text-5xl mb-4">{solution.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-teal">{solution.title}</h3>
              <p className="text-light-muted leading-relaxed">{solution.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Solution
