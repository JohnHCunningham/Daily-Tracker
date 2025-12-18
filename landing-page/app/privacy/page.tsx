import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Daily Tracker',
  description: 'Privacy Policy for Daily Tracker - AI-powered sales coaching platform',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy pt-24 pb-16">
      <div className="container-custom max-w-4xl">
        <Link href="/" className="text-teal hover:text-aqua transition-colors mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold text-light mb-4">Privacy Policy</h1>
        <p className="text-light-muted mb-8">Last Updated: December 18, 2024</p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">1. Introduction</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              AI Advantage Solutions ("we," "our," or "us") operates Daily Tracker, an AI-powered sales coaching platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information in compliance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and other applicable privacy laws.
            </p>
            <p className="text-light-muted leading-relaxed">
              By using Daily Tracker, you consent to the collection, use, and disclosure of your personal information as described in this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-light mb-3">2.1 Personal Information</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We collect personal information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Company name and job title</li>
              <li>Sales methodology preferences</li>
              <li>Account credentials (encrypted passwords)</li>
              <li>Payment and billing information</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">2.2 Sales Activity Data</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              To provide our AI coaching services, we collect:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Sales call transcripts (when you upload or record them)</li>
              <li>Daily activity metrics (dials, conversations, meetings)</li>
              <li>Revenue and sales performance data</li>
              <li>Email outreach content and tracking data</li>
              <li>Conversation analysis and coaching feedback</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">2.3 Technical Information</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We automatically collect certain technical information:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>IP address, browser type, and device information</li>
              <li>Usage data and analytics (pages viewed, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">3. How We Use Your Information</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We use your personal information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li><strong>Service Delivery:</strong> To provide AI-powered coaching, conversation analysis, and performance tracking</li>
              <li><strong>Account Management:</strong> To create and maintain your account, process payments, and provide customer support</li>
              <li><strong>Product Improvement:</strong> To analyze usage patterns and improve our AI models and features</li>
              <li><strong>Communication:</strong> To send service updates, coaching insights, and marketing communications (with your consent)</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and respond to legal requests</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">4. Information Sharing and Disclosure</h2>

            <h3 className="text-xl font-semibold text-light mb-3">4.1 Service Providers</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We share your information with trusted third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li><strong>Supabase:</strong> Database hosting and authentication (USA - subject to adequacy decision or appropriate safeguards)</li>
              <li><strong>Anthropic (Claude AI):</strong> AI conversation analysis (USA - subject to appropriate safeguards)</li>
              <li><strong>Vercel:</strong> Website hosting and deployment (USA - subject to appropriate safeguards)</li>
              <li><strong>n8n:</strong> Workflow automation and email notifications (EU - adequate protection)</li>
            </ul>

            <h3 className="text-xl font-semibold text-light mb-3">4.2 Business Transfers</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              In the event of a merger, acquisition, or sale of assets, your personal information may be transferred to the acquiring entity. We will notify you of any such change.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">4.3 Legal Requirements</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              We may disclose your information if required by law, court order, or government regulation, or to protect the rights and safety of our users and the public.
            </p>

            <h3 className="text-xl font-semibold text-light mb-3">4.4 Team Access</h3>
            <p className="text-light-muted leading-relaxed mb-4">
              If you are part of a team account, your manager/admin may access your performance data, coaching feedback, and activity metrics as part of the team management features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">5. Data Retention</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li><strong>Active Accounts:</strong> Data is retained while your account is active</li>
              <li><strong>Closed Accounts:</strong> Data is deleted within 90 days of account closure, unless required for legal or accounting purposes</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer to comply with tax, accounting, or legal obligations (typically 7 years)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">6. Your Rights Under PIPEDA</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              Under Canadian privacy law, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information we hold</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw your consent for certain uses of your information</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured format</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Complaint:</strong> File a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              To exercise these rights, contact us at: <a href="mailto:john@aiadvantagesolutions.ca" className="text-teal hover:text-aqua transition-colors">john@aiadvantagesolutions.ca</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">7. Data Security</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and password hashing</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and role-based permissions</li>
              <li>Employee training on data protection and confidentiality</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">8. Cookies and Tracking</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Maintain your session and remember your preferences</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Improve user experience and personalize content</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              You can manage cookie preferences through your browser settings. Disabling cookies may limit some functionality of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">9. International Data Transfers</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              Your personal information may be transferred to and processed in countries outside of Canada, including the United States. These countries may have different data protection laws than Canada.
            </p>
            <p className="text-light-muted leading-relaxed">
              When we transfer your data internationally, we implement appropriate safeguards such as:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Standard contractual clauses approved by privacy regulators</li>
              <li>Data Processing Agreements with third-party service providers</li>
              <li>Encryption and security measures during transit and storage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">10. Children's Privacy</h2>
            <p className="text-light-muted leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside text-light-muted mb-4 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p className="text-light-muted leading-relaxed">
              Your continued use of Daily Tracker after changes take effect constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">12. Contact Us</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
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

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-aqua mb-4">13. Privacy Commissioner Contact</h2>
            <p className="text-light-muted leading-relaxed mb-4">
              If you are not satisfied with our response to a privacy concern, you may file a complaint with:
            </p>
            <div className="bg-navy-light border border-teal/20 rounded-lg p-6">
              <p className="text-light font-semibold mb-2">Office of the Privacy Commissioner of Canada</p>
              <p className="text-light-muted mb-1">30 Victoria Street</p>
              <p className="text-light-muted mb-1">Gatineau, Quebec K1A 1H3</p>
              <p className="text-light-muted mb-1">
                Website: <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="text-teal hover:text-aqua transition-colors">www.priv.gc.ca</a>
              </p>
              <p className="text-light-muted">
                Phone: 1-800-282-1376
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
