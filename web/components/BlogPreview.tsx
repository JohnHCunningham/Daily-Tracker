'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { getBlogPosts } from '@/lib/blog'

const BlogPreview = () => {
  const allPosts = getBlogPosts()
  const latestPosts = allPosts.slice(0, 3)

  if (latestPosts.length === 0) {
    return null
  }

  return (
    <section className="section-padding bg-navy border-t border-teal/10">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Latest from the <span className="text-teal">Blog</span>
          </h2>
          <p className="text-lg text-light-muted max-w-2xl mx-auto">
            Expert insights on sales methodologies, AI coaching, and proven techniques to close more deals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {latestPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className="bg-navy-light rounded-xl overflow-hidden border border-teal/10 hover:border-teal/30 transition-all duration-300 h-full flex flex-col">
                  {/* Cover Image */}
                  {post.coverImage && post.coverImage.startsWith('/blog/') ? (
                    <div className="h-40 relative overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-teal/20 to-aqua/20 flex items-center justify-center relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                      />
                      <span className="text-4xl relative z-10">
                        {post.category === 'Sales Methodology' ? '📚' : post.category === 'AI Coaching' ? '🤖' : '📊'}
                      </span>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Category */}
                    <span className="text-xs font-semibold text-teal uppercase tracking-wide mb-2">
                      {post.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-light mb-2 group-hover:text-teal transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-light-muted text-sm mb-4 line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Read More */}
                    <div className="flex items-center text-teal text-sm font-semibold group-hover:translate-x-1 transition-transform">
                      Read more →
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-navy-light border border-teal/30 text-teal font-semibold py-3 px-8 rounded-lg hover:bg-teal hover:text-navy transition-all"
          >
            View All Posts
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default BlogPreview
