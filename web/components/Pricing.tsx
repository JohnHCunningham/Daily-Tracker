'use client'

import { motion } from 'framer-motion'
import { HiCheck } from 'react-icons/hi'
import { useState } from 'react'

const tiers = [
  {
    name: 'STARTER',
    monthlyPrice: '$249',
    annualPrice: '$207',
    annualTotal: '$2,490',
    period: '/month',
    description: '1-4 reps',
    perRep: '~$62-249/rep',
    features: [
      'Up to 4 users',
      'Unlimited conversation analyses',
      'Choose any methodology',
      'AI-powered coaching with proven scripts',
      'Activity & revenue tracking',
      'Email support'
    ],
    cta: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'GROWTH',
    monthlyPrice: '$489',
    annualPrice: '$407',
    annualTotal: '$4,890',
    period: '/month',
    description: '5-9 reps',
    perRep: '~$54-98/rep',
    badge: 'Most Popular',
    features: [
      'Up to 9 users',
      'Everything in Starter, plus:',
      'Admin dashboard',
      'Team performance analytics',
      'Adaptive learning memory',
      'Conversion funnel metrics',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'SCALE',
    monthlyPrice: '$1,148',
    annualPrice: '$957',
    annualTotal: '$11,480',
    period: '/month',
    description: '10-20 reps',
    perRep: '~$57-115/rep',
    features: [
      'Up to 20 users',
      'Everything in Growth, plus:',
      'Advanced analytics',
      'Custom reporting',
      'Dedicated account manager',
      'Quarterly business reviews',
      'API access'
    ],
    cta: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'ENTERPRISE',
    monthlyPrice: '$1,496',
    annualPrice: '$1,247',
    annualTotal: 'Custom',
    period: '/month',
    description: '20+ reps',
    perRep: 'Custom pricing',
    features: [
      'Unlimited users',
      'Everything in Scale, plus:',
      'White-label branding',
      'Custom integrations (Salesforce, HubSpot)',
      'Custom methodology training',
      'SLA guarantee',
      'Dedicated success team'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
]

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false)

  const handlePricingClick = (tierName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ; (window as any).gtag('event', 'view_pricing', {
        event_category: 'engagement',
        event_label: tierName,
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
            Protect Your Training Investment.{' '}
            <span className="text-teal">Scale Coaching Without Scaling Headcount.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto mb-8">
            For leaders who believe in their methodology but don't have 40 hours/week to coach every rep.
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative card ${tier.highlighted
                  ? 'border-2 border-teal shadow-glow-teal scale-105'
                  : 'border border-teal/10'
                }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-gold text-navy px-4 py-1 rounded-full text-sm font-bold">
                    ⭐ {tier.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-2">
                  <div>
                    <span className="text-5xl font-bold text-teal">
                      {isAnnual ? tier.annualPrice : tier.monthlyPrice}
                    </span>
                    <span className="text-light-muted">{tier.period}</span>
                  </div>
                  {isAnnual && tier.annualTotal !== 'Custom' && (
                    <p className="text-sm text-gold mt-1">Billed {tier.annualTotal}/year</p>
                  )}
                </div>
                <p className="text-light-muted">{tier.description}</p>
                <p className="text-xs text-teal/70 mt-1">{tier.perRep}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <HiCheck className="text-teal text-xl flex-shrink-0 mt-0.5" />
                    <span className="text-light-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://tidycal.com/aiautomations/sales-coach"
                onClick={() => handlePricingClick(tier.name)}
                className={`block w-full text-center font-bold py-3 px-6 rounded-lg transition-all ${tier.highlighted
                    ? 'bg-gradient-gold text-navy hover:shadow-glow-gold'
                    : 'bg-navy-light text-teal border border-teal hover:bg-teal hover:text-white'
                  }`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
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
