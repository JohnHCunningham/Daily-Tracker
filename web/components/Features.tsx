'use client'

import { motion } from 'framer-motion'
import { HiCheckCircle, HiLightningBolt, HiChartBar, HiCog, HiCurrencyDollar, HiUserGroup, HiClock, HiSparkles } from 'react-icons/hi'

// NEW: Hero features highlighting key value props
const heroFeatures = [
  {
    title: 'One-Click AI Coaching',
    description: 'Paste a call transcript, get instant methodology-specific coaching with proven scripts. No manual review needed.',
    icon: HiLightningBolt,
    highlight: true
  },
  {
    title: 'Adaptive Learning Memory',
    description: 'AI remembers proven scripts and objection handlers, serving up exactly what YOUR rep needs based on their specific weaknesses.',
    icon: HiSparkles,
    highlight: true
  },
  {
    title: 'Immediate Feedback Loop',
    description: 'Coaching happens while behavior is fresh — not days later in a 1:1. The science says this is 4x more effective.',
    icon: HiClock,
    highlight: true
  },
  {
    title: 'Training ROI Multiplier',
    description: 'Finally get return on your methodology investment. The AI enforces what your trainers taught, every single call.',
    icon: HiCurrencyDollar,
    highlight: true
  }
]

const features = [
  {
    title: 'Multi-Methodology Support',
    description: 'Choose your framework: MEDDIC, Sandler, Challenger, SPIN, or Gap Selling. The AI adapts its coaching to YOUR methodology.',
    icon: HiCheckCircle
  },
  {
    title: 'Custom Script Generator',
    description: 'Describe your business. Our AI writes opening scripts, value props, CTAs, and objection handlers tailored to YOUR product and market.',
    icon: HiLightningBolt
  },
  {
    title: 'Conversation Analysis',
    description: 'Paste a transcript. Get scores for pain funnel depth, MEDDIC qualification, talk/listen ratio, and tactical scripts to improve.',
    icon: HiChartBar
  },
  {
    title: 'Activity Tracking',
    description: 'Log daily metrics: dials, conversations, discovery meetings, sales closed. See trends, hit goals, celebrate wins.',
    icon: HiCog
  },
  {
    title: 'Revenue Analytics',
    description: 'Track sales by client, service, time period, and close rate. Know your numbers in real-time.',
    icon: HiCurrencyDollar
  },
  {
    title: 'LinkedIn Content Creator',
    description: 'Stop the scroll with 10/10 AI-generated content. Based on behavioral science, our system writes frameworks, case studies, and hooks that drive profile visits.',
    icon: HiUserGroup
  },
  {
    title: 'Admin Dashboard',
    description: 'For managers: team performance overview, client engagement scores, conversion funnel metrics, email campaign analytics.',
    icon: HiCog
  }
]

const Features = () => {
  return (
    <section id="features" className="section-padding bg-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to Drive{' '}
            <span className="text-teal">Sales Performance</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto mb-12">
            Complete platform for tracking, reporting, coaching, and growing your sales team
          </p>
        </motion.div>

        {/* NEW: Hero Features - Key Value Props with Animation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {heroFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="relative card bg-gradient-to-br from-navy-light to-navy border-teal/30 hover:border-teal/60 overflow-hidden group"
              >
                {/* Animated glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-teal/0 via-teal/10 to-teal/0"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                    ease: 'linear'
                  }}
                />

                <div className="relative z-10">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                    className="w-14 h-14 bg-gradient-to-br from-teal to-aqua rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-teal/30"
                  >
                    <Icon className="text-white text-2xl" />
                  </motion.div>
                  <h3 className="text-lg font-bold mb-2 text-light">{feature.title}</h3>
                  <p className="text-light-muted text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Feature Infographic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <img
            src="/daily-tracker-infographic.png"
            alt="AI Sales Coaching Platform Features: Activity tracking, admin reports dashboard, conversation analysis, revenue analytics, and team performance coaching for MEDDIC Sandler Challenger methodologies"
            className="w-full max-w-6xl mx-auto rounded-2xl shadow-2xl border border-teal/20"
          />
        </motion.div>

        {/* Detailed Feature Cards */}
        <h3 className="text-3xl font-bold text-center mb-12">
          Dive Deeper Into Our <span className="text-teal">Core Features</span>
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card group hover:border-teal/50"
              >
                <Icon className="text-5xl text-teal mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-light-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
