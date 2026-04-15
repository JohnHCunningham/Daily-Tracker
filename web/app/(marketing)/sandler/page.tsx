'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  HiEye,
  HiClock,
  HiExclamationTriangle,
  HiMicrophone,
  HiCpuChip,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiBuildingStorefront,
  HiCurrencyDollar,
  HiArrowTrendingUp,
} from 'react-icons/hi2'
import Navbar from '@/components/Navbar'
import SandlerHero from '@/components/SandlerHero'
import SandlerComponentsGrid from '@/components/SandlerComponentsGrid'
import SandlerPricing from '@/components/SandlerPricing'
import SandlerRadialScores from '@/components/SandlerRadialScores'
import SandlerCTA from '@/components/SandlerCTA'
import Footer from '@/components/Footer'

/* ─── S2: The Problem ─────────────────────────────────── */

const problemCards = [
  {
    icon: HiEye,
    title: 'Managers Can\'t Listen to Every Call',
    body: 'You have 10 reps making 40 calls a week. You review 3. The other 397 run on autopilot — and that\'s where the Pain Funnel gets abandoned.',
  },
  {
    icon: HiClock,
    title: 'Coaching Is Delayed, Generic, Inconsistent',
    body: 'By the time Thursday\'s 1:1 happens, the rep has reinforced the wrong behavior on 15 more calls. Delayed feedback coaches a ghost, not a habit.',
  },
  {
    icon: HiExclamationTriangle,
    title: 'The Submarine Gets Abandoned Mid-Call',
    body: 'Under pressure, reps skip steps. The Upfront Contract disappears. Budget never comes up. They pitch before qualifying — and the deal stalls.',
  },
]

