'use client'

import { motion } from 'framer-motion'

const problems = [
  {
    title: 'Training Works. Daily Reinforcement Doesn\'t.',
    description: 'Your reps know the methodology—they just don\'t execute it consistently. You need daily behavioral reinforcement, not another training session.',
    icon: '📚'
  },
  {
    title: 'Manager Visibility Is the Real Gap',
    description: 'Managers can\'t coach what they can\'t see. By the time you review calls, the deal is already lost. You need real-time visibility into execution.',
    icon: '👁️'
  },
  {
    title: 'You Track Results. Not Behavior.',
    description: 'Most tools show you what already went wrong (lost deals, low close rates). SalesAI.Coach shows you WHY—which behaviors are breaking down before revenue drops.',
    icon: '🎯'
  }
]

const Problem = () => {
  return (
    <section className="section-padding bg-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Sales Training Works.{' '}
            <span className="text-teal">What Fails Is Execution.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            This isn't a motivation problem. It's a <span className="text-teal font-semibold">visibility problem</span>.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="card"
            >
              <div className="text-5xl mb-4">{problem.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-pink">{problem.title}</h3>
              <p className="text-light-muted leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Problem
