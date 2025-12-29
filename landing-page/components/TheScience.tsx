'use client'

import { motion } from 'framer-motion'
import { HiLightningBolt, HiEye, HiRefresh, HiTrendingUp } from 'react-icons/hi'
import Image from 'next/image'

const scientificPrinciples = [
  {
    icon: HiLightningBolt,
    title: 'Immediate Feedback',
    description: 'The brain learns through fast feedback loops. Delayed feedback = weak learning. 30-second response = behavior change.'
  },
  {
    icon: HiEye,
    title: 'Full Transparency',
    description: 'Self-monitoring is one of the strongest predictors of habit formation. See behavior clearly, without judgment.'
  },
  {
    icon: HiRefresh,
    title: 'Conscious Execution',
    description: 'Under pressure, reps default to old habits. Immediate feedback interrupts this loop and anchors behavior to process.'
  },
  {
    icon: HiTrendingUp,
    title: 'Reinforcement Learning',
    description: 'Action → Feedback → Adjustment → Reinforcement. This is how elite athletes train. Now it\'s how your team sells.'
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
    category: 'SalesAI.coach',
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
            Why Sales Training Fails{' '}
            <span className="text-teal">(And How We Fix It)</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto leading-relaxed">
            Behavioral science is clear: <strong className="text-light">new habits don't form through insight alone.</strong> They form through fast feedback loops and visible progress.
          </p>
        </motion.div>

        {/* The Problem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="card bg-navy-light/50 border-pink/20">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-pink">⚠️</span> The Problem With Traditional Training
            </h3>
            <p className="text-light-muted leading-relaxed mb-4">
              Your team learned MEDDIC or Sandler in a workshop. It made sense. But three months later, under pressure, they default back to old habits.
            </p>
            <p className="text-light leading-relaxed font-semibold">
              Why? <span className="text-teal">The brain needs immediate feedback to change behavior.</span>
            </p>
            <p className="text-light-muted leading-relaxed mt-2">
              Without it, awareness decays. Old patterns win.
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
                    <p className="text-light-muted leading-relaxed">{principle.description}</p>
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
                className={`card ${
                  index === 0
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
                      <span className={column.color}>{item}</span>
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
            The Psychology of <span className="text-teal">Accountability</span>
          </h3>
          <div className="card bg-navy-light/50 border-teal/20">
            <div className="rounded-xl overflow-hidden mb-6">
              <Image
                src="/accountability-psychology.jpg"
                alt="The Psychology of Accountability - Alone vs With Others vs With Mirror"
                width={1200}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <p className="text-xl text-light-muted text-center leading-relaxed">
              <strong className="text-light">When observed, behavior changes.</strong> Even a mirror works.
              SalesAI.Coach creates that "mirror effect" for every sales conversation—your team executes better
              when they know methodology compliance is visible.
            </p>
          </div>
        </motion.div>

        {/* Elite Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="card bg-gradient-to-br from-gold/10 to-gold/5 border-gold/30">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              This Is How Elite Athletes Train
            </h3>
            <p className="text-xl text-light-muted mb-6 leading-relaxed">
              Coaches review plays <strong className="text-light">immediately</strong>. Pilots get <strong className="text-light">continuous feedback</strong>. Doctors use <strong className="text-light">checklists + outcome review</strong>.
            </p>
            <p className="text-2xl font-bold text-gold mb-8">
              Now your sales team gets the same system—for methodology execution.
            </p>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="btn-primary inline-block"
            >
              See How It Works
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TheScience
