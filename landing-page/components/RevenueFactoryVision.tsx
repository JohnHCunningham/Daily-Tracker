'use client'

import { motion } from 'framer-motion'
import { HiCheckCircle, HiClock } from 'react-icons/hi2'
import Image from 'next/image'

const stages = [
  {
    number: 1,
    name: 'ATTRACTION',
    status: 'coming',
    launchDate: 'February 2026',
    description: 'AI-powered lead generation & nurturing',
    features: [
      'Lead generation automation',
      'Lead enrichment & scoring',
      'Google Ads generator',
      'Instagram ad creator with AI images',
      'Speed-to-lead responses (< 30 seconds)',
      'Multi-channel outreach (email, SMS, voice)'
    ],
    icon: '🎯',
    color: 'from-pink to-pink/80'
  },
  {
    number: 2,
    name: 'EXECUTION',
    status: 'available',
    launchDate: 'Available Now',
    description: 'Sales methodology coaching & performance tracking',
    features: [
      'Real-time conversation analysis',
      'Methodology execution tracking (Sandler, MEDDIC, etc.)',
      'AI voice agents (inbound & outbound)',
      'Team performance analytics',
      'Automated follow-up sequences',
      'Manager coaching dashboard'
    ],
    icon: '⚡',
    color: 'from-teal to-aqua'
  },
  {
    number: 3,
    name: 'COMPLETION',
    status: 'coming',
    launchDate: 'March 2026',
    description: 'Close deals faster with automation',
    features: [
      'AI quote/proposal generator',
      'Contract automation',
      'Deal closing workflows',
      'Funnel leak detection & elimination',
      'E-signature integration',
      'Revenue forecasting'
    ],
    icon: '🏆',
    color: 'from-gold to-gold/80'
  }
]

const RevenueFactoryVision = () => {
  return (
    <section className="section-padding bg-navy-light">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The Revenue Factory:{' '}
            <span className="bg-gradient-to-r from-teal to-gold bg-clip-text text-transparent">
              Complete System
            </span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            End-to-end AI sales automation. Attract leads, execute methodology, complete deals—all in one system.
          </p>
        </motion.div>

        {/* Factory Integration Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20 rounded-2xl overflow-hidden border border-teal/20 shadow-2xl"
        >
          <Image
            src="/revenue-factory-map.jpg"
            alt="The Revenue Factory Integration Map"
            width={1200}
            height={600}
            className="w-full h-auto"
          />
        </motion.div>

        {/* 3 Stages */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stages.map((stage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative card ${
                stage.status === 'available'
                  ? 'border-2 border-teal shadow-glow-teal'
                  : 'border border-teal/10 opacity-90'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                {stage.status === 'available' ? (
                  <span className="bg-gradient-to-r from-teal to-aqua text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <HiCheckCircle /> {stage.launchDate}
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-pink to-pink/80 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <HiClock /> {stage.launchDate}
                  </span>
                )}
              </div>

              <div className="text-center mb-6 mt-4">
                <div className="text-6xl mb-4">{stage.icon}</div>
                <div className="text-sm text-light-muted font-semibold mb-2">STAGE {stage.number}</div>
                <h3 className={`text-3xl font-bold mb-3 bg-gradient-to-r ${stage.color} bg-clip-text text-transparent`}>
                  {stage.name}
                </h3>
                <p className="text-light-muted">{stage.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {stage.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-light-muted">
                    <HiCheckCircle className={`flex-shrink-0 mt-0.5 ${
                      stage.status === 'available' ? 'text-teal' : 'text-pink'
                    }`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={stage.status === 'available' ? 'https://tidycal.com/aiautomations/sales-coach' : '#pricing'}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                  stage.status === 'available'
                    ? 'btn-primary'
                    : 'bg-pink/20 text-pink border border-pink/30 hover:bg-pink/30'
                }`}
              >
                {stage.status === 'available' ? 'Start Free Trial' : 'Reserve Your Spot (20% Off)'}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Full Factory Bundle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card border-2 border-gold shadow-glow-gold max-w-4xl mx-auto"
        >
          <div className="text-center">
            <div className="inline-block mb-4">
              <span className="bg-gradient-gold text-navy px-6 py-2 rounded-full text-sm font-bold">
                ⭐ BEST VALUE - FOUNDING CUSTOMER PRICING
              </span>
            </div>
            <h3 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gold to-teal bg-clip-text text-transparent">
                The Full Factory
              </span>
            </h3>
            <p className="text-xl text-light-muted mb-6">
              All 3 stages bundled together. Complete end-to-end revenue automation.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-pink text-3xl font-bold">40%</div>
                <div className="text-light-muted text-sm">Discount vs. Individual</div>
              </div>
              <div className="text-center">
                <div className="text-teal text-3xl font-bold">$1,497</div>
                <div className="text-light-muted text-sm">Per Month (Founding Rate)</div>
              </div>
              <div className="text-center">
                <div className="text-gold text-3xl font-bold">Unlimited</div>
                <div className="text-light-muted text-sm">Users & Calls</div>
              </div>
            </div>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="btn-primary inline-block text-lg px-12 py-4"
            >
              Lock In Founding Rate
            </a>
            <p className="text-sm text-light-muted mt-4">
              Only 10 spots available at this price. Locks in rate for life.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default RevenueFactoryVision
