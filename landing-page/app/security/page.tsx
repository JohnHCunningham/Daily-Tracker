import type { Metadata } from 'next'
import Link from 'next/link'
import { HiShieldCheck, HiLockClosed, HiCloud, HiDocumentText, HiKey, HiUserGroup } from 'react-icons/hi'

export const metadata: Metadata = {
  title: 'Security & Data Privacy | SalesAI.Coach',
  description: 'Learn how SalesAI.Coach protects your data with enterprise-grade security, encryption, and compliance standards.',
  keywords: ['security', 'data privacy', 'encryption', 'SOC 2', 'compliance', 'GDPR', 'data ownership'],
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-navy pt-24 pb-16">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="text-teal hover:text-aqua transition-colors mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-light mb-6">
            Security & <span className="text-teal">Data Privacy</span>
          </h1>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Your data security is our top priority. Here's how we protect your conversations, insights, and sales data.
          </p>
        </div>

        {/* Key Principles */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card text-center border-teal/30">
            <HiShieldCheck className="text-5xl text-teal mx-auto mb-4" />
            <h3 className="text-xl font-bold text-light mb-2">Enterprise-Grade Security</h3>
            <p className="text-light-muted">Bank-level encryption and SOC 2 compliance</p>
          </div>
          <div className="card text-center border-teal/30">
            <HiKey className="text-5xl text-teal mx-auto mb-4" />
            <h3 className="text-xl font-bold text-light mb-2">You Own Your Data</h3>
            <p className="text-light-muted">100% data ownership, export anytime</p>
          </div>
          <div className="card text-center border-teal/30">
            <HiUserGroup className="text-5xl text-teal mx-auto mb-4" />
            <h3 className="text-xl font-bold text-light mb-2">Privacy by Design</h3>
            <p className="text-light-muted">GDPR and CCPA compliant</p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          {/* Data Encryption */}
          <section className="card">
            <div className="flex items-start gap-4 mb-6">
              <HiLockClosed className="text-4xl text-teal flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold text-light mb-4">Data Encryption</h2>
                <div className="space-y-4 text-light-muted">
                  <p>
                    All data is encrypted using <strong className="text-light">AES-256 encryption</strong>, the same standard used by banks and government agencies.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-light">At Rest:</strong> All stored data (call transcripts, coaching notes, performance metrics) is encrypted in our database</li>
                    <li><strong className="text-light">In Transit:</strong> All data transmission uses TLS 1.3 encryption</li>
                    <li><strong className="text-light">API Communication:</strong> All API calls are encrypted and authenticated</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Ownership */}
          <section className="card">
            <div className="flex items-start gap-4 mb-6">
              <HiKey className="text-4xl text-teal flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold text-light mb-4">Data Ownership & Control</h2>
                <div className="space-y-4 text-light-muted">
                  <p className="text-lg font-semibold text-teal">
                    You own 100% of your data. Period.
                  </p>
                  <p>
                    We're the infrastructure - you own the insights. Your call transcripts, coaching notes, performance data, and analytics belong to you, not us.
                  </p>
                  <div className="bg-navy-light border border-teal/20 rounded-lg p-6 mt-4">
                    <h3 className="text-xl font-bold text-light mb-4">What This Means:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-teal">✓</span>
                        <span><strong className="text-light">Export Anytime:</strong> Download all your data as CSV or JSON via API</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-teal">✓</span>
                        <span><strong className="text-light">Delete Anytime:</strong> Request full data deletion with one click</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-teal">✓</span>
                        <span><strong className="text-light">No Lock-In:</strong> Cancel anytime, keep your data for 30 days</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-teal">✓</span>
                        <span><strong className="text-light">No Training on Your Data:</strong> We never use your conversations to train AI models</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure & Hosting */}
          <section className="card">
            <div className="flex items-start gap-4 mb-6">
              <HiCloud className="text-4xl text-teal flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold text-light mb-4">Infrastructure & Hosting</h2>
                <div className="space-y-4 text-light-muted">
                  <p>
                    SalesAI.Coach is built on enterprise-grade infrastructure with 99.9% uptime SLA.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-light">Database:</strong> Supabase (PostgreSQL) with Row Level Security (RLS)</li>
                    <li><strong className="text-light">Hosting:</strong> Vercel with global CDN and automatic scaling</li>
                    <li><strong className="text-light">AI Processing:</strong> OpenAI API (HIPAA-compliant, SOC 2 Type II)</li>
                    <li><strong className="text-light">Backups:</strong> Automated daily backups with 30-day retention</li>
                    <li><strong className="text-light">Disaster Recovery:</strong> Multi-region redundancy and point-in-time recovery</li>
                  </ul>
                  <div className="mt-6 p-4 bg-teal/10 border border-teal/30 rounded-lg">
                    <p className="text-sm">
                      <strong className="text-teal">Enterprise Customers:</strong> Dedicated instances, custom data residency (US, Canada, EU), and on-premise deployment available (2025 roadmap).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance */}
          <section className="card">
            <div className="flex items-start gap-4 mb-6">
              <HiDocumentText className="text-4xl text-teal flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold text-light mb-4">Compliance & Certifications</h2>
                <div className="space-y-4 text-light-muted">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-light mb-2">✓ SOC 2 Type II Compliant</h3>
                      <p className="text-sm">Annual third-party audits of our security controls</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-light mb-2">✓ GDPR Compliant</h3>
                      <p className="text-sm">EU data protection and privacy regulations</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-light mb-2">✓ CCPA Compliant</h3>
                      <p className="text-sm">California Consumer Privacy Act compliance</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-light mb-2">✓ PIPEDA Compliant</h3>
                      <p className="text-sm">Canadian privacy law compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Access Control */}
          <section className="card">
            <div className="flex items-start gap-4 mb-6">
              <HiUserGroup className="text-4xl text-teal flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold text-light mb-4">Access Control & Privacy</h2>
                <div className="space-y-4 text-light-muted">
                  <p>
                    We implement strict access controls to ensure only authorized users can view your data.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-light">Row Level Security (RLS):</strong> Database enforces user permissions - no one sees data they shouldn't</li>
                    <li><strong className="text-light">Role-Based Access:</strong> Admin, Manager, and Rep roles with granular permissions</li>
                    <li><strong className="text-light">SSO Integration:</strong> Single Sign-On with Google, Microsoft (Enterprise only)</li>
                    <li><strong className="text-light">2FA Available:</strong> Two-factor authentication for all accounts</li>
                    <li><strong className="text-light">Audit Logs:</strong> Track who accessed what data and when (Enterprise only)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Sharing */}
          <section className="card bg-pink/5 border-pink/20">
            <h2 className="text-3xl font-bold text-light mb-4">What We DON'T Do</h2>
            <div className="space-y-3 text-light-muted">
              <p className="flex items-start gap-3">
                <span className="text-pink text-xl">✗</span>
                <span><strong className="text-light">No data selling:</strong> We never sell your data to third parties</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-pink text-xl">✗</span>
                <span><strong className="text-light">No AI training:</strong> Your conversations are never used to train our models</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-pink text-xl">✗</span>
                <span><strong className="text-light">No cross-customer access:</strong> Your data is isolated from other customers</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-pink text-xl">✗</span>
                <span><strong className="text-light">No marketing emails:</strong> from your call data (only product updates you opt into)</span>
              </p>
            </div>
          </section>

          {/* Questions */}
          <section className="text-center card bg-gradient-to-r from-teal/10 to-aqua/10 border-teal/20">
            <h2 className="text-3xl font-bold text-light mb-4">Have Security Questions?</h2>
            <p className="text-xl text-light-muted mb-6">
              We're happy to answer any security or compliance questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:john@aiadvantagesolutions.ca?subject=Security%20Questions"
                className="btn-secondary"
              >
                Email Our Security Team
              </a>
              <Link href="/privacy" className="btn-primary">
                Read Privacy Policy
              </Link>
            </div>
            <p className="text-sm text-light-muted mt-6">
              Enterprise customers: Request our full security documentation and DPA (Data Processing Agreement).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
