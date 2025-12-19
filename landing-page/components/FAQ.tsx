'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { HiChevronDown } from 'react-icons/hi'

const faqs = [
  {
    question: 'Does this work with my sales methodology?',
    answer: 'Yes! We support MEDDIC, Sandler, Challenger, SPIN, and Gap Selling. You can also use general sales best practices if you don\'t follow a specific methodology. The AI adapts its coaching to your framework.'
  },
  {
    question: 'Do I need to record my calls?',
    answer: 'No. You can paste transcripts from Zoom, Gong, Chorus, or any other tool. If you do have audio recordings, we can transcribe them (coming soon).'
  },
  {
    question: 'How long does analysis take?',
    answer: 'Under 30 seconds. Upload a transcript, click "Analyze," and get instant coaching with tactical scripts.'
  },
  {
    question: 'Can I customize the scripts?',
    answer: 'Absolutely. Describe your business and we\'ll generate custom opening scripts, value props, CTAs, and objection handlers. Edit them to match your exact wording. The AI will compare your actual calls to YOUR scripts.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. We use bank-level encryption (AES-256) both at rest and in transit. Your conversations are stored securely on Supabase with Row Level Security, ensuring only you can access your data. We\'re SOC 2 compliant and never share your data with third parties. For enterprise customers, we offer dedicated instances and custom security agreements.'
  },
  {
    question: 'Who owns the data?',
    answer: 'You do. 100%. We\'re the infrastructure - you own the insights. Export your data anytime as CSV or via API. Delete your data anytime with one click. No lock-in, no gotchas. Your call transcripts, coaching notes, and performance data belong to you, period.'
  },
  {
    question: 'Does this integrate with my CRM (Salesforce, HubSpot, etc.)?',
    answer: 'SalesAI.Coach complements your CRM, it doesn\'t replace it. We track behavior execution (did they follow your methodology?), while your CRM tracks results (did the deal close?). Currently, you can export coaching summaries to paste into your CRM. Native API integrations with Salesforce and HubSpot are coming in Q2 2025. No double data entry - we push insights to your CRM automatically.'
  },
  {
    question: 'Can managers see their team\'s performance?',
    answer: 'Yes. The Team and Enterprise plans include an Admin Dashboard showing team-wide metrics: activity levels, close rates, methodology execution scores, and client engagement. Managers get visibility into who\'s executing your framework and who\'s cutting corners - before revenue drops.'
  },
  {
    question: 'What if I want to white-label this for my clients?',
    answer: 'Our Enterprise plan includes white-label branding. Use your logo, colors, and domain. Perfect for consultants and agencies reselling to clients.'
  },
  {
    question: 'Do you offer on-premise deployment?',
    answer: 'Not yet. Currently, SalesAI.Coach is cloud-hosted for security and performance. On-premise deployment is on our roadmap for Q4 2025 for enterprise customers with strict data residency requirements. Contact us if this is a requirement for your organization.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. No contracts. Cancel anytime. Your data remains accessible for 30 days after cancellation, and you can export everything before you go.'
  }
]

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="section-padding bg-gradient-navy">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-teal">Questions</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card cursor-pointer hover:border-teal/30"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg font-bold text-light">{faq.question}</h3>
                <HiChevronDown
                  className={`text-teal text-2xl flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </div>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-light-muted mt-4 leading-relaxed">{faq.answer}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
