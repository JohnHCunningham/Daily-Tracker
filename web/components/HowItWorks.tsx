'use client'

import { motion } from 'framer-motion'
import { HiUpload, HiCog, HiLightningBolt } from 'react-icons/hi'

const steps = [
  {
    number: '1',
    title: 'Record or Upload',
    description: 'After a sales call, paste the transcript (or upload audio—we\'ll transcribe it). Takes 10 seconds.',
    icon: HiUpload,
    color: 'from-teal to-aqua'
  },
  {
    number: '2',
    title: 'AI Analyzes',
    description: 'Our AI scores the conversation using your chosen methodology (Sandler, MEDDIC, etc.) and compares it to your reference scripts.',
    icon: HiCog,
    color: 'from-gold to-gold-bright'
  },
  {
    number: '3',
    title: 'Get Tactical Coaching',
    description: 'Receive: ✅ What went well • ⚠️ Areas to improve • 📋 Exact scripts to use next time • 🎯 3-5 tactical plays for your next call',
    icon: HiLightningBolt,
    color: 'from-pink to-pink-dark'
  }
]

const HowItWorks = () => {
  return (
    <section className="section-padding bg-gradient-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            From Call to Coaching in{' '}
            <span className="text-teal">3 Simple Steps</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-teal via-gold to-pink opacity-30" style={{ top: '80px' }} />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Step number badge */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 relative z-10 shadow-lg`}>
                  {step.number}
                </div>

                <div className="card text-center">
                  <Icon className="text-5xl text-teal mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-light-muted leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
