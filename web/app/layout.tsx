import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  metadataBase: new URL('https://app.oneclickcoaching.com'),
  title: 'One Click Coaching',
  description: 'Sales methodology reinforcement platform.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
