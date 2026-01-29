'use client'

import { DealershipProvider } from '@/contexts/DealershipContext'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }) {
  return (
    <DealershipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </DealershipProvider>
  )
}
