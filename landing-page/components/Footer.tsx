'use client'

import Link from 'next/link'
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi'
import { FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-navy-dark border-t border-navy-light">
      <div className="container-custom section-padding">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <Link href="/" className="font-bold text-xl text-light mb-4 block">
              SalesAI<span className="text-teal">.coach</span>
            </Link>
            <p className="text-light-muted mb-4">
              AI-powered sales coaching that helps teams execute their methodology with precision.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-light-muted hover:text-teal transition-colors">
                <FaLinkedin size={24} />
              </a>
              <a href="#" className="text-light-muted hover:text-teal transition-colors">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-light-muted hover:text-teal transition-colors">
                <FaYoutube size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-light mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-light-muted hover:text-teal transition-colors">Features</Link></li>
              <li><Link href="#methodologies" className="text-light-muted hover:text-teal transition-colors">Methodologies</Link></li>
              <li><Link href="#pricing" className="text-light-muted hover:text-teal transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-light-muted hover:text-teal transition-colors">Resources</Link></li>
              <li><Link href="#" className="text-light-muted hover:text-teal transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-light mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-light-muted hover:text-teal transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-light-muted hover:text-teal transition-colors">Sales Scripts Library</Link></li>
              <li><Link href="#" className="text-light-muted hover:text-teal transition-colors">Methodology Guides</Link></li>
              <li><Link href="#" className="text-light-muted hover:text-teal transition-colors">Video Tutorials</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-light mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <HiMail className="text-teal text-xl flex-shrink-0 mt-0.5" />
                <a href="mailto:john@aiadvantagesolutions.ca" className="text-light-muted hover:text-teal transition-colors">
                  john@aiadvantagesolutions.ca
                </a>
              </li>
              <li className="flex items-start gap-2">
                <HiPhone className="text-teal text-xl flex-shrink-0 mt-0.5" />
                <a href="tel:+19055198983" className="text-light-muted hover:text-teal transition-colors">
                  (905) 519-8983
                </a>
              </li>
              <li className="flex items-start gap-2">
                <HiLocationMarker className="text-teal text-xl flex-shrink-0 mt-0.5" />
                <span className="text-light-muted">
                  1880 Main St. West Suite 303<br />
                  Hamilton, ON L8S 4P8
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-navy-light flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-light-muted text-sm">
            © {currentYear} SalesAI.coach. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-light-muted hover:text-teal transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-light-muted hover:text-teal transition-colors">Terms of Service</Link>
            <Link href="#contact" className="text-light-muted hover:text-teal transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
