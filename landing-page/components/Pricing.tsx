'use client'

import { motion } from 'framer-motion'
import { HiCheck } from 'react-icons/hi'
import Link from 'next/link'

const tiers = [
  {
    name: 'STARTER',
    price: '$497',
    period: '/month',
    description: '1-4 reps',
    features: [
      '1-4 users',
      'Unlimited conversation analyses',
      'Choose any methodology',
      'Custom script generator',
      'Activity & revenue tracking',
      'Email support'
    ],
    cta: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'GROWTH',
    price: '$795',
    period: '/month',
    description: '5-9 reps',
    badge: 'Most Popular',
    features: [
      '5-9 users',
      'Everything in Starter, plus:',
      'Admin dashboard',
      'Team performance analytics',
      'Client engagement scoring',
      'Conversion funnel metrics',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'PROFESSIONAL',
    price: '$997',
    period: '/month',
    description: '10-24 reps',
    features: [
      '10-24 users',
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
    price: '$1,495',
    period: '/month',
    description: '25+ reps',
    features: [
      'Unlimited users',
      'Everything in Professional, plus:',
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
  const handlePricingClick = (tierName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'view_pricing', {
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple Pricing.{' '}
            <span className="text-teal">Scale as You Grow.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative card ${
                tier.highlighted
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
                  <span className="text-5xl font-bold text-teal">{tier.price}</span>
                  <span className="text-light-muted">{tier.period}</span>
                </div>
                <p className="text-light-muted">{tier.description}</p>
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
                className={`block w-full text-center font-bold py-3 px-6 rounded-lg transition-all ${
                  tier.highlighted
                    ? 'bg-gradient-gold text-navy hover:shadow-glow-gold'
                    : 'bg-navy-light text-teal border border-teal hover:bg-teal hover:text-white'
                }`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>

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
