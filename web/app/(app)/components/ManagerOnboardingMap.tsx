'use client'

import Link from 'next/link'
import { HiArrowRight, HiCheckCircle, HiClock } from 'react-icons/hi'

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
  const nextStep = steps.find((step) => !step.complete) || null

  return (
    <div className="mb-8 rounded-2xl border border-terracotta/20 bg-gradient-to-r from-white to-terracotta/5 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">Manager launch map</p>
          <h2 className="text-xl font-bold text-espresso mt-1">
            {completedCount === totalCount
              ? 'Your account is ready'
              : `You are ${completedCount} of ${totalCount} steps in`}
          </h2>
          <p className="text-sm text-stone-light mt-1">
            {completedCount === totalCount
              ? 'The team is onboarded, context is set, and the product has the inputs it needs.'
              : `Finish the next step: ${nextStep?.title || 'continue setup'}.`}
          </p>

          <div className="mt-4 h-2 rounded-full bg-bone-dark/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terracotta to-terracotta-bright transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-light">{progressPercent}% complete</p>
        </div>

        {nextStep ? (
          <div className="rounded-xl border border-bone-dark bg-white px-4 py-3 min-w-[240px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-light">Next up</p>
            <p className="mt-1 font-semibold text-espresso">{nextStep.title}</p>
            <p className="text-sm text-stone-light mt-1">{nextStep.description}</p>
            <Link
              href={nextStep.href}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-terracotta hover:text-terracotta-bright"
            >
              {nextStep.cta}
              <HiArrowRight />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-teal/20 bg-white px-4 py-3 min-w-[240px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">Complete</p>
            <p className="mt-1 font-semibold text-espresso">Launch checklist finished</p>
            <p className="text-sm text-stone-light mt-1">
              Reps, billing, customer context, and integrations are all in place.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`rounded-xl border p-4 ${
              step.complete
                ? 'border-teal/20 bg-white'
                : index === completedCount
                  ? 'border-terracotta/30 bg-white'
                  : 'border-bone-dark bg-white/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                  step.complete ? 'bg-teal/10 text-teal' : 'bg-terracotta/10 text-terracotta'
                }`}>
                  {step.complete ? <HiCheckCircle className="text-lg" /> : <HiClock className="text-lg" />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-light">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 font-semibold text-espresso">{step.title}</h3>
                  <p className="text-sm text-stone-light mt-1">{step.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold ${step.complete ? 'text-teal' : 'text-terracotta'}`}>
                {step.complete ? 'Complete' : 'Pending'}
              </span>
              {!step.complete ? (
                <Link
                  href={step.href}
                  className="inline-flex items-center justify-center rounded-lg bg-terracotta px-3 py-1.5 text-xs font-semibold text-white hover:bg-terracotta-bright transition-colors"
                >
                  {step.cta}
                </Link>
              ) : (
                <Link
                  href={step.href}
                  className="inline-flex items-center justify-center rounded-lg border border-bone-dark bg-white px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-bone-light transition-colors"
                >
                  Review
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
