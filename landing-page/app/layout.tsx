import type { Metadata } from 'next'
import ChatWidget from '../components/ChatWidget'

export const metadata: Metadata = {
  title: 'One Click Coaching | Sales Methodology Execution Platform',
  description: 'The execution layer beneath your sales framework. Make methodology adherence visible, measurable, and coachable.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  )
}
