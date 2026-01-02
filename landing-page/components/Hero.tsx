'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { HiPlay, HiXMark } from 'react-icons/hi2'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailForm = z.infer<typeof emailSchema>

const Hero = () => {
  const [showVideo, setShowVideo] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async (data: EmailForm) => {
    try {
      // Track signup attempt
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'generate_lead', {
          event_category: 'engagement',
          event_label: 'hero_signup',
        })
      }

      toast.success('🎉 Redirecting to book your demo...')

      // Redirect to TidyCal
      setTimeout(() => {
        window.location.href = 'https://tidycal.com/aiautomations/sales-coach'
      }, 800)
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-navy section-padding pt-32 pb-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-gold to-teal bg-clip-text text-transparent">
                The Revenue Factory:
              </span>{' '}
              Complete AI Sales System
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-light-muted mb-4 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Attract leads with AI. Execute with methodology coaching. Complete deals faster. Your end-to-end revenue engine.
            </motion.p>

            <motion.div
              className="mb-8 text-lg text-light-muted"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="mb-2 font-semibold text-teal">3-Stage System:</p>
              <p className="text-light">Attraction → Execution (Available Now) → Completion</p>
              <p className="text-sm text-light-muted mt-2">Supports: Sandler • Challenger • SPIN • GAP • MEDDICC • Custom</p>
            </motion.div>

            <motion.p
              className="text-lg text-light-muted mb-8 italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              See how your team is <span className="text-teal font-semibold">actually selling</span> — not how they say they are.
            </motion.p>

            {/* Email Signup Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your work email"
                    className="w-full px-6 py-4 rounded-lg bg-navy-light border border-teal/20 text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                  />
                  {errors.email && (
                    <p className="text-pink text-sm mt-2">{errors.email.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Starting...' : 'Start Free Trial'}
                </button>
              </form>

              <p className="text-sm text-light-muted flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  💳 No credit card required
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  ✅ 30-day money-back guarantee
                </span>
              </p>
            </motion.div>

            <motion.button
              onClick={() => setShowVideo(true)}
              className="mt-8 flex items-center gap-3 text-teal hover:text-aqua transition-colors group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center group-hover:bg-teal/30 transition-colors">
                <HiPlay className="text-teal text-2xl" />
              </div>
              <span className="font-semibold">Watch 2-min demo</span>
            </motion.button>
          </motion.div>

          {/* Right Column - Visual/Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative p-8 md:p-10"
          >
            {/* Dashboard mockup with actual content */}
            <div className="relative rounded-2xl shadow-2xl shadow-teal/20 border border-teal/30 bg-gradient-to-br from-navy-light to-navy">
              <div className="p-6">
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                    <span className="text-light font-semibold text-sm">Live Analysis</span>
                  </div>
                  <div className="px-3 py-1 bg-gold/20 border border-gold/30 rounded-full">
                    <span className="text-gold text-xs font-bold">94% Score</span>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-navy-light/50 backdrop-blur border border-teal/20 rounded-lg p-3">
                    <div className="text-light-muted text-xs mb-1">Close Rate</div>
                    <div className="text-teal text-xl font-bold">+28%</div>
                  </div>
                  <div className="bg-navy-light/50 backdrop-blur border border-aqua/20 rounded-lg p-3">
                    <div className="text-light-muted text-xs mb-1">Methodology</div>
                    <div className="text-aqua text-xl font-bold">MEDDIC</div>
                  </div>
                  <div className="bg-navy-light/50 backdrop-blur border border-gold/20 rounded-lg p-3">
                    <div className="text-light-muted text-xs mb-1">Calls Today</div>
                    <div className="text-gold text-xl font-bold">24</div>
                  </div>
                </div>

                {/* Conversation snippet */}
                <div className="bg-navy-light/30 backdrop-blur border border-teal/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-teal to-aqua rounded-full flex items-center justify-center text-xs">✓</div>
                    <span className="text-light font-semibold text-sm">Pain Points Identified</span>
                  </div>
                  <div className="space-y-2 text-xs text-light-muted">
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-teal rounded-full mt-1.5 flex-shrink-0" />
                      <span>"Current process takes 3x longer"</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-teal rounded-full mt-1.5 flex-shrink-0" />
                      <span>"Team struggling with adoption"</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-teal rounded-full mt-1.5 flex-shrink-0" />
                      <span>"Budget approved for Q1"</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-5 -right-5 bg-gold text-navy px-4 py-2 rounded-full font-bold shadow-lg shadow-gold/30"
              >
                ✨ AI-Powered
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
                className="absolute -bottom-5 -left-5 bg-teal text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-teal/30"
              >
                🎯 Instant Coaching
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video bg-navy rounded-xl overflow-hidden">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-teal bg-navy/50 rounded-full p-2"
            >
              <HiXMark size={24} />
            </button>
            {/* Replace with actual video */}
            <div className="w-full h-full flex items-center justify-center text-light">
              <p>Demo video would go here</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Hero
