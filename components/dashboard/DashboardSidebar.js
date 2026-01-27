'use client'

import { useDealership } from '@/contexts/DealershipContext'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Grid3x3, Package, Users, Settings, Bike } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

const menuItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/categories', label: 'Categorías', icon: Grid3x3 },
  { href: '/dashboard/products', label: 'Productos', icon: Package },
  { href: '/dashboard/employees', label: 'Empleados', icon: Users },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
]

export default function DashboardSidebar() {
  const { dealership } = useDealership()
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-racing-orange-400 to-racing-orange-600 rounded-lg">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{dealership?.name || 'Cargando...'}</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-racing-orange-400 text-white font-medium'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tema</span>
          <ModeToggle />
        </div>
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Landing Page:</p>
          <Link
            href={`/catalogo/${dealership?.slug}`}
            target="_blank"
            className="text-racing-orange-400 hover:underline"
          >
            /catalogo/{dealership?.slug}
          </Link>
        </div>
      </div>
    </aside>
  )
}
