'use client'

import { motion } from 'framer-motion'

const SandlerHero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-navy section-padding pt-32 pb-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-block mb-6"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 border border-teal/20 px-4 py-2 rounded-full">
                Built exclusively for Sandler-trained teams
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Your Team Learned the Sandler System.{' '}
              <span className="bg-gradient-to-r from-gold to-teal bg-clip-text text-transparent">
                Are They Using It on Every Call?
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-light-muted mb-8 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              84% of training is forgotten in 90 days. One Click Coaching scores every call against 8 Sandler components — and delivers coaching before the next one.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <a
                href="https://tidycal.com/aiautomations/sales-coach"
                className="btn-primary text-center text-lg px-10 py-4"
              >
                Book a Demo
              </a>
              <a
                href="#scoring"
                className="btn-secondary text-center text-lg px-10 py-4"
              >
                See How Scoring Works
              </a>
            </motion.div>
          </motion.div>

          {/* Scorecard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-teal/30 bg-gradient-to-br from-navy-light to-navy p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal rounded-full animate-ping" />
                  <span className="text-light font-bold">Live Sandler Scorecard</span>
                </div>
                <div className="px-4 py-1 bg-teal/20 border border-teal/30 rounded-full">
                  <span className="text-teal text-xs font-bold uppercase">
                    Upfront Contract: Verified
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-navy/50 p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-light-muted mb-1 uppercase font-bold tracking-tighter">
                    Pain Funnel Depth
                  </div>
                  <div className="w-full bg-navy h-2 rounded-full mt-2">
                    <div
                      className="bg-gradient-to-r from-teal to-aqua h-full rounded-full"
                      style={{ width: '85%' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-navy/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-light-muted uppercase font-bold tracking-tighter">
                      Talk/Listen Ratio
                    </div>
                    <div className="text-xl font-bold text-light">32 / 68</div>
                  </div>
                  <div className="bg-navy/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-light-muted uppercase font-bold tracking-tighter">
                      Budget Step
                    </div>
                    <div className="text-xl font-bold text-teal">Completed</div>
                  </div>
                </div>

                <div className="bg-navy/80 p-4 rounded-xl border border-gold/20 italic text-sm text-light-muted">
                  &ldquo;You mentioned $50k in lost productivity — is that why we&apos;re
                  talking today, or is there more?&rdquo;
                  <div className="text-[10px] text-gold mt-2 font-bold not-italic">
                    REVERSE SELLING DETECTED
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default SandlerHero
