import Link from 'next/link'
import { getBlogPosts, getAllCategories } from '@/lib/blog'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sales Coaching Blog - AI-Powered Sales Insights | Daily Tracker',
  description: 'Expert insights on sales methodologies, AI coaching, MEDDIC, Sandler, and proven techniques to improve your team\'s sales performance.',
  keywords: ['sales blog', 'sales coaching', 'MEDDIC', 'Sandler', 'sales methodology', 'AI sales', 'sales training'],
  openGraph: {
    title: 'Sales Coaching Blog | Daily Tracker',
    description: 'Expert insights on sales methodologies and AI-powered coaching',
    type: 'website',
    url: 'https://dailytracker.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sales Coaching Blog | Daily Tracker',
    description: 'Expert insights on sales methodologies and AI-powered coaching',
  },
}

export default function BlogPage() {
  const posts = getBlogPosts()
  const categories = getAllCategories()

  return (
    <div className="min-h-screen bg-navy pt-24 pb-16">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="text-teal hover:text-aqua transition-colors mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-light mb-6">
            Sales Coaching <span className="text-teal">Blog</span>
          </h1>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Expert insights on sales methodologies, AI coaching, and proven techniques to help your team close more deals.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="px-6 py-2 bg-teal text-navy font-semibold rounded-full hover:bg-aqua transition-colors">
            All Posts
          </button>
          {categories.map(category => (
            <button
              key={category}
              className="px-6 py-2 bg-navy-light text-light border border-teal/20 font-semibold rounded-full hover:border-teal hover:bg-navy transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <article className="bg-navy-light rounded-xl overflow-hidden border border-teal/10 hover:border-teal/30 transition-all duration-300 h-full flex flex-col">
                {/* Cover Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-teal/20 to-aqua/20 flex items-center justify-center">
                  <span className="text-4xl">{post.category === 'Sales Methodology' ? '📚' : '📊'}</span>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  {/* Category & Reading Time */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-teal uppercase tracking-wide">
                      {post.category}
                    </span>
                    <span className="text-xs text-light-muted">{post.readingTime}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-light mb-3 group-hover:text-teal transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-light-muted mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-teal/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center">
                        <span className="text-teal text-sm font-bold">{post.author.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-light">{post.author.name}</p>
                        <p className="text-xs text-light-muted">{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className="text-teal group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-teal/10 to-aqua/10 border border-teal/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-light mb-4">
            Want to Improve Your Team's Sales Performance?
          </h2>
          <p className="text-xl text-light-muted mb-8 max-w-2xl mx-auto">
            See how AI-powered coaching can help your team execute their methodology with precision.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-gradient-to-r from-teal to-aqua text-navy font-bold py-4 px-8 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </div>
  )
}
