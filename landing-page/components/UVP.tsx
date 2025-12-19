'use client'

import { motion } from 'framer-motion'

const UVP = () => {
  return (
    <section className="section-padding bg-navy border-y border-teal/20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-5xl mx-auto"
        >
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-teal/10 border border-teal/30 rounded-full text-teal text-sm font-semibold uppercase tracking-wide">
              What SalesAI.Coach Actually Does
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-teal to-aqua bg-clip-text text-transparent">
              SalesAI.Coach
            </span>{' '}
            is a behavioral accountability system that turns your sales methodology into daily execution.
          </h2>

          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-3">👁️</div>
              <h3 className="text-lg font-bold text-teal mb-2">Visible</h3>
              <p className="text-sm text-light-muted">See exactly how your team executes your framework</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-teal mb-2">Measurable</h3>
              <p className="text-sm text-light-muted">Track behavior metrics that actually move revenue</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-bold text-teal mb-2">Coachable</h3>
              <p className="text-sm text-light-muted">Give objective feedback on specific behaviors</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-teal mb-2">Enforceable</h3>
              <p className="text-sm text-light-muted">Turn discipline into daily habit, not hope</p>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-lg text-light-muted mt-12 italic border-l-4 border-teal pl-6 text-left max-w-2xl mx-auto"
          >
            "We don't replace your methodology. We make it impossible to ignore."
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

export default UVP
