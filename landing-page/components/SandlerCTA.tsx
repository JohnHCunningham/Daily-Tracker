'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { HiShieldCheck, HiBolt, HiWrench } from 'react-icons/hi2'

const ctaSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(2, 'Company name is required'),
  teamSize: z.string().min(1, 'Please select a team size'),
})

type CTAFormData = z.infer<typeof ctaSchema>

const SandlerCTA = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CTAFormData>({
    resolver: zodResolver(ctaSchema),
  })

  const onSubmit = async (data: CTAFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(
        'https://aiadvantagesolutions.app.n8n.cloud/webhook/e58280f2-f704-4517-bcf2-1395ef44edad',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            source: 'sandler-landing',
            message: `Sandler landing page inquiry. Team size: ${data.teamSize}`,
          }),
        }
      )
      if (!response.ok) throw new Error('Failed to send')
      toast.success('Received. We\'ll be in touch within 24 hours.')
      reset()
    } catch {
      toast.error('Something went wrong. Please try again or book directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="section-padding bg-navy-dark">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See Your Team&apos;s Sandler Scores{' '}
              <span className="text-teal">in 48 Hours</span>
            </h2>
            <p className="text-xl text-light-muted max-w-2xl mx-auto mb-8">
              Send us a few calls. We&apos;ll score them against all 8 Sandler components and show you exactly where coaching will move the needle.
            </p>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="btn-primary inline-block text-lg px-10 py-4"
            >
              Book a Demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="bg-navy-light/50 border border-teal/10 rounded-2xl p-8 md:p-10"
          >
            <p className="text-center text-light-muted mb-8 text-sm">
              Or leave your details and we&apos;ll reach out.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted/50 focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-pink">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Work email"
                    className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted/50 focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-pink">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <input
                    {...register('company')}
                    type="text"
                    placeholder="Company"
                    className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted/50 focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-pink">{errors.company.message}</p>
                  )}
                </div>
                <div>
                  <select
                    {...register('teamSize')}
                    className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Team size
                    </option>
                    <option value="1-5">1 - 5 reps</option>
                    <option value="6-15">6 - 15 reps</option>
                    <option value="16-50">16 - 50 reps</option>
                    <option value="50+">50+ reps</option>
                  </select>
                  {errors.teamSize && (
                    <p className="mt-1 text-sm text-pink">{errors.teamSize.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-teal to-aqua text-navy font-bold py-4 px-6 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Get My Team\'s Sandler Scores'}
              </button>
            </form>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8 mt-10 text-sm text-light-muted"
          >
            <div className="flex items-center gap-2">
              <HiShieldCheck className="text-teal" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <HiBolt className="text-teal" />
              <span>Results in 48 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <HiWrench className="text-teal" />
              <span>Built for Sandler</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default SandlerCTA
