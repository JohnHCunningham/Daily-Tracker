import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Analytics from '@/components/Analytics'

const baseUrl = 'https://oneclickcoaching.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'One Click Coaching - AI-Powered Sandler Sales Coaching',
    template: '%s | One Click Coaching',
  },
  description: 'AI-powered Sandler sales coaching that reinforces your methodology training. Get instant feedback on every call. Scale coaching without scaling headcount.',
  keywords: [
    'AI sales coaching',
    'Sandler training reinforcement',
    'Sandler selling system',
    'sales methodology training',
    'sales conversation analysis',
    'sales team coaching software',
    'sales training ROI',
    'sales manager tools',
    'call coaching software',
    'sales performance analytics',
    'methodology execution tracking',
    'sales rep coaching',
    'B2B sales training',
    'enterprise sales coaching',
    'sales enablement platform',
    'conversation intelligence'
  ],
  authors: [{ name: 'One Click Coaching' }],
  creator: 'One Click Coaching',
  publisher: 'One Click Coaching',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'One Click Coaching',
    title: 'One Click Coaching - AI-Powered Sandler Sales Coaching',
    description: 'AI coaching that reinforces what your Sandler trainers taught. Same-day feedback, every call, every rep. Scale coaching without scaling headcount.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'One Click Coaching - AI-Powered Sandler Sales Coaching Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'One Click Coaching - AI-Powered Sandler Sales Coaching',
    description: 'AI coaching that reinforces what your Sandler trainers taught. Same-day feedback, every call, every rep.',
    images: ['/og-image.jpg'],
    creator: '@oneclickcoaching',
  },
  alternates: {
    canonical: baseUrl,
  },
  category: 'Sales Software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            success: {
              duration: 5000,
              style: {
                background: '#10b981',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                padding: '16px 20px',
              },
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
