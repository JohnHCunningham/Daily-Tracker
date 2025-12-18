import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBlogPost, getBlogPosts, getRelatedPosts } from '@/lib/blog'
import { Metadata } from 'next'
import { HiClock, HiCalendar, HiTag } from 'react-icons/hi'
import { FaTwitter, FaLinkedin, FaFacebook } from 'react-icons/fa'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = getBlogPosts()
  return posts.map(post => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPost(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.seo.ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [post.seo.ogImage],
    },
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(params.slug, 2)
  const shareUrl = `https://dailytracker.com/blog/${params.slug}`

  return (
    <div className="min-h-screen bg-navy pt-24 pb-16">
      <article className="container-custom max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-light-muted">
          <Link href="/" className="hover:text-teal transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-teal transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-light">{post.title}</span>
        </div>

        {/* Category Badge */}
        <div className="mb-6">
          <span className="inline-block px-4 py-1 bg-teal/20 text-teal text-sm font-semibold rounded-full">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-light mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-navy-light">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal/20 rounded-full flex items-center justify-center">
              <span className="text-teal text-lg font-bold">{post.author.name[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-light">{post.author.name}</p>
              <p className="text-sm text-light-muted">{post.author.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-light-muted">
            <div className="flex items-center gap-2">
              <HiCalendar className="text-teal" />
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <HiClock className="text-teal" />
              <span>{post.readingTime}</span>
            </div>
          </div>
        </div>

        {/* Cover Image Placeholder */}
        <div className="mb-12 h-96 bg-gradient-to-br from-teal/20 to-aqua/20 rounded-2xl flex items-center justify-center">
          <span className="text-8xl">{post.category === 'Sales Methodology' ? '📚' : '📊'}</span>
        </div>

        {/* Social Share */}
        <div className="mb-8 flex items-center gap-4">
          <span className="text-sm font-semibold text-light-muted">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-navy-light border border-teal/20 rounded-full flex items-center justify-center text-teal hover:bg-teal hover:text-navy transition-colors"
          >
            <FaTwitter />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-navy-light border border-teal/20 rounded-full flex items-center justify-center text-teal hover:bg-teal hover:text-navy transition-colors"
          >
            <FaLinkedin />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-navy-light border border-teal/20 rounded-full flex items-center justify-center text-teal hover:bg-teal hover:text-navy transition-colors"
          >
            <FaFacebook />
          </a>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none mb-12">
          <div className="text-light-muted leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-12 pb-12 border-b border-navy-light">
          <div className="flex items-center gap-3 flex-wrap">
            <HiTag className="text-teal text-xl" />
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-navy-light border border-teal/20 text-light-muted text-sm rounded-full hover:border-teal transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Author Bio */}
        <div className="mb-12 p-6 bg-navy-light border border-teal/20 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-teal/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-teal text-2xl font-bold">{post.author.name[0]}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-light mb-1">About {post.author.name}</h3>
              <p className="text-teal text-sm mb-2">{post.author.title}</p>
              <p className="text-light-muted">
                {post.author.name} is the CEO of AI Advantage Solutions, helping sales teams execute their methodology with precision using AI-powered coaching.
              </p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-light mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map(relatedPost => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group"
                >
                  <article className="bg-navy-light rounded-xl overflow-hidden border border-teal/10 hover:border-teal/30 transition-all duration-300 h-full">
                    <div className="h-40 bg-gradient-to-br from-teal/20 to-aqua/20 flex items-center justify-center">
                      <span className="text-3xl">{relatedPost.category === 'Sales Methodology' ? '📚' : '📊'}</span>
                    </div>
                    <div className="p-6">
                      <span className="text-xs font-semibold text-teal uppercase tracking-wide">
                        {relatedPost.category}
                      </span>
                      <h3 className="text-lg font-bold text-light mt-2 mb-2 group-hover:text-teal transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-light-muted text-sm line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-teal/10 to-aqua/10 border border-teal/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-light mb-4">
            Ready to Transform Your Sales Team?
          </h2>
          <p className="text-light-muted mb-6 max-w-2xl mx-auto">
            See how AI-powered coaching can help your team execute their methodology with precision and close more deals.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-gradient-to-r from-teal to-aqua text-navy font-bold py-3 px-8 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Book a Demo
          </Link>
        </div>

        {/* Schema.org JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.excerpt,
              image: post.seo.ogImage,
              author: {
                '@type': 'Person',
                name: post.author.name,
                jobTitle: post.author.title,
              },
              publisher: {
                '@type': 'Organization',
                name: 'AI Advantage Solutions',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://dailytracker.com/logo.png',
                },
              },
              datePublished: post.publishedAt,
              dateModified: post.updatedAt || post.publishedAt,
              keywords: post.seo.keywords.join(', '),
              articleSection: post.category,
              about: post.tags.map(tag => ({
                '@type': 'Thing',
                name: tag,
              })),
            }),
          }}
        />
      </article>
    </div>
  )
}
