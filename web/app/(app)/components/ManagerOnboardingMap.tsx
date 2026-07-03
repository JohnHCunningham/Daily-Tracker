'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HiArrowRight, HiArrowLeft, HiCheckCircle, HiClock } from 'react-icons/hi'

export interface OnboardingStep {
  key: string
  title: string
  description: string
  href: string
  cta: string
  complete: boolean
}

interface ManagerOnboardingMapProps {
  steps: OnboardingStep[]
}

export default function ManagerOnboardingMap({ steps }: ManagerOnboardingMapProps) {
  const completedCount = steps.filter((step) => step.complete).length
  const totalCount = steps.length
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const [activeIndex, setActiveIndex] = useState(0)

  const step = steps[activeIndex]
  if (!step) return null

  const isLast = activeIndex === totalCount - 1
  const isFirst = activeIndex === 0

  return (
    <div className="mb-8 rounded-2xl border border-terracotta/20 bg-gradient-to-r from-white to-terracotta/5 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">Manager launch map</p>
        <h2 className="text-xl font-bold text-espresso mt-1">
          {completedCount === totalCount
            ? 'Your account is ready'
            : `${completedCount} of ${totalCount} complete`}
        </h2>
        <p className="text-sm text-stone-light mt-1">
          {completedCount === totalCount
            ? 'The team is onboarded, context is set, and the product has the inputs it needs.'
            : step.description}
        </p>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-bone-dark/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-terracotta to-terracotta-bright transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-light">{progressPercent}% complete</p>
      </div>

      {/* Walkthrough video */}
      {completedCount < totalCount && (
        <div className="mb-4 rounded-xl overflow-hidden border border-bone-dark/50 shadow-sm">
          <video controls playsInline preload="metadata" className="w-full max-w-xl block bg-espresso" aria-label="Admin onboarding walkthrough">
            <source src="/video/occ-admin-onboarding-watermarked.mp4" type="video/mp4" />
          </video>
          <div className="bg-white px-4 py-2 text-xs text-stone-light flex items-center gap-2">
            <span>🎬</span> 60-second walkthrough — or tap any step below to jump to it
          </div>
        </div>
      )}

      {/* Active Step Card */}
      <div
        className={`rounded-xl border p-6 mb-4 transition-all ${
          step.complete
            ? 'border-teal/20 bg-white'
            : 'border-terracotta/30 bg-white shadow-md'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
              step.complete ? 'bg-teal/10 text-teal' : 'bg-terracotta/10 text-terracotta'
            }`}
          >
            {step.complete ? <HiCheckCircle className="text-xl" /> : <HiClock className="text-xl" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-light">
              {step.complete ? 'Complete' : 'Ready to start'}
            </p>
            <h3 className="mt-1 text-lg font-bold text-espresso">{step.title}</h3>
            <p className="text-sm text-stone-light mt-2 leading-relaxed">{step.description}</p>
            <div className="mt-4">
              {step.complete ? (
                <Link
                  href={step.href}
                  className="inline-flex items-center justify-center rounded-lg border border-bone-dark bg-white px-4 py-2 text-sm font-semibold text-espresso hover:bg-bone-light transition-colors"
                >
                  Review
                </Link>
              ) : (
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-bright transition-colors"
                >
                  {step.cta}
                  <HiArrowRight />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
          disabled={isFirst}
          className="inline-flex items-center gap-1 rounded-lg border border-bone-dark bg-white px-3 py-2 text-sm font-medium text-espresso hover:bg-bone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiArrowLeft className="text-sm" />
          Previous
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setActiveIndex(i)}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? 'w-3 h-3 bg-terracotta'
                  : s.complete
                    ? 'w-2 h-2 bg-teal/60'
                    : 'w-2 h-2 bg-bone-dark'
              }`}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveIndex(Math.min(totalCount - 1, activeIndex + 1))}
          disabled={isLast}
          className="inline-flex items-center gap-1 rounded-lg border border-bone-dark bg-white px-3 py-2 text-sm font-medium text-espresso hover:bg-bone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <HiArrowRight className="text-sm" />
        </button>
      </div>
    </div>
  )
}
