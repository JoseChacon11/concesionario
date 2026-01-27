'use client'

import { DealershipProvider } from '@/contexts/DealershipContext'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }) {
  return (
    <DealershipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl mx-auto p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </DealershipProvider>
  )
}
