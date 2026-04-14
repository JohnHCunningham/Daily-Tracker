'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { HiPlay, HiXMark } from 'react-icons/hi2'
import SecurityBadges from './SecurityBadges'
import Image from 'next/image'

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
                Finally Get ROI
              </span>{' '}
              From Your Sales Training
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-light-muted mb-4 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              AI coaching that reinforces what your trainers taught. Same-day feedback, every call, every rep.
            </motion.p>

            <motion.div
              className="mb-8 text-lg text-light-muted"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="mb-2 font-semibold text-teal">One-Click Coaching:</p>
              <p className="text-light">Paste a transcript → Get instant methodology-specific feedback with proven scripts</p>
              <p className="text-sm text-light-muted mt-2">Supports: Sandler • Challenger • SPIN • GAP • MEDDICC • Custom</p>
            </motion.div>

            <motion.p
              className="text-lg text-light-muted mb-8 italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Scale coaching without scaling headcount. See how your team is <span className="text-teal font-semibold">actually executing</span> — not how they say they are.
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

              {/* Security Badges */}
              <SecurityBadges variant="hero" />
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

          {/* Right Column - Transformation Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            {/* Main transformation image with glow effect */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(20, 184, 166, 0.3)',
                  '0 0 40px rgba(20, 184, 166, 0.5)',
                  '0 0 20px rgba(20, 184, 166, 0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-2xl overflow-hidden border border-teal/30"
            >
              <Image
                src="/images/transformation-hero.jpg"
                alt="AI Sales Coaching Transformation: Before with delayed feedback and stressed manager vs After with instant AI-powered coaching insights and real-time methodology reinforcement"
                width={600}
                height={600}
                className="w-full h-auto"
                priority
              />
            </motion.div>

            {/* Animated floating badges */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [-2, 2, -2]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-gradient-to-r from-gold to-amber-400 text-navy px-5 py-2.5 rounded-full font-bold shadow-lg shadow-gold/40 text-sm"
            >
              ⚡ Instant Feedback
            </motion.div>

            <motion.div
              animate={{
                y: [0, 12, 0],
                rotate: [2, -2, 2]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 bg-gradient-to-r from-teal to-aqua text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-teal/40 text-sm"
            >
              🎯 60-Second Coaching
            </motion.div>

            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gold/90 text-navy px-4 py-3 rounded-xl font-bold shadow-2xl shadow-gold/50"
            >
              <span className="text-2xl">⚡</span>
            </motion.div>
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
