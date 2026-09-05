'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import type { User } from '@supabase/supabase-js'

interface AppShellProps {
  user: User | null
  userRole: string
  children: React.ReactNode
}

export default function AppShell({ user, userRole, children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Close sidebar when screen becomes desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar when clicking backdrop
  const handleBackdropClick = () => {
    setIsSidebarOpen(false)
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <>
      <Sidebar
        userRole={userRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-espresso/50 z-40 lg:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar
          user={user}
          userRole={userRole}
          onMenuClick={toggleSidebar}
        />
        {children}
      </div>
    </>
  )
}
