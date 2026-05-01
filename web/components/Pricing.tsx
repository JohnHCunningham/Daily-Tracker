'use client'

import { motion } from 'framer-motion'
import { HiCheck } from 'react-icons/hi'
import { useState } from 'react'
import Link from 'next/link'

// Per-rep pricing: $50/rep/month or $500/rep/year (2 months free)
const PRICE_PER_REP_MONTHLY = 50
const PRICE_PER_REP_ANNUAL = 500

const features = [
  'Unlimited conversation analyses',
  'Choose any methodology',
  'AI-powered coaching with proven scripts',
  'Activity & revenue tracking',
  'Admin dashboard & team analytics',
  'Adaptive learning memory',
  'Advanced reporting',
  '14-day free trial',
]

const teamSizes = [
  { reps: 1, label: '1 rep' },
  { reps: 3, label: '3 reps' },
  { reps: 5, label: '5 reps' },
  { reps: 10, label: '10 reps' },
  { reps: 20, label: '20 reps' },
]

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedReps, setSelectedReps] = useState(5)

  const monthlyTotal = selectedReps * PRICE_PER_REP_MONTHLY
  const annualTotal = selectedReps * PRICE_PER_REP_ANNUAL
  const annualSavings = (monthlyTotal * 12) - annualTotal

  const handleGetStarted = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ; (window as any).gtag('event', 'begin_checkout', {
        event_category: 'engagement',
        event_label: `${selectedReps}_reps_${isAnnual ? 'annual' : 'monthly'}`,
        value: isAnnual ? annualTotal : monthlyTotal,
      })
    }
  }

  return (
    <section id="pricing" className="section-padding bg-gradient-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          {/* Value Proposition Banner */}
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-teal via-teal/80 to-teal px-6 py-3 rounded-full shadow-lg shadow-teal/30">
              <p className="text-white font-bold text-sm md:text-base">
                💡 You invested $15,000+ per rep in training. This ensures you get that ROI.
              </p>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple Per-Rep Pricing.{' '}
            <span className="text-teal">Scale As You Grow.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto mb-8">
            Pay only for the reps you're coaching. No tiers, no complexity, no surprises.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`font-semibold ${!isAnnual ? 'text-teal' : 'text-light-muted'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-full transition-colors ${isAnnual ? 'bg-teal' : 'bg-navy-light border border-teal/30'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
            <span className={`font-semibold ${isAnnual ? 'text-teal' : 'text-light-muted'}`}>
              Annual <span className="text-gold text-sm">(Save 2 months)</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Card */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative card border-2 border-teal shadow-glow-teal"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-gold text-navy px-4 py-1 rounded-full text-sm font-bold">
                ⭐ 14-Day Free Trial
              </span>
            </div>

            <div className="text-center mb-8">
              {/* Per-Rep Price */}
              <div className="mb-6">
                <span className="text-6xl font-bold text-teal">
                  ${isAnnual ? PRICE_PER_REP_ANNUAL : PRICE_PER_REP_MONTHLY}
                </span>
                <span className="text-light-muted text-xl">
                  /rep/{isAnnual ? 'year' : 'month'}
                </span>
              </div>

              {/* Team Size Selector */}
              <div className="mb-6">
                <p className="text-light-muted mb-3">Select team size:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {teamSizes.map(({ reps, label }) => (
                    <button
                      key={reps}
                      onClick={() => setSelectedReps(reps)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedReps === reps
                          ? 'bg-teal text-navy'
                          : 'bg-navy-light text-light-muted border border-teal/20 hover:border-teal/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Price */}
              <div className="p-4 bg-navy rounded-xl border border-teal/20">
                <p className="text-light-muted text-sm mb-1">
                  {selectedReps} rep{selectedReps !== 1 ? 's' : ''} × ${isAnnual ? PRICE_PER_REP_ANNUAL : PRICE_PER_REP_MONTHLY}/{isAnnual ? 'year' : 'month'}
                </p>
                <p className="text-3xl font-bold text-light">
                  ${isAnnual ? annualTotal.toLocaleString() : monthlyTotal}/{isAnnual ? 'year' : 'month'}
                </p>
                {isAnnual && (
                  <p className="text-sm text-gold mt-1">
                    Save ${annualSavings.toLocaleString()}/year vs monthly
                  </p>
                )}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <HiCheck className="text-teal text-xl flex-shrink-0 mt-0.5" />
                  <span className="text-light-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={`/signup?reps=${selectedReps}&billing=${isAnnual ? 'annual' : 'monthly'}`}
              onClick={handleGetStarted}
              className="block w-full text-center font-bold py-4 px-6 rounded-lg bg-gradient-gold text-navy hover:shadow-glow-gold transition-all text-lg"
            >
              Start Free Trial
            </Link>
            <p className="text-center text-light-muted text-sm mt-3">
              No credit card required for trial
            </p>
          </motion.div>
        </div>

        {/* ROI Calculator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="card bg-gradient-to-br from-navy-light to-navy border-gold/20">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
              The Math That Makes This a <span className="text-gold">No-Brainer</span>
            </h3>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-navy/50 rounded-xl border border-teal/10">
                <div className="text-3xl font-bold text-pink mb-2">$80-120K</div>
                <p className="text-light-muted text-sm">Annual cost of a sales manager</p>
              </div>
              <div className="text-center p-4 bg-navy/50 rounded-xl border border-teal/10">
                <div className="text-3xl font-bold text-light-muted mb-2">6-8 reps</div>
                <p className="text-light-muted text-sm">Max a manager can effectively coach</p>
              </div>
              <div className="text-center p-4 bg-navy/50 rounded-xl border border-teal/10">
                <div className="text-3xl font-bold text-teal mb-2">15-20 reps</div>
                <p className="text-light-muted text-sm">Coached effectively with One Click Coaching</p>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-teal/10 to-gold/10 rounded-xl border border-teal/20">
              <p className="text-xl font-bold text-light mb-2">
                If coaching generates <span className="text-gold">ONE extra deal per quarter</span>...
              </p>
              <p className="text-3xl font-bold text-teal">ROI is 10x+</p>
            </div>
          </div>
        </motion.div>

        {/* Expected Sales Lift Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-5xl mx-auto"
        >
          <div className="card bg-navy-light/50 border-teal/20">
            <h3 className="text-xl font-bold text-center mb-6">
              Expected Results <span className="text-teal">(Based on Industry Data)</span>
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal mb-2">15-30%</div>
                <p className="text-light-muted text-sm">Improvement in close rates with consistent methodology coaching</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal mb-2">20%+</div>
                <p className="text-light-muted text-sm">Reduction in pipeline slippage through behavioral accountability</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal mb-2">3x</div>
                <p className="text-light-muted text-sm">More methodology behaviors retained with same-day feedback</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Money-Back Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="inline-block bg-navy-light border border-teal/20 rounded-lg p-6">
            <h4 className="text-xl font-bold mb-2">30-Day Money-Back Guarantee</h4>
            <p className="text-light-muted">
              Try it risk-free. If your team's close rate doesn't improve, we'll refund every penny.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing
