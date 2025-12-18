import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Analytics from '@/components/Analytics'
import Chatbase from '@/components/Chatbase'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Sales Coaching - Turn Every Call Into a Coaching Opportunity',
  description: 'AI-powered conversation analysis that trains your team to execute your methodology—MEDDIC, Sandler, Challenger, SPIN, or Gap Selling—with precision.',
  keywords: ['sales coaching', 'AI sales', 'MEDDIC', 'Sandler', 'Challenger Sale', 'SPIN Selling', 'Gap Selling'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
        <Analytics />
        <Chatbase />
      </body>
    </html>
  )
}
