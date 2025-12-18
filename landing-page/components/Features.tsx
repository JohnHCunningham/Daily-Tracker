'use client'

import { motion } from 'framer-motion'
import { HiCheckCircle, HiLightningBolt, HiChartBar, HiCog, HiCurrencyDollar, HiUserGroup } from 'react-icons/hi'

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
    title: 'Admin Dashboard',
    description: 'For managers: team performance overview, client engagement scores, conversion funnel metrics, email campaign analytics.',
    icon: HiUserGroup
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

        {/* Feature Infographic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <img
            src="/daily-tracker-infographic.png"
            alt="Daily Tracker Complete Feature Overview - Track, Admin Reports, Coach, and Grow"
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
