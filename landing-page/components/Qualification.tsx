'use client'

import { motion } from 'framer-motion'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi2'

const idealFor = [
  'B2B companies with 5–50 sales reps',
  'Teams already trained in a formal sales methodology',
  'Sales managers responsible for coaching performance',
  'Companies tired of "hope-based selling"',
]

const notAFit = [
  'You\'re founder-led sales only (not yet)',
  'You want "another CRM"',
  'You\'re looking for motivation instead of discipline',
  'You change methodologies every quarter',
]

const Qualification = () => {
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
            Is SalesAI.Coach{' '}
            <span className="text-teal">Right for You?</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            We're selective about who we work with. This only works if you're committed to execution discipline.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Ideal For */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="card border-2 border-teal/30 bg-gradient-to-br from-teal/5 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <HiCheckCircle className="text-teal text-4xl" />
                <h3 className="text-2xl font-bold text-teal">Built For</h3>
              </div>
              <ul className="space-y-4">
                {idealFor.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <HiCheckCircle className="text-teal text-xl flex-shrink-0 mt-1" />
                    <span className="text-light leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Not A Fit */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="card border-2 border-pink/30 bg-gradient-to-br from-pink/5 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <HiXCircle className="text-pink text-4xl" />
                <h3 className="text-2xl font-bold text-pink">Not A Fit If</h3>
              </div>
              <ul className="space-y-4">
                {notAFit.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <HiXCircle className="text-pink text-xl flex-shrink-0 mt-1" />
                    <span className="text-light-muted leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 p-8 bg-gradient-to-r from-teal/10 to-aqua/10 rounded-2xl border border-teal/20 max-w-3xl mx-auto"
        >
          <p className="text-xl text-light font-semibold mb-4">
            Still not sure if this is for you?
          </p>
          <p className="text-light-muted">
            Book a 15-minute call. We'll tell you honestly if SalesAI.Coach is a fit—and if it's not, we'll point you in the right direction.
          </p>
          <a
            href="https://tidycal.com/aiautomations/sales-coach"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 btn-secondary"
          >
            Book a Quick Call
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default Qualification
