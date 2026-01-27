'use client'

import { useEffect, useState } from 'react'
import { useDealership } from '@/contexts/DealershipContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Users, 
  Grid3x3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { dealership, loading: dealershipLoading } = useDealership()
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    soldProducts: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    recentProducts: [],
    inventoryValue: 0,
    lowStockProducts: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (dealership?.id) {
      fetchDashboardStats()
    }
  }, [dealership])

  const fetchDashboardStats = async () => {
    try {
      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('*, product_images(image_url, is_primary)')
        .eq('dealership_id', dealership.id)

      const totalProducts = products?.length || 0
      const availableProducts = products?.filter(p => p.status === 'available').length || 0
      const soldProducts = products?.filter(p => p.status === 'sold').length || 0
      const inventoryValue = products?.reduce((sum, p) => sum + (p.price || 0), 0) || 0
      const recentProducts = products?.slice(0, 5) || []

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('dealership_id', dealership.id)

      // Fetch subcategories
      const { data: subcategories } = await supabase
        .from('subcategories')
        .select('*')
        .eq('dealership_id', dealership.id)

      // Fetch employees
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('dealership_id', dealership.id)

      const totalEmployees = employees?.length || 0
      const activeEmployees = employees?.filter(e => e.is_active).length || 0

      setStats({
        totalProducts,
        availableProducts,
        soldProducts,
        totalCategories: categories?.length || 0,
        totalSubcategories: subcategories?.length || 0,
        totalEmployees,
        activeEmployees,
        recentProducts,
        inventoryValue,
        lowStockProducts: 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (dealershipLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const availabilityRate = stats.totalProducts > 0 
    ? Math.round((stats.availableProducts / stats.totalProducts) * 100) 
    : 0

  const statCards = [
    {
      title: 'Total Productos',
      value: stats.totalProducts,
      description: `${stats.availableProducts} disponibles`,
      icon: Package,
      trend: stats.availableProducts > stats.soldProducts ? 'up' : 'down',
      trendValue: availabilityRate,
      color: 'bg-blue-500',
      link: '/dashboard/products'
    },
    {
      title: 'Categorías',
      value: stats.totalCategories,
      description: `${stats.totalSubcategories} subcategorías`,
      icon: Grid3x3,
      color: 'bg-purple-500',
      link: '/dashboard/categories'
    },
    {
      title: 'Equipo',
      value: stats.totalEmployees,
      description: `${stats.activeEmployees} activos`,
      icon: Users,
      color: 'bg-green-500',
      link: '/dashboard/employees'
    },
    {
      title: 'Valor Inventario',
      value: `$${stats.inventoryValue.toLocaleString()}`,
      description: 'Total en productos',
      icon: DollarSign,
      color: 'bg-orange-500',
      link: '/dashboard/products'
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Vista general de {dealership?.name}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href={`/catalogo/${dealership?.slug}`} target="_blank">
            <Eye className="w-4 h-4" />
            Ver Sitio Público
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={index} href={stat.link}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden relative">
                <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity', stat.color)} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={cn('p-2 rounded-lg', stat.color, 'bg-opacity-10')}>
                    <Icon className={cn('h-4 w-4', stat.color.replace('bg-', 'text-'))} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    {stat.trend && (
                      <div className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {stat.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {stat.trendValue}%
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Estado del Inventario
            </CardTitle>
            <CardDescription>Distribución de productos por estado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Disponibles</p>
                    <p className="text-xs text-muted-foreground">Listos para venta</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  {stats.availableProducts}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium">Vendidos</p>
                    <p className="text-xs text-muted-foreground">Productos vendidos</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                  {stats.soldProducts}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Reservados</p>
                    <p className="text-xs text-muted-foreground">En proceso</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  {stats.totalProducts - stats.availableProducts - stats.soldProducts}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tasa de disponibilidad</span>
                <span className="font-medium">{availabilityRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${availabilityRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Productos Recientes
            </CardTitle>
            <CardDescription>Últimos productos agregados</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay productos aún</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/dashboard/products">Agregar producto</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentProducts.map((product) => {
                  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]
                  return (
                    <div 
                      key={product.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage.image_url}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {product.price && (
                            <span className="text-xs font-semibold text-primary">
                              ${product.price.toLocaleString()}
                            </span>
                          )}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              product.status === 'available' && 'bg-green-500/10 text-green-700 border-green-500/20',
                              product.status === 'sold' && 'bg-red-500/10 text-red-700 border-red-500/20'
                            )}
                          >
                            {product.status === 'available' ? 'Disponible' : 'Vendido'}
                          </Badge>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )
                })}
                <Button asChild variant="outline" className="w-full mt-3">
                  <Link href="/dashboard/products">Ver todos los productos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tu concesionario de forma rápida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:scale-105 transition-all">
              <Link href="/dashboard/products">
                <Package className="w-6 h-6 text-primary" />
                <span className="font-medium">Nuevo Producto</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:scale-105 transition-all">
              <Link href="/dashboard/categories">
                <Grid3x3 className="w-6 h-6 text-primary" />
                <span className="font-medium">Nueva Categoría</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:scale-105 transition-all">
              <Link href="/dashboard/employees">
                <Users className="w-6 h-6 text-primary" />
                <span className="font-medium">Nuevo Empleado</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:scale-105 transition-all">
              <Link href="/dashboard/settings">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="font-medium">Personalizar Sitio</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
