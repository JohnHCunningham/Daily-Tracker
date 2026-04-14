'use client'

import Navbar from '@/components/Navbar'
import SandlerHero from '@/components/SandlerHero'
import SocialProof from '@/components/SocialProof'
import Problem from '@/components/Problem'
import Solution from '@/components/Solution'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import SandlerFrictionlessCoaching from '@/components/SandlerFrictionlessCoaching'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function SandlerLandingPage() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <SandlerHero />
            <SocialProof />
            <Problem />
            <Solution />
            <Features />
            <HowItWorks />
            <SandlerFrictionlessCoaching />
            <Pricing />
            <FAQ />
            <Contact />
            <FinalCTA />
            <Footer />
        </div>
    )
}
