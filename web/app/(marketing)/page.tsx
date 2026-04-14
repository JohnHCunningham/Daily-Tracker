'use client'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import SocialProof from '@/components/SocialProof'
import Problem from '@/components/Problem'
import Solution from '@/components/Solution'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import FrictionlessCoaching from '@/components/FrictionlessCoaching'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <SocialProof />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <FrictionlessCoaching />
      <Pricing />
      <FAQ />
      <Contact />
      <FinalCTA />
      <Footer />
    </div>
  )
}
