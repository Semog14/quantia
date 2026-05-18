import React from 'react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Topbar from './Topbar'

export default function AppLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Sidebar />
      <Topbar title={title} />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
