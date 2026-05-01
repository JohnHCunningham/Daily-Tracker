'use client'

import { motion } from 'framer-motion'
import { HiCheck } from 'react-icons/hi'

const tiers = [
  {
    name: 'DIRECT',
    price: '$50',
    period: '/rep/month',
    description: 'For Sandler-trained teams ready to score every call.',
    features: [
      'All 8 Sandler components scored',
      'Daily call analysis',
      'Rep-facing coaching cards',
      'Manager approval workflow',
      'Team performance dashboard',
      'HubSpot, Fathom & Aircall integrations',
      'Priority support',
    ],
    cta: 'Book a Demo',
    highlighted: true,
  },
  {
    name: 'FRANCHISE / WHOLESALE',
    price: '$50',
    period: '/rep/month',
    description: 'For Sandler franchise owners offering AI coaching to their clients.',
    features: [
      'Everything in Direct',
      'White-label branding',
      'Bulk user management',
      'Franchise performance dashboard',
      'Client onboarding support',
      'Revenue share model',
      'Dedicated account manager',
    ],
    cta: 'Schedule a Partnership Call',
    highlighted: false,
  },
]

const SandlerPricing = () => {
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
            Sandler Coaching.{' '}
            <span className="text-teal">Two Ways In.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Whether you run a Sandler-trained team or a Sandler franchise, there&apos;s a path built for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative card ${
                tier.highlighted
                  ? 'border-2 border-teal shadow-glow-teal'
                  : 'border border-teal/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-gold text-navy px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-3 tracking-wide">{tier.name}</h3>
                <div className="mb-3">
                  <span className="text-5xl font-bold text-teal">{tier.price}</span>
                  <span className="text-light-muted">{tier.period}</span>
                </div>
                <p className="text-light-muted text-sm">{tier.description}</p>
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

        {/* Pilot Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="bg-navy-light/60 border border-gold/20 rounded-2xl p-8 text-center">
            <p className="text-gold font-bold text-sm uppercase tracking-widest mb-2">
              Free Pilot
            </p>
            <p className="text-2xl font-bold text-light mb-3">
              See your team&apos;s Sandler scores in 48 hours.
            </p>
            <p className="text-light-muted max-w-xl mx-auto">
              No credit card. No commitment. We&apos;ll analyze real calls from your team and show you exactly where the submarine breaks down — before you spend a dollar.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SandlerPricing
