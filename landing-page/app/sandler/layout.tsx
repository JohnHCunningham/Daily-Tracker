import type { Metadata } from 'next'

const baseUrl = 'https://oneclickcoaching.com'

export const metadata: Metadata = {
  title: 'AI Coaching for Sandler Sales Teams | One Click Coaching',
  description:
    'AI-powered coaching that scores every call against 8 Sandler components and delivers coaching before the next one. Built exclusively for Sandler-trained teams.',
  keywords: [
    'Sandler sales coaching',
    'Sandler selling system AI',
    'Sandler training reinforcement',
    'Pain Funnel scoring',
    'Upfront Contract tracking',
    'Sandler franchise coaching',
    'AI sales coaching Sandler',
    'sales methodology execution',
    'training drift prevention',
    'Sandler call scoring',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${baseUrl}/sandler`,
    siteName: 'One Click Coaching',
    title: 'AI Coaching for Sandler Sales Teams | One Click Coaching',
    description:
      '84% of training is forgotten in 90 days. One Click Coaching scores every call against 8 Sandler components and delivers coaching before the next one.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'One Click Coaching - AI-Powered Sandler Sales Coaching',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Coaching for Sandler Sales Teams',
    description:
      'Score every call against 8 Sandler components. Deliver coaching before the next one.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: `${baseUrl}/sandler`,
  },
}

export default function SandlerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
