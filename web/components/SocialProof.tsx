'use client'

import { motion } from 'framer-motion'

const stats = [
  { label: 'Close Rates', value: '30%', icon: '📈' },
  { label: 'Methodology Adoption', value: '85%', icon: '✅' },
  { label: 'Ramp Time', value: '50%', icon: '⚡' },
]

const SocialProof = () => {
  return (
    <section className="py-12 bg-navy-light/50">
      <div className="container-custom">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-light-muted mb-8"
        >
          Trusted by sales teams to improve
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-4xl font-bold text-teal mb-2">{stat.value}</div>
              <div className="text-light-muted">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialProof
