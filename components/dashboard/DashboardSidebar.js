'use client'

import { useDealership } from '@/contexts/DealershipContext'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Grid3x3, 
  Package, 
  Users, 
  Settings, 
  ExternalLink,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Image from 'next/image'
import { useState } from 'react'

const menuItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Vista general'
  },
  { 
    href: '/dashboard/categories', 
    label: 'Categorías', 
    icon: Grid3x3,
    description: 'Gestiona categorías'
  },
  { 
    href: '/dashboard/products', 
    label: 'Productos', 
    icon: Package,
    description: 'Gestiona inventario'
  },
  { 
    href: '/dashboard/employees', 
    label: 'Empleados', 
    icon: Users,
    description: 'Gestiona equipo'
  },
  { 
    href: '/dashboard/settings', 
    label: 'Configuración', 
    icon: Settings,
    description: 'Personaliza sitio'
  },
]

function SidebarContent({ dealership, user, onNavigate }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const { signOut } = useDealership()
    await signOut()
    router.push('/login')
  }

  const initials = dealership?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  return (
    <div className="flex flex-col h-full">
      {/* Header con Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          {dealership?.logo_url ? (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-primary/20">
              <Image
                src={dealership.logo_url}
                alt={dealership.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-primary/90 to-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base leading-tight truncate">{dealership?.name || 'Cargando...'}</h2>
            <p className="text-xs text-muted-foreground">Panel de Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0',
                isActive && 'drop-shadow-sm'
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </p>
                <p className="text-xs opacity-70 truncate hidden lg:block">{item.description}</p>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 animate-pulse flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="my-3" />

      {/* Quick Actions */}
      <div className="px-3 pb-3 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-accent transition-all hover:scale-[1.02]"
          asChild
        >
          <Link href={`/catalogo/${dealership?.slug}`} target="_blank">
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">Ver Sitio Público</p>
              <p className="text-xs text-muted-foreground truncate">/{dealership?.slug}</p>
            </div>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex-1 text-xs text-muted-foreground px-2">Tema</div>
          <ModeToggle />
        </div>
      </div>

      <Separator />

      {/* User Profile */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-auto py-3 hover:bg-accent transition-all group"
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex-shrink-0">
                {dealership?.logo_url ? (
                  <AvatarImage src={dealership.logo_url} alt={dealership.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="top">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{dealership?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function DashboardSidebar() {
  const { dealership, user } = useDealership()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent dealership={dealership} user={user} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="font-bold text-lg truncate">{dealership?.name}</h1>
        </div>
        <ModeToggle />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-gradient-to-b from-card to-card/50 border-r flex-col">
        <SidebarContent dealership={dealership} user={user} onNavigate={() => {}} />
      </aside>
    </>
  )
}
