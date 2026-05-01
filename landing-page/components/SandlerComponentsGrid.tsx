'use client'

import { motion } from 'framer-motion'
import {
  HiHandRaised,
  HiDocumentCheck,
  HiMagnifyingGlass,
  HiBanknotes,
  HiClipboardDocumentList,
  HiCheckBadge,
  HiShieldCheck,
  HiArrowUturnLeft,
} from 'react-icons/hi2'

const components = [
  {
    name: 'Bonding & Rapport',
    icon: HiHandRaised,
    description: 'Measures whether the rep built genuine connection before transitioning to business.',
    coaching: '"You jumped to discovery at 1:42. Try spending 30 more seconds mirroring their energy before pivoting."',
  },
  {
    name: 'Upfront Contract',
    icon: HiDocumentCheck,
    description: 'Detects whether the rep set a clear agenda, time boundary, and mutual outcome for the call.',
    coaching: '"No Upfront Contract detected. Try: \'Here\'s what I\'d like to cover. At the end, we\'ll decide together if there\'s a fit.\'"',
  },
  {
    name: 'Pain Funnel',
    icon: HiMagnifyingGlass,
    description: 'Scores depth of pain exploration — surface-level mentions vs. quantified business impact.',
    coaching: '"Pain identified but not quantified. When she said \'it\'s a problem,\' follow with: \'Help me understand — what does that cost you monthly?\'"',
  },
  {
    name: 'Budget',
    icon: HiBanknotes,
    description: 'Tracks whether budget was discussed before the demo, not after the proposal.',
    coaching: '"Budget was never addressed. Before your next demo, ask: \'Has budget been allocated for solving this, or is that a conversation we need to have?\'"',
  },
  {
    name: 'Decision Process',
    icon: HiClipboardDocumentList,
    description: 'Identifies whether the rep mapped who decides, how they decide, and by when.',
    coaching: '"Decision process assumed, not confirmed. Try: \'Walk me through what happens between our conversation and a signed agreement.\'"',
  },
  {
    name: 'Fulfillment',
    icon: HiCheckBadge,
    description: 'Evaluates whether the solution presentation addressed stated pain — not a feature dump.',
    coaching: '"You presented 6 features. The prospect mentioned 1 problem. Tie every capability directly to their stated pain."',
  },
  {
    name: 'Post-Sell',
    icon: HiShieldCheck,
    description: 'Checks for buyer\'s remorse prevention — confirming commitment and inoculating against competition.',
    coaching: '"No post-sell detected. After verbal commitment, try: \'What might come up between now and implementation that could derail this?\'"',
  },
  {
    name: 'Negative Reverse Selling',
    icon: HiArrowUturnLeft,
    description: 'Detects when the rep used strategic takeaway or reversal to let the prospect sell themselves.',
    coaching: '"When they said \'it\'s too expensive,\' you defended. Try reversing: \'You\'re right — maybe this isn\'t the right fit. What would make it worth the investment?\'"',
  },
]

const SandlerComponentsGrid = () => {
  return (
    <section id="scoring" className="section-padding bg-navy-dark">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Every Call. 8 Sandler Components.{' '}
            <span className="text-teal">Scored.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Each conversation is measured against the Sandler system — not generic sales tips. Your reps see exactly where they executed and where the submarine broke down.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {components.map((component, index) => {
            const Icon = component.icon
            return (
              <motion.div
                key={component.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="card group hover:border-teal/40"
              >
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center mb-4 border border-teal/20 group-hover:bg-teal/20 transition-colors">
                  <Icon className="text-teal text-xl" />
                </div>
                <h3 className="text-lg font-bold text-light mb-2">{component.name}</h3>
                <p className="text-sm text-light-muted mb-4 leading-relaxed">
                  {component.description}
                </p>
                <div className="bg-navy/60 rounded-lg p-3 border border-gold/10">
                  <p className="text-xs text-gold/90 italic leading-relaxed">
                    {component.coaching}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SandlerComponentsGrid
