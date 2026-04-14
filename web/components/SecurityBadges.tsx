'use client'

import { motion } from 'framer-motion'
import { HiShieldCheck, HiLockClosed, HiServer, HiEye } from 'react-icons/hi'
import Link from 'next/link'

interface SecurityBadgesProps {
  variant?: 'hero' | 'section' | 'compact'
}

const SecurityBadges = ({ variant = 'hero' }: SecurityBadgesProps) => {
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-light-muted">
        <span className="flex items-center gap-1">
          <HiShieldCheck className="text-teal" /> SOC 2 Compliant
        </span>
        <span>|</span>
        <span className="flex items-center gap-1">
          <HiLockClosed className="text-teal" /> GDPR Ready
        </span>
        <span>|</span>
        <Link href="/security" className="text-teal hover:text-aqua transition-colors">
          Learn about our security →
        </Link>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-6 flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2 bg-navy-light/50 border border-teal/20 rounded-full px-4 py-2">
          <HiShieldCheck className="text-teal text-lg" />
          <span className="text-sm text-light-muted">Enterprise-Grade Security</span>
        </div>
        <div className="flex items-center gap-2 bg-navy-light/50 border border-teal/20 rounded-full px-4 py-2">
          <HiEye className="text-teal text-lg" />
          <span className="text-sm text-light-muted">We never train AI on your data</span>
        </div>
        <Link
          href="/security"
          className="text-sm text-teal hover:text-aqua transition-colors underline underline-offset-2"
        >
          Security details →
        </Link>
      </motion.div>
    )
  }

  // Full section variant
  return (
    <section className="py-8 bg-navy border-y border-teal/10">
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
              <HiShieldCheck className="text-teal text-xl" />
            </div>
            <div>
              <p className="font-semibold text-light text-sm">SOC 2 Compliant</p>
              <p className="text-xs text-light-muted">Type II Certified</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
              <HiLockClosed className="text-teal text-xl" />
            </div>
            <div>
              <p className="font-semibold text-light text-sm">GDPR Ready</p>
              <p className="text-xs text-light-muted">Data Protection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
              <HiServer className="text-teal text-xl" />
            </div>
            <div>
              <p className="font-semibold text-light text-sm">Your Data, Your Control</p>
              <p className="text-xs text-light-muted">Never used for AI training</p>
            </div>
          </div>

          <Link
            href="/security"
            className="text-teal hover:text-aqua transition-colors font-semibold text-sm"
          >
            Learn about our security →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default SecurityBadges
