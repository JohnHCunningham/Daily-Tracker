'use client'

import { motion } from 'framer-motion'
import { HiLightningBolt, HiEye, HiRefresh, HiTrendingUp } from 'react-icons/hi'
import Image from 'next/image'

const scientificPrinciples = [
  {
    icon: HiLightningBolt,
    title: 'Hebbian Learning',
    description: '"Neurons that fire together, wire together." The brain requires a 30-second feedback loop to anchor methodology to behavior. Anything later is just a memory.'
  },
  {
    icon: HiEye,
    title: 'The Mirror Effect',
    description: 'Observation induces "Conscious Execution." When reps know behavior is visible, the Pre-frontal Cortex remains engaged, preventing a default to old habits.'
  },
  {
    icon: HiRefresh,
    title: 'Cognitive Load Reduction',
    description: 'Reps fail when they have to think about "How to sell" while selling. One Click Coaching automates the tracking so the brain can focus on the human in front of them.'
  },
  {
    icon: HiTrendingUp,
    title: 'Pattern Interruption',
    description: 'One Click Coaching identifies "Revenue Leaking Habits" and interrupts the loop immediately—the only proven way to untangle deeply rooted behavior.'
  }
]

const neuroProofPoints = [
  {
    prefix: '87%',
    label: 'Knowledge Decay',
    context: 'of sales training is forgotten within 30 days without behavioral infrastructure.',
    source: 'Ebbinghaus Forgetting Curve Research'
  },
  {
    prefix: '73%',
    label: 'Retention with Spaced Repetition',
    context: 'retention rate vs. 20% with traditional one-time training. Same-day reinforcement is key.',
    source: 'Journal of Applied Psychology'
  },
  {
    prefix: '4x',
    label: 'Retention Lift',
    context: 'Immediate reinforcement increases methodology adherence by 400% compared to monthly coaching.',
    source: 'Sales Management Association'
  }
]

const comparison = [
  {
    category: 'Traditional Training',
    items: [
      'Feedback comes days/weeks later',
      'No transparency on execution',
      'Reps guess if they followed methodology',
      'Old habits win under pressure'
    ],
    color: 'text-light-muted'
  },
  {
    category: 'One Click Coaching',
    items: [
      'Instant feedback (30 seconds)',
      'Full visibility on what happened',
      'Exact methodology execution score',
      'Conscious process-driven behavior'
    ],
    color: 'text-teal'
  }
]

const TheScience = () => {
  return (
    <section className="section-padding bg-navy relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The Neuro-Science of{' '}
            <span className="text-teal">Sales Performance</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto leading-relaxed">
            Behavioral science is clear: <strong className="text-light">new habits don't form through insight alone.</strong> They form through fast feedback loops and visible progress.
          </p>
        </motion.div>

        {/* Neuro Stats Dashboard */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {neuroProofPoints.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-navy-light/40 border border-teal/10 p-8 rounded-2xl text-center hover:border-teal/30 transition-all"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                className="text-5xl font-bold text-teal mb-2"
              >
                {stat.prefix}
              </motion.div>
              <div className="text-lg font-bold text-light mb-3 uppercase tracking-wider">{stat.label}</div>
              <p className="text-sm text-light-muted leading-relaxed mb-3">{stat.context}</p>
              <p className="text-xs text-teal/60 italic">Source: {stat.source}</p>
            </motion.div>
          ))}
        </div>

        {/* The Problem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="card bg-navy-light/50 border-pink/20">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-pink">⚠️</span> The Training Decay Crisis
            </h3>
            <p className="text-light-muted leading-relaxed mb-4">
              Your team learned a framework in a workshop. It made sense. But three months later, under pressure, they default back to old habits.
            </p>
            <p className="text-light leading-relaxed font-semibold">
              Why? <span className="text-teal">The brain needs immediate feedback to change behavior.</span>
            </p>
            <p className="text-light-muted leading-relaxed mt-2">
              Without it, awareness vanishes. Revenue leaking habits become permanent.
            </p>
          </div>
        </motion.div>

        {/* Scientific Principles */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-16">
          {scientificPrinciples.map((principle, index) => {
            const Icon = principle.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card bg-gradient-to-br from-navy-light to-navy border-teal/10 hover:border-teal/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal to-aqua rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white text-2xl" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-light">{principle.title}</h4>
                    <p className="text-light-muted leading-relaxed text-sm">{principle.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h3 className="text-3xl font-bold text-center mb-8">
            The <span className="text-pink">Old Way</span> vs.{' '}
            <span className="text-teal">The Science-Backed Way</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {comparison.map((column, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`card ${index === 0
                    ? 'bg-navy-light/30 border-light-muted/10'
                    : 'bg-gradient-to-br from-teal/10 to-aqua/5 border-teal/30'
                  }`}
              >
                <h4 className={`text-xl font-bold mb-4 ${index === 0 ? 'text-light-muted' : 'text-teal'}`}>
                  {column.category}
                </h4>
                <ul className="space-y-3">
                  {column.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`text-lg mt-0.5 ${column.color}`}>
                        {index === 0 ? '✗' : '✓'}
                      </span>
                      <span className={column.color + " text-sm"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Psychology of Accountability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h3 className="text-3xl font-bold text-center mb-8">
            The Psychology of <span className="text-teal">Visibility</span>
          </h3>
          <div className="card bg-navy-light/50 border-teal/20">
            <div className="rounded-xl overflow-hidden mb-6">
              <Image
                src="/accountability-psychology.jpg"
                alt="Sales Psychology and Behavioral Science: How visibility and accountability drive methodology adoption and permanent behavior change in sales teams"
                width={1200}
                height={400}
                className="w-full h-auto opacity-80"
              />
            </div>
            <p className="text-lg text-light-muted text-center leading-relaxed">
              <strong className="text-light">When observed, behavior changes.</strong> This isn't monitoring; it's a "mirror effect" for every sales conversation. Your team executes better simply because the standard is now <span className="text-teal font-bold uppercase italic">Visible.</span>
            </p>
          </div>
        </motion.div>

        {/* Final Scientific CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="card bg-gradient-to-br from-gold/10 to-gold/5 border-gold/30">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              This Is How Elite Performance Is Built
            </h3>
            <p className="text-xl text-light-muted mb-6 leading-relaxed">
              Coaches review plays <strong className="text-light">immediately</strong>. Pilots get <strong className="text-light">continuous feedback</strong>. Now your sales team gets the same behavioral infrastructure.
            </p>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="btn-primary inline-block font-bold text-lg px-8 py-3"
            >
              Start Permanent Behavior Change
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TheScience
