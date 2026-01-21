'use client'

import { useDealership } from '@/contexts/DealershipContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, Grid3x3, Settings, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { dealership, loading } = useDealership()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido a {dealership?.name || 'tu concesionario'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categorías
            </CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Gestiona tus categorías
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Inventario total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empleados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Miembros del equipo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Configuración
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">
              Personaliza tu sitio
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inicio Rápido</CardTitle>
          <CardDescription>
            Configura tu concesionario en pocos pasos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Crea tus categorías</p>
                <p className="text-sm text-muted-foreground">Motos, Accesorios, Repuestos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">Agrega productos</p>
                <p className="text-sm text-muted-foreground">Motos, cascos, repuestos y más</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Configura tu equipo</p>
                <p className="text-sm text-muted-foreground">Agrega empleados con contacto WhatsApp</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                4
              </div>
              <div>
                <p className="font-medium">Personaliza tu landing</p>
                <p className="text-sm text-muted-foreground">Logo, banner, footer y redes sociales</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
