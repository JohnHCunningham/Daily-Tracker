import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About - 40 Years of Sales Leadership',
  description: 'The story behind One Click Coaching: 40 years of sales experience, from Xerox and Sandler training to building AI-powered coaching that creates permanent behavior change.',
  keywords: ['sales leadership', 'sales training experience', 'Sandler certified', 'Xerox selling systems', 'sales coaching founder'],
  openGraph: {
    title: 'About One Click Coaching - 40 Years of Sales Leadership',
    description: 'The story behind One Click Coaching: why training alone isn\'t enough, and how permanent behavior change actually happens.',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy pt-24 pb-16">
      <div className="container-custom">
        {/* Back Link */}
        <Link href="/" className="text-teal hover:text-aqua transition-colors mb-8 inline-block">
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
            <div className="flex-shrink-0">
              <Image
                src="/images/john-founder.jpg"
                alt="John Cunningham - Founder of One Click Coaching"
                width={200}
                height={200}
                className="rounded-2xl border-2 border-teal/30 shadow-lg shadow-teal/20"
              />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-light mb-4">
                About <span className="text-teal">Me</span>
              </h1>
              <p className="text-light-muted text-lg">
                40+ years of sales leadership, training, and execution.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-light-muted leading-relaxed mb-8">
              I've been in business for over <strong className="text-light">40 years</strong>.
            </p>

            <p className="text-light-muted leading-relaxed mb-6">
              During that time, I've sold professionally, led sales teams, trained salespeople, coached effectiveness, and grown businesses I owned. My sales education came through hands-on experience and formal training with <strong className="text-teal">Xerox Selling Systems</strong>, <strong className="text-teal">Dale Carnegie Training</strong>, <strong className="text-teal">Sandler Selling System</strong>, and <strong className="text-teal">Challenger Sales</strong>.
            </p>

            <p className="text-light leading-relaxed mb-2">I didn't just learn these systems.</p>
            <p className="text-light leading-relaxed mb-2">I sold with them.</p>
            <p className="text-light leading-relaxed mb-2">I trained others to use them.</p>
            <p className="text-light leading-relaxed mb-8">And I was accountable for the results.</p>

            <p className="text-light-muted leading-relaxed mb-8">
              Over time, I noticed a pattern that never went away.
            </p>

            <p className="text-xl text-light leading-relaxed mb-8">
              Sales training worked — <strong className="text-pink">until pressure showed up</strong>.
            </p>

            <p className="text-light-muted leading-relaxed mb-6">
              Reps left training confident and aligned. Early behavior improved. Then quotas tightened, time compressed, and rejection accumulated. Under pressure, people didn't rise to their training — they <strong className="text-light">reverted to their strongest habit</strong>.
            </p>

            <p className="text-light-muted leading-relaxed mb-2">Not because they didn't care.</p>
            <p className="text-light-muted leading-relaxed mb-2">Not because the methodology was wrong.</p>
            <p className="text-light-muted leading-relaxed mb-8">But because training alone doesn't create permanent behavior change.</p>

            <p className="text-light-muted leading-relaxed mb-8">
              As an International Sales Manager, and later as a business owner, I saw how costly this drift was. Coaching arrived too late. Feedback came after the deal. Performance varied when it mattered most.
            </p>

            <p className="text-light-muted leading-relaxed mb-6">
              That's when a paradox became clear to me:
            </p>

            <blockquote className="border-l-4 border-teal pl-6 py-4 my-8 bg-navy-light/30 rounded-r-lg">
              <p className="text-xl text-light italic leading-relaxed">
                The moment salespeople need training the most<br />
                is the moment they can access it the least.
              </p>
            </blockquote>

            <p className="text-light-muted leading-relaxed mb-8">
              So my focus shifted.
            </p>

            <p className="text-light-muted leading-relaxed mb-6">
              I stopped asking how to train better and started asking how to <strong className="text-teal">make the right behavior automatic — even under pressure</strong>. Because hope isn't a strategy, motivation isn't a system, and delayed feedback is expensive.
            </p>

            <p className="text-light leading-relaxed mb-2">What I learned was simple:</p>
            <p className="text-xl text-teal leading-relaxed mb-8">
              when behavior becomes habit, results become predictable.
            </p>

            <p className="text-light-muted leading-relaxed mb-8">
              If permanent habit change could be created, a meaningful lift in sales performance would follow — not through hype or heroics, but through structure, visibility, and timely reinforcement.
            </p>

            <p className="text-light-muted leading-relaxed mb-8">
              That thinking is what led to <strong className="text-gold">The One Click Coaching</strong>.
            </p>

            <p className="text-light-muted leading-relaxed mb-8">
              It reflects how I've always worked: measure what matters, reinforce execution before drift occurs, and coach while the moment is still alive.
            </p>

            <p className="text-light leading-relaxed mb-2">Because sales performance doesn't change in hindsight.</p>
            <p className="text-light leading-relaxed mb-2">It changes in execution.</p>
            <p className="text-xl text-teal font-semibold leading-relaxed">It changes when it matters.</p>
          </div>

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-gradient-to-r from-teal/10 to-gold/10 border border-teal/20 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-light mb-4">
              Ready to See It in Action?
            </h2>
            <p className="text-light-muted mb-6">
              Experience how AI-powered coaching creates permanent behavior change.
            </p>
            <a
              href="https://tidycal.com/aiautomations/sales-coach"
              className="inline-block bg-gradient-to-r from-teal to-aqua text-navy font-bold py-4 px-8 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
