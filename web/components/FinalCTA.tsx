'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { HiCheck, HiLockClosed, HiCreditCard, HiPhone } from 'react-icons/hi'

const trustBadges = [
  { icon: HiCreditCard, text: 'No credit card required' },
  { icon: HiCheck, text: '30-day money-back guarantee' },
  { icon: HiLockClosed, text: 'Bank-level security' },
  { icon: HiPhone, text: 'Cancel anytime' }
]

const FinalCTA = () => {
  return (
    <section className="section-padding bg-navy relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Stop Hoping Your Team Uses the Methodology.{' '}
            <span className="bg-gradient-to-r from-teal to-aqua bg-clip-text text-transparent">
              Start Knowing.
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-light-muted mb-12">
            Join hundreds of sales teams getting instant, AI-powered coaching on every call.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="btn-primary text-lg"
            >
              Start Your Free Trial
            </a>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg"
            >
              Schedule a Demo
            </a>
          </div>

          {/* Trust badges */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 justify-center"
                >
                  <Icon className="text-teal text-2xl" />
                  <span className="text-light-muted text-sm">{badge.text}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FinalCTA
