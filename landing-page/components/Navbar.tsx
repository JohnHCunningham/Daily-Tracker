'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiMenu, HiX } from 'react-icons/hi'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full bg-navy/80 backdrop-blur-md border-b border-navy-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Area */}
          <div className="flex-shrink-0">
            <Link href="/" className="font-bold text-xl text-light">
              SalesAI<span className="text-teal">.coach</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="#features"
                className="text-light-muted hover:text-teal transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Features
              </Link>
              <Link
                href="#methodologies"
                className="text-light-muted hover:text-teal transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Methodologies
              </Link>
              <Link
                href="#pricing"
                className="text-light-muted hover:text-teal transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="text-light-muted hover:text-teal transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Right Side CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://daily-tracker-xi.vercel.app/"
              className="text-light hover:text-teal px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Login
            </a>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-navy font-bold py-2 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-gold/20 hover:-translate-y-0.5"
            >
              Start Free Trial
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-light hover:text-teal p-2"
            >
              {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-navy-light border-t border-navy-light"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="#features"
              className="text-light-muted hover:text-teal block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#methodologies"
              className="text-light-muted hover:text-teal block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Methodologies
            </Link>
            <Link
              href="#pricing"
              className="text-light-muted hover:text-teal block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="text-light-muted hover:text-teal block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <a
              href="https://daily-tracker-xi.vercel.app/"
              className="text-light-muted hover:text-teal block px-3 py-2 rounded-md text-base font-medium"
            >
              Login
            </a>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="bg-gradient-gold text-navy font-bold block px-3 py-2 rounded-md text-base text-center mt-2"
            >
              Start Free Trial
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

export default Navbar