function ProblemSection() {
  return (
    <section className="section-padding bg-navy border-t border-teal/10">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The Training Was Excellent.{' '}
            <span className="text-pink">The Execution Isn&apos;t.</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Your team knows Sandler. They can recite the submarine. But knowledge doesn&apos;t survive pressure — habits do.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-pink/10">
            <Image
              src="/images/sandler-sales-leader.png"
              alt="Sales leader reviewing team coaching scores on a performance dashboard"
              width={1280}
              height={720}
              className="w-full h-auto"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-sm text-light-muted italic">
                Managers need visibility into every call — not just the 3 they have time to review.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problemCards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card border-pink/10 hover:border-pink/30"
              >
                <div className="w-10 h-10 rounded-lg bg-pink/10 flex items-center justify-center mb-4 border border-pink/20">
                  <Icon className="text-pink text-xl" />
                </div>
                <h3 className="text-lg font-bold text-light mb-3">{card.title}</h3>
                <p className="text-sm text-light-muted leading-relaxed">{card.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── S3: How OCC Works ───────────────────────────────── */

const steps = [
  {
    icon: HiMicrophone,
    step: '01',
    title: 'Call Happens',
    body: 'Your rep finishes a discovery call, demo, or follow-up. Recording flows in automatically via HubSpot, Fathom, or Aircall.',
  },
  {
    icon: HiCpuChip,
    step: '02',
    title: 'AI Scores 8 Components',
    body: 'Every call is measured against the Sandler system — Upfront Contract, Pain Funnel depth, Budget, Decision Process, and more.',
  },
  {
    icon: HiChatBubbleLeftRight,
    step: '03',
    title: 'Coaching Generated',
    body: 'The rep receives specific, script-level coaching tied to the exact moments where execution broke down. Not generic tips.',
  },
  {
    icon: HiCheckCircle,
    step: '04',
    title: 'Manager Approves, Rep Receives',
    body: 'The manager reviews the coaching card, adds context if needed, and sends it. The rep adjusts before the next call — not the next quarter.',
  },
]

function HowItWorksSection() {
  return (
    <section className="section-padding bg-navy-dark">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            From Call to Coaching{' '}
            <span className="text-teal">in 24 Hours</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            No manual uploads. No waiting for the weekly 1:1. Coaching happens while the conversation is still fresh.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="card h-full">
                  <div className="text-5xl font-black text-teal/10 mb-4">{s.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center mb-4 border border-teal/20">
                    <Icon className="text-teal text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-light mb-2">{s.title}</h3>
                  <p className="text-sm text-light-muted leading-relaxed">{s.body}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-teal/30 text-2xl">
                    &rarr;
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Coaching flow infographic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <div className="rounded-2xl overflow-hidden border border-teal/20">
            <Image
              src="/images/sandler-system-infographic.png"
              alt="One Click Coaching system: Call Recorded, AI Scores the Call against 7 Sandler stages, Coaching Generated with personalized action plan, Manager Reviews and Rep Improves"
              width={1280}
              height={1280}
              className="w-full h-auto"
            />
          </div>
        </motion.div>

        {/* Sales rep image + differentiator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-5xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-teal/10">
              <Image
                src="/images/sandler-sales-rep.png"
                alt="Sales rep on a coaching call, actively engaged in conversation"
                width={1280}
                height={720}
                className="w-full h-auto"
              />
            </div>
            <div>
              <div className="bg-teal/5 border border-teal/15 rounded-xl px-8 py-6">
                <p className="text-teal font-bold text-lg mb-3">
                  AI trained on Sandler methodology. Not generic sales tips.
                </p>
                <p className="text-light-muted text-sm leading-relaxed">
                  Every coaching card references the specific Sandler component the rep missed — with a script they can use on the next call. Not &ldquo;ask better questions.&rdquo; But &ldquo;when she said X, try asking Y.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── S5: Franchise Owners ────────────────────────────── */

const franchiseProps = [
  {
    icon: HiBuildingStorefront,
    title: 'White-Label Branding',
    body: 'Your franchise name, your colors, your coaching platform. Clients see your brand — backed by AI they can\'t build themselves.',
  },
  {
    icon: HiCurrencyDollar,
    title: 'Revenue Model',
    body: '$150/user wholesale. Price it to your clients however you choose. AI coaching becomes a recurring revenue stream attached to every engagement.',
  },
  {
    icon: HiArrowTrendingUp,
    title: 'Solve Training Drift',
    body: 'Your trainers can\'t follow every client back to their office. AI coaching continues the reinforcement — making your training stick long after the workshop ends.',
  },
]

function FranchiseSection() {
  return (
    <section className="section-padding bg-navy border-t border-teal/10">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Offer AI Coaching Intelligence to{' '}
            <span className="text-gold">Every Team You&apos;ve Trained</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            For Sandler franchise owners who want to extend the value of every training engagement — without hiring more coaches.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {franchiseProps.map((prop, i) => {
            const Icon = prop.icon
            return (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card border-gold/10 hover:border-gold/30"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 border border-gold/20">
                  <Icon className="text-gold text-xl" />
                </div>
                <h3 className="text-lg font-bold text-light mb-3">{prop.title}</h3>
                <p className="text-sm text-light-muted leading-relaxed">{prop.body}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="https://tidycal.com/aiautomations/sales-coach"
            className="btn-primary inline-block text-lg px-10 py-4"
          >
            Schedule a Franchise Partnership Call
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── S6: Social Proof / Thought Leadership ───────────── */

const stats = [
  {
    value: '$210K - $370K',
    label: 'Estimated annual coaching value per 10-rep team',
    detail: 'Based on methodology-driven close rate improvements and shortened sales cycles.',
  },
  {
    value: '84%',
    label: 'Training forgotten within 90 days',
    detail: 'Without reinforcement. With same-day coaching, retention jumps to 73%.',
  },
  {
    value: '73%',
    label: 'Same-day behavior change rate',
    detail: 'Compared to 23% for weekly coaching and 9% for feedback delivered after a week.',
  },
]

const relevantPosts = [
  {
    slug: 'why-200k-sales-training-disappears-day-60',
    title: 'Why Your $200K Sales Training Program Disappears by Day 60',
  },
  {
    slug: 'sales-methodology-under-pressure-30-percent-increase',
    title: 'Why Following Your Sales Methodology Under Pressure Can Increase Close Rates by 30%',
  },
  {
    slug: 'sandler-methodology-execution-gap',
    title: 'The Sandler Execution Gap: Why Training Alone Isn\'t Enough',
  },
  {
    slug: '87-percent-problem-sales-training-forgotten',
    title: 'The 87% Problem: Why Sales Training Disappears in 30 Days',
  },
  {
    slug: 'same-day-coaching-vs-weekly-1on1s',
    title: 'Same-Day Coaching vs. Weekly 1:1s: What the Data Shows',
  },
  {
    slug: 'real-cost-of-winging-it-sales-process',
    title: 'The Real Cost of "Winging It": When Reps Abandon Process',
  },
]

function SocialProofSection() {
  return (
    <section className="section-padding bg-navy-dark">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The Numbers Behind{' '}
            <span className="text-teal">Sandler Reinforcement</span>
          </h2>
        </motion.div>

        {/* Stat cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-teal mb-3">
                {stat.value}
              </div>
              <p className="text-light font-semibold mb-2">{stat.label}</p>
              <p className="text-sm text-light-muted">{stat.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonial placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <blockquote className="border-l-4 border-gold bg-navy-light/40 rounded-r-2xl p-8">
            <p className="text-lg text-light italic leading-relaxed mb-4">
              &ldquo;We used to spend half our 1:1s reviewing basic execution. Now reps already know where they dropped the ball. We talk strategy instead.&rdquo;
            </p>
            <footer className="text-sm text-light-muted">
              — VP of Sales, Sandler-trained organization
            </footer>
          </blockquote>
        </motion.div>

        {/* Blog links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            Go Deeper: Sandler Execution Research
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {relevantPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-navy-light/50 border border-teal/10 rounded-lg p-4 hover:border-teal/30 transition-colors group"
              >
                <p className="text-sm text-light group-hover:text-teal transition-colors font-medium leading-snug">
                  {post.title}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Page Assembly ───────────────────────────────────── */

export default function SandlerLandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <SandlerHero />
      <ProblemSection />
      <HowItWorksSection />
      <SandlerComponentsGrid />
      <SandlerRadialScores />
      <FranchiseSection />
      <SocialProofSection />
      <SandlerPricing />
      <SandlerCTA />
      <Footer />
    </div>
  )
}
