import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Daily Tracker',
  description: 'Terms of Service for Daily Tracker - AI-powered sales coaching platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy pt-24 pb-16">
      <div className="container-custom max-w-4xl">
        <Link href="/" className="text-teal hover:text-aqua transition-colors mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold text-light mb-4">Terms of Service</h1>
        <p className="text-light-muted mb-8">Last Updated: December 18, 2024</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">1. Agreement to Terms</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and AI Advantage Solutions ("Company," "we," "us," or "our") regarding your use of the Daily Tracker platform (the "Service").
            </p>
            <p className="text-light-muted leading-relaxed">
              By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">2. Description of Service</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              Daily Tracker is an AI-powered sales coaching platform that provides:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Conversation analysis and AI coaching for sales calls</li>
              <li>Activity tracking (dials, conversations, meetings, revenue)</li>
              <li>Email generation and campaign tracking</li>
              <li>Team performance management and analytics</li>
              <li>Multi-methodology support (Sandler, MEDDIC, Challenger, SPIN, Gap Selling)</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              The Service uses artificial intelligence (AI) models, including Anthropic's Claude, to analyze sales conversations and provide coaching feedback.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">3. Account Registration and Security</h2>

            <h3 className="text-xl font-semibold text-light mb-3">3.1 Account Creation</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              To use the Service, you must create an account by providing accurate and complete information. You agree to:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Provide truthful, current, and complete registration information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
              <li>Not create multiple accounts or share your account with others</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">3.2 Account Security</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">4. Subscription and Payment Terms</h2>

            <h3 className="text-xl font-semibold text-light mb-3">4.1 Subscription Plans</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              The Service is offered on a subscription basis with various pricing tiers. Subscription fees are charged in advance on a recurring basis (monthly or annually, as selected).
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">4.2 Payment</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Provide current, complete, and accurate payment information</li>
              <li>Authorize us to charge all subscription fees to your payment method</li>
              <li>Pay all fees in Canadian Dollars (CAD) unless otherwise agreed</li>
              <li>Pay applicable federal and provincial taxes (HST/GST/PST)</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">4.3 Price Changes</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We reserve the right to modify subscription fees with 30 days' notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">4.4 Cancellation and Refunds</h3>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</li>
              <li><strong>No Refunds:</strong> Subscription fees are non-refundable except as required by law or at our sole discretion.</li>
              <li><strong>Free Trial:</strong> If offered, free trials must be canceled before the trial period ends to avoid charges.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">5. Acceptable Use Policy</h2>

            <h3 className="text-xl font-semibold text-light mb-3">5.1 Permitted Use</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You may use the Service only for lawful purposes and in accordance with these Terms. The Service is intended for sales coaching and performance improvement.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">5.2 Prohibited Activities</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Upload content that infringes intellectual property rights</li>
              <li>Upload malicious code, viruses, or harmful software</li>
              <li>Attempt to gain unauthorized access to our systems or data</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Scrape, mine, or harvest data from the Service using automated tools</li>
              <li>Resell, rent, lease, or sublicense the Service without permission</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Record calls without proper consent under Canadian law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">6. Call Recording Consent</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              <strong>Important:</strong> You are responsible for complying with all applicable laws regarding call recording, including:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li><strong>One-Party Consent (Canada):</strong> In most Canadian provinces, you may record conversations you are a party to without informing others. However, it is illegal to record conversations you are not a party to.</li>
              <li><strong>Business Calls:</strong> We recommend informing call participants that calls may be recorded for quality assurance and coaching purposes.</li>
              <li><strong>Two-Party Consent Jurisdictions:</strong> If calling parties in jurisdictions requiring two-party consent (e.g., some U.S. states), you must obtain explicit consent before recording.</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              You agree to indemnify and hold us harmless from any claims arising from your failure to comply with call recording laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">7. Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold text-light mb-3">7.1 Our IP</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              The Service, including all software, designs, text, graphics, logos, and other content (excluding User Content), is owned by or licensed to us and is protected by Canadian and international intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">7.2 Your License to Use</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal business purposes, subject to these Terms.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">7.3 User Content</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You retain ownership of content you upload to the Service (call transcripts, notes, etc.). By uploading content, you grant us a worldwide, royalty-free license to:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Process and analyze your content to provide AI coaching</li>
              <li>Store and transmit your content as necessary to operate the Service</li>
              <li>Use anonymized, aggregated data to improve our AI models</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              We will not share your specific content with third parties except as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">8. AI-Generated Content</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              The Service uses AI to generate coaching feedback, email templates, and sales scripts. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>AI-generated content is provided for guidance and may not be 100% accurate</li>
              <li>You are responsible for reviewing and verifying all AI-generated content before use</li>
              <li>We do not guarantee the quality, accuracy, or effectiveness of AI-generated content</li>
              <li>You should use professional judgment when applying AI coaching recommendations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">9. Data Privacy and Security</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We collect and process your personal information in accordance with our Privacy Policy and Canadian privacy laws (PIPEDA). By using the Service, you consent to our Privacy Policy.
            </p>
            <p className="text-light-muted leading-relaxed">
              We implement reasonable security measures, but cannot guarantee absolute security. You acknowledge and accept the inherent security risks of Internet-based services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">10. Disclaimers and Limitations of Liability</h2>

            <h3 className="text-xl font-semibold text-light mb-3">10.1 Service "As Is"</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Merchantability, fitness for a particular purpose, or non-infringement</li>
              <li>Uninterrupted, error-free, or secure operation</li>
              <li>Accuracy, reliability, or completeness of AI-generated content</li>
              <li>Achievement of specific sales results or performance improvements</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">10.2 Limitation of Liability</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages exceeding the amount you paid us in the 12 months prior to the claim</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you to the extent prohibited by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">11. Indemnification</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless AI Advantage Solutions, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or regulations</li>
              <li>Your violation of third-party rights (e.g., call recording without consent)</li>
              <li>Content you upload to the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">12. Term and Termination</h2>

            <h3 className="text-xl font-semibold text-light mb-3">12.1 Term</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              These Terms remain in effect while you use the Service or maintain an account.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">12.2 Termination by You</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You may terminate your account at any time by canceling your subscription through the Service or contacting us.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">12.3 Termination by Us</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We may suspend or terminate your access to the Service immediately, without notice, if:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>You violate these Terms</li>
              <li>You fail to pay subscription fees</li>
              <li>We are required to do so by law</li>
              <li>We decide to discontinue the Service (with 30 days' notice)</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">12.4 Effect of Termination</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              Upon termination:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Your right to use the Service ceases immediately</li>
              <li>We may delete your data after 90 days (export your data before termination)</li>
              <li>Provisions that should survive termination (e.g., indemnification, limitation of liability) remain in effect</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">13. Governing Law and Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-light mb-3">13.1 Governing Law</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">13.2 Jurisdiction</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Ontario, Canada, sitting in Hamilton.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">13.3 Informal Resolution</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              Before initiating formal legal proceedings, you agree to attempt to resolve disputes informally by contacting us at <a href="mailto:john@aiadvantagesolutions.ca" className="text-teal hover:text-aqua transition-colors">john@aiadvantagesolutions.ca</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">14. Changes to Terms</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Posting the updated Terms on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification (for significant changes)</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms. If you do not agree to the changes, you must discontinue use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">15. General Provisions</h2>

            <h3 className="text-xl font-semibold text-light mb-3">15.1 Entire Agreement</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">15.2 Severability</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">15.3 No Waiver</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or our right to enforce it later.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">15.4 Assignment</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">15.5 Force Majeure</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We are not liable for delays or failures in performance due to circumstances beyond our reasonable control (e.g., natural disasters, wars, pandemics, government actions).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">16. Contact Information</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-navy-light border border-teal/20 rounded-lg p-6">
              <p className="text-light font-semibold mb-2">AI Advantage Solutions</p>
              <p className="text-light-muted mb-1">1880 Main St. West Suite 303</p>
              <p className="text-light-muted mb-1">Hamilton, ON L8S 4P8</p>
              <p className="text-light-muted mb-1">Canada</p>
              <p className="text-light-muted mb-1">
                Email: <a href="mailto:john@aiadvantagesolutions.ca" className="text-teal hover:text-aqua transition-colors">john@aiadvantagesolutions.ca</a>
              </p>
              <p className="text-light-muted">
                Phone: <a href="tel:+19055198983" className="text-teal hover:text-aqua transition-colors">(905) 519-8983</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
